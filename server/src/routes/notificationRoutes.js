const express = require('express');
const router = express.Router();
router.param('id', (req, res, next, value) => {
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) return res.status(400).json({ success: false, message: 'Invalid record ID' });
  next();
});
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Get all notifications for a user
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [notifications] = await pool.execute(
      `SELECT n.id as notification_id,
              n.user_id,
              n.title,
              n.message,
              n.type,
              n.related_type,
              n.related_id,
              CASE WHEN nr.read_at IS NOT NULL OR (n.user_id = ? AND n.is_read = TRUE) THEN 1 ELSE 0 END AS is_read,
              COALESCE(nr.read_at, CASE WHEN n.user_id = ? THEN n.read_at ELSE NULL END) AS read_at,
              n.created_at,
              u.full_name as user_name,
              res.name as resource_name,
              r.start_time,
              r.end_time
       FROM notifications n
       LEFT JOIN notification_reads nr ON nr.notification_id=n.id AND nr.user_id=?
       LEFT JOIN users u ON n.user_id = u.id
       LEFT JOIN reservations r ON n.related_type = 'reservation' AND n.related_id = r.id
       LEFT JOIN resources res ON r.resource_id = res.id
       WHERE n.user_id = ? OR n.user_id IS NULL
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId,userId,userId,userId]
    );
    
    res.json({
      success: true,
      data: { notifications }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
});

// Get all notifications (admin only)
router.get('/all', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    const userId=req.user.id;
    const [notifications] = await pool.execute(
      `SELECT n.id as notification_id,
              n.user_id,
              n.title,
              n.message,
              n.type,
              n.related_type,
              n.related_id,
              CASE WHEN nr.read_at IS NOT NULL OR (n.user_id = ? AND n.is_read = TRUE) THEN 1 ELSE 0 END AS is_read,
              COALESCE(nr.read_at, CASE WHEN n.user_id = ? THEN n.read_at ELSE NULL END) AS read_at,
              n.created_at,
              u.full_name as user_name,
              res.name as resource_name,
              r.start_time,
              r.end_time
       FROM notifications n
       LEFT JOIN notification_reads nr ON nr.notification_id=n.id AND nr.user_id=?
       LEFT JOIN users u ON n.user_id = u.id
       LEFT JOIN reservations r ON n.related_type = 'reservation' AND n.related_id = r.id
       LEFT JOIN resources res ON r.resource_id = res.id
       ORDER BY n.created_at DESC
       LIMIT 100`,
      [userId,userId,userId]
    );
    
    res.json({
      success: true,
      data: { notifications }
    });
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
});

// Read receipts belong to the viewer. Admin audit views never change another user's inbox.
async function saveReadState(req,res,next,notificationId=null) {
  const connection=await pool.getConnection();
  try {
    await connection.beginTransaction();
    const userId=req.user.id;
    const scope=req.user.role==='admin'?'1=1':'(n.user_id=? OR n.user_id IS NULL)';
    const params=req.user.role==='admin'?[]:[userId];
    if(notificationId!==null) {
      const [[visible]]=await connection.query('SELECT n.id FROM notifications n WHERE '+scope+' AND n.id=?',[...params,notificationId]);
      if(!visible){await connection.rollback();return res.status(404).json({success:false,message:'Notification not found'});}
    }
    const suffix=notificationId===null?'':' AND n.id=?';
    const ids=notificationId===null?[]:[notificationId];
    await connection.query('INSERT IGNORE INTO notification_reads(notification_id,user_id,read_at) SELECT n.id,?,NOW() FROM notifications n WHERE '+scope+suffix,[userId,...params,...ids]);
    // Preserve compatibility with existing owner-specific readers and old notification records.
    await connection.query('UPDATE notifications n SET is_read=TRUE,read_at=COALESCE(read_at,NOW()) WHERE n.user_id=? AND n.is_read=FALSE'+suffix,[userId,...ids]);
    await connection.commit();
    res.json({success:true,message:notificationId===null?'All notifications marked as read':'Notification marked as read'});
  } catch(error) {await connection.rollback();next(error);}
  finally {connection.release();}
}
router.patch('/read-all',verifyToken,(req,res,next)=>saveReadState(req,res,next).catch(next));
router.patch('/:id/read',verifyToken,(req,res,next)=>saveReadState(req,res,next,req.params.id).catch(next));

// Delete notification
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;
    
    await pool.execute(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    
    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
});

// Create notification (admin only)
router.post('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    const { user_id, title, message, type, related_type, related_id } = req.body;
    if (!Number.isSafeInteger(Number(user_id)) || Number(user_id) < 1 || typeof title !== 'string' || !title.trim() || title.length > 255 || typeof message !== 'string' || !message.trim() || message.length > 5000 || (type && !['info','success','warning','error'].includes(type)) || (related_type && !['reservation','resource','user','system'].includes(related_type))) {
      return res.status(400).json({success:false,message:'A valid recipient, title, message and notification type are required'});
    }
    
    const [result] = await pool.execute(
      'INSERT INTO notifications (user_id, title, message, type, related_type, related_id) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, title, message, type || 'info', related_type || 'system', related_id ?? null]
    );
    
    res.status(201).json({
      success: true,
      message: 'Notification created',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating notification',
      error: error.message
    });
  }
});

module.exports = router;

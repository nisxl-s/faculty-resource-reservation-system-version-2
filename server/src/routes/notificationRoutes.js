const express = require('express');
const router = express.Router();
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
              n.is_read,
              n.read_at,
              n.created_at,
              u.full_name as user_name,
              res.name as resource_name,
              r.start_time,
              r.end_time
       FROM notifications n
       LEFT JOIN users u ON n.user_id = u.id
       LEFT JOIN reservations r ON n.related_type = 'reservation' AND n.related_id = r.id
       LEFT JOIN resources res ON r.resource_id = res.id
       WHERE n.user_id = ? OR n.user_id IS NULL
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId]
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
    
    const [notifications] = await pool.execute(
      `SELECT n.id as notification_id,
              n.user_id,
              n.title,
              n.message,
              n.type,
              n.related_type,
              n.related_id,
              n.is_read,
              n.read_at,
              n.created_at,
              u.full_name as user_name,
              res.name as resource_name,
              r.start_time,
              r.end_time
       FROM notifications n
       LEFT JOIN users u ON n.user_id = u.id
       LEFT JOIN reservations r ON n.related_type = 'reservation' AND n.related_id = r.id
       LEFT JOIN resources res ON r.resource_id = res.id
       ORDER BY n.created_at DESC
       LIMIT 100`
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

// Mark notification as read
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;
    
    await pool.execute(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification',
      error: error.message
    });
  }
});

// Mark all notifications as read
router.patch('/read-all', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    await pool.execute(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notifications',
      error: error.message
    });
  }
});

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
    
    const [result] = await pool.execute(
      'INSERT INTO notifications (user_id, title, message, type, related_type, related_id) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, title, message, type || 'info', related_type || 'system', related_id]
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

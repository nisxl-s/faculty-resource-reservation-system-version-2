const { pool } = require('../config/database');
const crypto=require('crypto');

// Submit help request
const submitHelpRequest = async (req, res) => {
  try {
    const { topic, question, priority, guest_email } = req.body;
    const userId = req.user?.id || null;

    // Validate required fields
    if (typeof topic !== 'string' || !topic.trim() || topic.length > 255 || typeof question !== 'string' || !question.trim() || question.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Topic and question are required'
      });
    }

    if (!userId && (!guest_email || !/^\S+@\S+\.\S+$/.test(guest_email))) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required for guest requests'
      });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority level'
      });
    }

    const trackingToken=userId?null:crypto.randomBytes(32).toString('hex');
    const trackingHash=trackingToken?crypto.createHash('sha256').update(trackingToken).digest('hex'):null;
    const query = `
      INSERT INTO help_requests (user_id, guest_email, topic, question, priority, status,guest_access_hash)
      VALUES (?, ?, ?, ?, ?, 'open',?)
    `;

    const [result] = await pool.execute(query, [
      userId,
      userId ? null : guest_email,
      topic,
      question,
      priority || 'medium',
      trackingHash
    ]);

    res.status(201).json({
      success: true,
      message: 'Help request submitted successfully',
      data: {
        requestId: result.insertId,
        ...(trackingToken?{tracking_token:trackingToken}:{})
      }
    });
  } catch (error) {
    console.error('Submit help request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit help request',
      error: error.message
    });
  }
};

// Get user's help requests
const getUserHelpRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 10, offset = 0 } = req.query;

    let query = `
      SELECT 
        h.id,
        h.topic,
        h.question,
        h.priority,
        h.status,
        h.admin_response,
        h.responded_at,
        h.created_at,
        h.updated_at,
        u.full_name as responded_by_name
      FROM help_requests h
      LEFT JOIN users u ON h.responded_by = u.id
      WHERE h.user_id = ?
    `;

    const queryParams = [userId];

    if (status) {
      query += ` AND h.status = ?`;
      queryParams.push(status);
    }

    query += ` ORDER BY h.created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const [requests] = await pool.execute(query, queryParams);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM help_requests WHERE user_id = ?`;
    const countParams = [userId];
    
    if (status) {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }

    const [countResult] = await pool.execute(countQuery, countParams);

    res.json({
      success: true,
      data: {
        requests,
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Get user help requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch help requests',
      error: error.message
    });
  }
};

// Get single help request details
const getHelpRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const query = `
      SELECT 
        h.id,
        h.topic,
        h.question,
        h.priority,
        h.status,
        h.admin_response,
        h.responded_at,
        h.created_at,
        h.updated_at,
        u.full_name as responded_by_name,
        u.email as responded_by_email
      FROM help_requests h
      LEFT JOIN users u ON h.responded_by = u.id
      WHERE h.id = ? AND h.user_id = ?
    `;

    const [result] = await pool.execute(query, [id, userId]);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Help request not found'
      });
    }

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Get help request by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch help request',
      error: error.message
    });
  }
};

// Admin: Get all help requests
const getAllHelpRequests = async (req, res) => {
  try {
    const { status, priority, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT 
        h.id,
        h.topic,
        h.question,
        h.priority,
        h.status,
        h.admin_response,
        h.responded_at,
        h.created_at,
        h.updated_at,
        u1.full_name as user_name,
        COALESCE(u1.email, h.guest_email) as user_email,
        u1.phone as user_phone,
        u2.full_name as responded_by_name
      FROM help_requests h
      LEFT JOIN users u1 ON h.user_id = u1.id
      LEFT JOIN users u2 ON h.responded_by = u2.id
      WHERE 1=1
    `;

    const queryParams = [];

    if (status) {
      query += ` AND h.status = ?`;
      queryParams.push(status);
    }

    if (priority) {
      query += ` AND h.priority = ?`;
      queryParams.push(priority);
    }

    query += ` ORDER BY 
      CASE h.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      h.created_at DESC
      LIMIT ? OFFSET ?
    `;
    queryParams.push(parseInt(limit), parseInt(offset));

    const [requests] = await pool.execute(query, queryParams);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM help_requests WHERE 1=1`;
    const countParams = [];
    
    if (status) {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }
    
    if (priority) {
      countQuery += ` AND priority = ?`;
      countParams.push(priority);
    }

    const [countResult] = await pool.execute(countQuery, countParams);

    res.json({
      success: true,
      data: {
        requests,
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Get all help requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch help requests',
      error: error.message
    });
  }
};

// Admin: Respond to help request
const respondToHelpRequest = async (req, res) => {
  const connection=await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { admin_response, status } = req.body;
    const adminId = req.user.id;

    if (!admin_response) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Response message is required'
      });
    }

    const query = `
      UPDATE help_requests
      SET admin_response = ?,
          status = ?,
          responded_at = NOW(),
          responded_by = ?
      WHERE id = ?
    `;

    const [result] = await connection.execute(query, [
      admin_response,
      status || 'in_progress',
      adminId,
      id
    ]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Help request not found'
      });
    }

    const [[owner]]=await connection.query("SELECT COALESCE(u.email,t.guest_email) AS email FROM help_requests t LEFT JOIN users u ON u.id=t.user_id WHERE t.id=?",[id]);
    if(owner?.email) await require('../services/emailService').queueEmail({to:owner.email,subject:'Help request #'+id+' has a reply',text:admin_response+'\nStatus: '+(status||'in_progress')+'\n'+require('../services/emailService').clientUrl()},connection);
    await connection.commit();
    res.json({
      success: true,
      message: 'Response submitted successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Respond to help request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit response',
      error: error.message
    });
  } finally {connection.release();}
};

// Admin: Update help request status
const updateHelpRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const query = `UPDATE help_requests SET status = ? WHERE id = ?`;
    const [result] = await pool.execute(query, [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Help request not found'
      });
    }

    res.json({
      success: true,
      message: 'Status updated successfully'
    });
  } catch (error) {
    console.error('Update help request status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
};

module.exports = {
  submitHelpRequest,
  getUserHelpRequests,
  getHelpRequestById,
  getAllHelpRequests,
  respondToHelpRequest,
  updateHelpRequestStatus
};

module.exports.trackGuestRequest=async(req,res,next)=>{
  try {
    const {id,token}=req.body;
    if(!Number.isSafeInteger(Number(id))||Number(id)<1||typeof token!=='string'||! /^[a-f0-9]{64}$/.test(token))return res.status(400).json({success:false,message:'Enter a valid request number and tracking code'});
    const hash=crypto.createHash('sha256').update(token).digest('hex');
    const [[request]]=await pool.query('SELECT id,topic,question,status,admin_response,responded_at,created_at FROM help_requests WHERE id=? AND user_id IS NULL AND guest_access_hash=?',[id,hash]);
    if(!request)return res.status(404).json({success:false,message:'Request not found or tracking code is incorrect'});
    res.set('Cache-Control','no-store');res.json({success:true,data:{request}});
  }catch(error){next(error);}
};

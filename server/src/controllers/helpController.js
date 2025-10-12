const db = require('../config/database');

// Submit help request
const submitHelpRequest = async (req, res) => {
  try {
    const { topic, question, priority } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!topic || !question) {
      return res.status(400).json({
        success: false,
        message: 'Topic and question are required'
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

    const query = `
      INSERT INTO help_requests (user_id, topic, question, priority, status)
      VALUES (?, ?, ?, ?, 'open')
    `;

    const [result] = await db.execute(query, [
      userId,
      topic,
      question,
      priority || 'medium'
    ]);

    res.status(201).json({
      success: true,
      message: 'Help request submitted successfully',
      data: {
        requestId: result.insertId
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

    const [requests] = await db.execute(query, queryParams);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM help_requests WHERE user_id = ?`;
    const countParams = [userId];
    
    if (status) {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }

    const [countResult] = await db.execute(countQuery, countParams);

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

    const [result] = await db.execute(query, [id, userId]);

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
        u1.email as user_email,
        u1.phone as user_phone,
        u2.full_name as responded_by_name
      FROM help_requests h
      JOIN users u1 ON h.user_id = u1.id
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

    const [requests] = await db.execute(query, queryParams);

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

    const [countResult] = await db.execute(countQuery, countParams);

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
  try {
    const { id } = req.params;
    const { admin_response, status } = req.body;
    const adminId = req.user.id;

    if (!admin_response) {
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

    const [result] = await db.execute(query, [
      admin_response,
      status || 'in_progress',
      adminId,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Help request not found'
      });
    }

    res.json({
      success: true,
      message: 'Response submitted successfully'
    });
  } catch (error) {
    console.error('Respond to help request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit response',
      error: error.message
    });
  }
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
    const [result] = await db.execute(query, [status, id]);

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

const db = require('../config/database');

// Submit feedback
const submitFeedback = async (req, res) => {
  try {
    const { category, subject, message, rating } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    // Validate category
    const validCategories = ['bug', 'feature', 'improvement', 'general', 'other'];
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const query = `
      INSERT INTO feedback (user_id, category, subject, message, rating, status)
      VALUES (?, ?, ?, ?, ?, 'new')
    `;

    const [result] = await db.execute(query, [
      userId,
      category || 'general',
      subject,
      message,
      rating || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        feedbackId: result.insertId
      }
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
};

// Get user's feedback history
const getUserFeedback = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 10, offset = 0 } = req.query;

    let query = `
      SELECT 
        f.id,
        f.category,
        f.subject,
        f.message,
        f.rating,
        f.status,
        f.admin_response,
        f.responded_at,
        f.created_at,
        f.updated_at,
        u.full_name as responded_by_name
      FROM feedback f
      LEFT JOIN users u ON f.responded_by = u.id
      WHERE f.user_id = ?
    `;

    const queryParams = [userId];

    if (status) {
      query += ` AND f.status = ?`;
      queryParams.push(status);
    }

    query += ` ORDER BY f.created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const [feedback] = await db.execute(query, queryParams);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM feedback WHERE user_id = ?`;
    const countParams = [userId];
    
    if (status) {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }

    const [countResult] = await db.execute(countQuery, countParams);

    res.json({
      success: true,
      data: {
        feedback,
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Get user feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
};

// Get single feedback details
const getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const query = `
      SELECT 
        f.id,
        f.category,
        f.subject,
        f.message,
        f.rating,
        f.status,
        f.admin_response,
        f.responded_at,
        f.created_at,
        f.updated_at,
        u.full_name as responded_by_name,
        u.email as responded_by_email
      FROM feedback f
      LEFT JOIN users u ON f.responded_by = u.id
      WHERE f.id = ? AND f.user_id = ?
    `;

    const [result] = await db.execute(query, [id, userId]);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Get feedback by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
};

// Admin: Get all feedback
const getAllFeedback = async (req, res) => {
  try {
    const { status, category, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT 
        f.id,
        f.category,
        f.subject,
        f.message,
        f.rating,
        f.status,
        f.admin_response,
        f.responded_at,
        f.created_at,
        f.updated_at,
        u1.full_name as user_name,
        u1.email as user_email,
        u2.full_name as responded_by_name
      FROM feedback f
      JOIN users u1 ON f.user_id = u1.id
      LEFT JOIN users u2 ON f.responded_by = u2.id
      WHERE 1=1
    `;

    const queryParams = [];

    if (status) {
      query += ` AND f.status = ?`;
      queryParams.push(status);
    }

    if (category) {
      query += ` AND f.category = ?`;
      queryParams.push(category);
    }

    query += ` ORDER BY f.created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const [feedback] = await db.execute(query, queryParams);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM feedback WHERE 1=1`;
    const countParams = [];
    
    if (status) {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }
    
    if (category) {
      countQuery += ` AND category = ?`;
      countParams.push(category);
    }

    const [countResult] = await db.execute(countQuery, countParams);

    res.json({
      success: true,
      data: {
        feedback,
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Get all feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
};

// Admin: Respond to feedback
const respondToFeedback = async (req, res) => {
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
      UPDATE feedback
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
        message: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      message: 'Response submitted successfully'
    });
  } catch (error) {
    console.error('Respond to feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit response',
      error: error.message
    });
  }
};

module.exports = {
  submitFeedback,
  getUserFeedback,
  getFeedbackById,
  getAllFeedback,
  respondToFeedback
};

const { pool } = require('../config/database');

class Reservation {
  // Create a new reservation
  static async create(reservationData) {
    const { user_id, resource_id, start_time, end_time, purpose, notes } = reservationData;
    
    const query = `
      INSERT INTO reservations (user_id, resource_id, start_time, end_time, purpose, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `;
    
    const [result] = await pool.query(query, [
      user_id,
      resource_id,
      start_time,
      end_time,
      purpose,
      notes
    ]);
    
    return result.insertId;
  }

  // Get all reservations with user and resource details
  static async findAll(filters = {}) {
    let query = `
      SELECT 
        r.*,
        u.full_name as user_name,
        u.email as user_email,
        u.role as user_role,
        res.name as resource_name,
        res.type as resource_type,
        res.building,
        res.location
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      JOIN resources res ON r.resource_id = res.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.user_id) {
      query += ' AND r.user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.resource_id) {
      query += ' AND r.resource_id = ?';
      params.push(filters.resource_id);
    }

    if (filters.status) {
      query += ' AND r.status = ?';
      params.push(filters.status);
    }

    if (filters.date) {
      query += ' AND DATE(r.start_time) = ?';
      params.push(filters.date);
    }

    query += ' ORDER BY r.start_time DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  // Find reservation by ID
  static async findById(id) {
    const query = `
      SELECT 
        r.*,
        u.full_name as user_name,
        u.email as user_email,
        u.role as user_role,
        u.department as user_department,
        res.name as resource_name,
        res.type as resource_type,
        res.building,
        res.location,
        res.capacity
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      JOIN resources res ON r.resource_id = res.id
      WHERE r.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // Get user's reservations
  static async findByUserId(userId, status = null) {
    let query = `
      SELECT 
        r.*,
        res.name as resource_name,
        res.type as resource_type,
        res.building,
        res.location
      FROM reservations r
      JOIN resources res ON r.resource_id = res.id
      WHERE r.user_id = ?
    `;
    const params = [userId];

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }

    query += ' ORDER BY r.start_time DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  // Update reservation
  static async update(id, reservationData) {
    const { start_time, end_time, purpose, notes, status } = reservationData;
    
    const query = `
      UPDATE reservations 
      SET start_time = ?, end_time = ?, purpose = ?, notes = ?, status = ?
      WHERE id = ?
    `;
    
    await pool.query(query, [start_time, end_time, purpose, notes, status, id]);
    return true;
  }

  // Update reservation status
  static async updateStatus(id, status) {
    const query = 'UPDATE reservations SET status = ? WHERE id = ?';
    await pool.query(query, [status, id]);
    return true;
  }

  // Cancel reservation
  static async cancel(id, userId) {
    const query = `
      UPDATE reservations 
      SET status = 'cancelled' 
      WHERE id = ? AND user_id = ?
    `;
    const [result] = await pool.query(query, [id, userId]);
    return result.affectedRows > 0;
  }

  // Delete reservation
  static async delete(id) {
    const query = 'DELETE FROM reservations WHERE id = ?';
    await pool.query(query, [id]);
    return true;
  }

  // Get upcoming reservations
  static async getUpcoming(userId = null, limit = 10) {
    let query = `
      SELECT 
        r.*,
        u.full_name as user_name,
        res.name as resource_name,
        res.type as resource_type,
        res.building,
        res.location
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      JOIN resources res ON r.resource_id = res.id
      WHERE r.start_time > NOW()
        AND r.status = 'approved'
    `;
    const params = [];

    if (userId) {
      query += ' AND r.user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY r.start_time ASC LIMIT ?';
    params.push(limit);

    const [rows] = await pool.query(query, params);
    return rows;
  }

  // Get reservation statistics
  static async getStats(userId = null) {
    let query = `
      SELECT 
        status,
        COUNT(*) as count
      FROM reservations
    `;
    const params = [];

    if (userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }

    query += ' GROUP BY status';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  // Check for conflicts
  static async checkConflict(resourceId, startTime, endTime, excludeId = null) {
    let query = `
      SELECT COUNT(*) as count
      FROM reservations
      WHERE resource_id = ?
        AND status NOT IN ('cancelled', 'rejected')
        AND (
          (start_time <= ? AND end_time > ?) OR
          (start_time < ? AND end_time >= ?) OR
          (start_time >= ? AND end_time <= ?)
        )
    `;
    
    const params = [resourceId, startTime, startTime, endTime, endTime, startTime, endTime];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].count > 0;
  }

  // Get conflicting reservations with details (for better error messages)
  static async getConflictingReservations(resourceId, startTime, endTime, excludeId = null) {
    let query = `
      SELECT 
        r.id,
        r.start_time,
        r.end_time,
        r.status,
        u.full_name as user_name
      FROM reservations r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.resource_id = ?
        AND r.status NOT IN ('cancelled', 'rejected')
        AND (
          (r.start_time <= ? AND r.end_time > ?) OR
          (r.start_time < ? AND r.end_time >= ?) OR
          (r.start_time >= ? AND r.end_time <= ?)
        )
    `;
    
    const params = [resourceId, startTime, startTime, endTime, endTime, startTime, endTime];

    if (excludeId) {
      query += ' AND r.id != ?';
      params.push(excludeId);
    }

    query += ' ORDER BY r.start_time ASC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  // Get reservations for a specific date
  static async findByDate(date, resourceId = null) {
    let query = `
      SELECT 
        r.*,
        u.full_name as user_name,
        res.name as resource_name,
        res.type as resource_type
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      JOIN resources res ON r.resource_id = res.id
      WHERE DATE(r.start_time) = ?
        AND r.status NOT IN ('cancelled', 'rejected')
    `;
    const params = [date];

    if (resourceId) {
      query += ' AND r.resource_id = ?';
      params.push(resourceId);
    }

    query += ' ORDER BY r.start_time ASC';

    const [rows] = await pool.query(query, params);
    return rows;
  }
}

module.exports = Reservation;

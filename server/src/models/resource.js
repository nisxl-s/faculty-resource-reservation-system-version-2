const { pool } = require('../config/database');

class Resource {
  // Create a new resource
  static async create(resourceData) {
    const { name, type, building, location, capacity, description, status } = resourceData;
    
    const query = `
      INSERT INTO resources (name, type, building, location, capacity, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(query, [
      name,
      type,
      building,
      location,
      capacity,
      description,
      status || 'available'
    ]);
    
    return result.insertId;
  }

  // Get all resources
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM resources WHERE 1=1';
    const params = [];

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.building) {
      query += ' AND building = ?';
      params.push(filters.building);
    }

    query += ' ORDER BY name ASC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  // Find resource by ID
  static async findById(id) {
    const query = 'SELECT * FROM resources WHERE id = ?';
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // Update resource
  static async update(id, resourceData) {
    const { name, type, building, location, capacity, description, status } = resourceData;
    
    const query = `
      UPDATE resources 
      SET name = ?, type = ?, building = ?, location = ?, capacity = ?, description = ?, status = ?
      WHERE id = ?
    `;
    
    await pool.query(query, [name, type, building, location, capacity, description, status, id]);
    return true;
  }

  // Delete resource
  static async delete(id) {
    const query = 'DELETE FROM resources WHERE id = ?';
    await pool.query(query, [id]);
    return true;
  }

  // Check resource availability for a time slot
  static async checkAvailability(resourceId, startTime, endTime, excludeReservationId = null) {
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

    if (excludeReservationId) {
      query += ' AND id != ?';
      params.push(excludeReservationId);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].count === 0;
  }

  // Get resource statistics
  static async getStats() {
    const query = `
      SELECT 
        type,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_count
      FROM resources
      GROUP BY type
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // Get popular resources (most booked)
  static async getPopular(limit = 5) {
    const query = `
      SELECT 
        r.*,
        COUNT(res.id) as booking_count
      FROM resources r
      LEFT JOIN reservations res ON r.id = res.resource_id
      WHERE res.status = 'approved'
      GROUP BY r.id
      ORDER BY booking_count DESC
      LIMIT ?
    `;
    const [rows] = await pool.query(query, [limit]);
    return rows;
  }

  // Get available resources for a specific time slot
  static async findAvailableForTimeSlot(startTime, endTime, type = null) {
    let query = `
      SELECT r.*
      FROM resources r
      WHERE r.status = 'available'
        AND r.id NOT IN (
          SELECT resource_id
          FROM reservations
          WHERE status NOT IN ('cancelled', 'rejected')
            AND (
              (start_time <= ? AND end_time > ?) OR
              (start_time < ? AND end_time >= ?) OR
              (start_time >= ? AND end_time <= ?)
            )
        )
    `;
    
    const params = [startTime, startTime, endTime, endTime, startTime, endTime];

    if (type) {
      query += ' AND r.type = ?';
      params.push(type);
    }

    query += ' ORDER BY r.name ASC';

    const [rows] = await pool.query(query, params);
    return rows;
  }
}

module.exports = Resource;

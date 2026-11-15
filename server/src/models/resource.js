const { normalizeCatalog, validateParent } = require('../utils/catalog');
const { httpError } = require('../utils/httpError');
const { parseDetails } = require('../utils/resourceDetails');
const { pool } = require('../config/database');

function parseImages(imagesField) {
  if (!imagesField) return [];
  if (Array.isArray(imagesField)) return imagesField;
  if (typeof imagesField === 'string') {
    try {
      const parsed = JSON.parse(imagesField);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      return [imagesField];
    }
  }
  return [];
}

function serializeImages(images) {
  if (!images) return null;
  if (Array.isArray(images)) return JSON.stringify(images);
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? images : JSON.stringify([images]);
    } catch (e) {
      return JSON.stringify([images]);
    }
  }
  return null;
}

class Resource {
  // Create a new resource
  static async create(resourceData) {
    const { name, type, building, location, capacity, description, status, images, details } = resourceData;
    
    const catalog = normalizeCatalog(resourceData);
    await validateParent(pool, {...resourceData,...catalog});
    const imagesJson = serializeImages(images);

    const query = `
      INSERT INTO resources (name, type, building, location, capacity, description, status, images, details, faculty_code,asset_code,floor,sharing_scope,parent_resource_id,computer_count,is_sample)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(query, [
      name,
      type,
      catalog.building,
      catalog.location,
      type === 'equipment' ? null : capacity,
      description,
      status || 'available',
      imagesJson,
      JSON.stringify(details || {}),
      catalog.faculty_code,catalog.asset_code,catalog.floor,catalog.sharing_scope,catalog.parent_resource_id,catalog.computer_count,catalog.is_sample
    ]);
    
    return result.insertId;
  }

  // Get all resources
  static async findAll(filters = {}, page = { limit: 100, offset: 0 }) {
    let query = 'SELECT * FROM resources WHERE is_archived=0';
    const params = [];

    if (filters.faculty_code) { query += ' AND faculty_code = ?'; params.push(filters.faculty_code); }
    if (filters.sharing_scope) { query += ' AND sharing_scope = ?'; params.push(filters.sharing_scope); }
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

    query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(page.limit, page.offset);

    const [rows] = await pool.query(query, params);
    return rows.map(r => ({
      ...r,
      details: parseDetails(r.details),
      images: parseImages(r.images)
    }));
  }

  // Find resource by ID
  static async findById(id) {
    const query = 'SELECT * FROM resources WHERE id = ?';
    const [rows] = await pool.query(query, [id]);
    if (!rows[0]) return null;
    return {
      ...rows[0],
      details: parseDetails(rows[0].details),
      images: parseImages(rows[0].images)
    };
  }

  // Update resource
  static async update(id, resourceData) {
    const catalog=normalizeCatalog(resourceData);
    await validateParent(pool,{...resourceData,...catalog},id);
    const [[children]]=await pool.query('SELECT COUNT(*) AS count FROM resources WHERE parent_resource_id=?',[id]);
    if(children.count) {
      const current=await this.findById(id);
      if(resourceData.type==='equipment'||['faculty_code','building','floor','location'].some(key=>catalog[key]!==current[key])) throw httpError(400,'Reassign linked equipment before moving or changing this venue');
    }
    const { name, type, building, location, capacity, description, status, images, details } = resourceData;
    
    const imagesJson = serializeImages(images);

    const query = `
      UPDATE resources 
      SET name = ?, type = ?, building = ?, location = ?, capacity = ?, description = ?, status = ?, images = ?, details = ?, faculty_code=?,asset_code=?,floor=?,sharing_scope=?,parent_resource_id=?,computer_count=?,is_sample=?
      WHERE id = ? AND is_archived=0
    `;
    
    await pool.query(query, [name, type, catalog.building, catalog.location, type === 'equipment' ? null : capacity, description, status, imagesJson, JSON.stringify(details || {}),catalog.faculty_code,catalog.asset_code,catalog.floor,catalog.sharing_scope,catalog.parent_resource_id,catalog.computer_count,catalog.is_sample,id]);
    return true;
  }

  // Delete resource
  static async delete(id) {
    const [[linked]]=await pool.query('SELECT COUNT(*) AS count FROM resources WHERE parent_resource_id=?',[id]);
    if(linked.count)throw httpError(409,'Reassign linked equipment before deleting this venue');
    const [[bookings]]=await pool.query('SELECT COUNT(*) AS count FROM reservations WHERE resource_id=?',[id]);
    if(bookings.count)throw httpError(409,'This resource has reservation history. Mark it unavailable instead.');
    const query = 'DELETE FROM resources WHERE id = ?';
    await pool.query(query, [id]);
    return true;
  }

  // Check resource availability for a time slot
  static async getCalendar(resourceId, start, end) {
    const [[resource]] = await pool.query('SELECT id, status FROM resources WHERE id = ? AND is_archived = 0', [resourceId]);
    if (!resource) return null;
    // Clip multi-day reservations to this month; never select booking identity/details.
    const [bookings] = await pool.query(`
      SELECT DATE_FORMAT(GREATEST(start_time, ?), '%Y-%m-%dT%H:%i:%s') AS start_time,
             DATE_FORMAT(LEAST(end_time, ?), '%Y-%m-%dT%H:%i:%s') AS end_time
      FROM reservations
      WHERE resource_id = ? AND status IN ('pending', 'approved')
        AND start_time < ? AND end_time > ?
      ORDER BY start_time ASC, end_time ASC
    `, [start, end, resourceId, end, start]);
    return { status: resource.status, bookings };
  }

  static async checkAvailability(resourceId, startTime, endTime, excludeReservationId = null) {
    let query = `
      SELECT COUNT(*) as count
      FROM reservations
      WHERE resource_id = ?
        AND status NOT IN ('cancelled', 'rejected')
        AND start_time < ? AND end_time > ?
    `;
    
    const params = [resourceId, endTime, startTime];

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
      FROM resources WHERE is_archived=0
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
      WHERE r.is_archived=0 AND res.status = 'approved'
      GROUP BY r.id
      ORDER BY booking_count DESC
      LIMIT ?
    `;
    const [rows] = await pool.query(query, [limit]);
    return rows.map(r => ({
      ...r,
      details: parseDetails(r.details),
      images: parseImages(r.images)
    }));
  }

  // Get available resources for a specific time slot
  static async findAvailableForTimeSlot(startTime, endTime, type = null, attendees = null) {
    let query = `
      SELECT r.*
      FROM resources r
      WHERE r.is_archived=0 AND r.status = 'available'
        AND r.id NOT IN (
          SELECT resource_id
          FROM reservations
          WHERE status IN ('pending', 'approved')
            AND start_time < ? AND end_time > ?
        )
    `;
    
    const params = [endTime, startTime];

    if (type) {
      query += ' AND r.type = ?';
      params.push(type);
    }

    if (attendees !== null) {
      query += " AND r.type <> 'equipment' AND r.capacity >= ?";
      params.push(attendees);
    }
    query += attendees !== null ? ' ORDER BY r.capacity ASC, r.name ASC' : ' ORDER BY r.name ASC';

    const [rows] = await pool.query(query, params);
    return rows.map(r => ({
      ...r,
      details: parseDetails(r.details),
      images: parseImages(r.images)
    }));
  }
}

module.exports = Resource;

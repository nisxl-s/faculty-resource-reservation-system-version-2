
const { promisePool } = require('../config/database');
const logger = require('../utils/logger');

class Resource {
    /**
     * Create a new resource
     * @param {Object} resourceData - Resource data
     * @returns {Promise<Object>} Created resource
     */
    static async create(resourceData) {
        try {
            const {
                name,
                type,
                faculty,
                building,
                capacity,
                location,
                equipment,
                status = 'available',
                description
            } = resourceData;

            const equipmentJson = JSON.stringify(equipment || []);

            const [result] = await promisePool.query(
                `INSERT INTO resources (name, type, faculty, building, capacity, location, equipment, status, description)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, type, faculty, building, capacity, location, equipmentJson, status, description]
            );

            return await this.findById(result.insertId);
        } catch (error) {
            logger.error('Error creating resource:', error);
            throw error;
        }
    }

    /**
     * Find resource by ID
     * @param {Number} resourceId - Resource ID
     * @returns {Promise<Object>} Resource object
     */
    static async findById(resourceId) {
        try {
            const [rows] = await promisePool.query(
                'SELECT * FROM resources WHERE resource_id = ?',
                [resourceId]
            );
            
            if (rows[0] && rows[0].equipment) {
                rows[0].equipment = JSON.parse(rows[0].equipment);
            }
            
            return rows[0] || null;
        } catch (error) {
            logger.error('Error finding resource by ID:', error);
            throw error;
        }
    }

    /**
     * Get all resources with optional filtering
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} Array of resources
     */
    static async findAll(filters = {}) {
        try {
            let query = 'SELECT * FROM resources WHERE 1=1';
            const params = [];

            if (filters.type) {
                query += ' AND type = ?';
                params.push(filters.type);
            }

            if (filters.faculty) {
                query += ' AND faculty = ?';
                params.push(filters.faculty);
            }

            if (filters.status) {
                query += ' AND status = ?';
                params.push(filters.status);
            }

            if (filters.building) {
                query += ' AND building = ?';
                params.push(filters.building);
            }

            if (filters.capacity) {
                query += ' AND capacity >= ?';
                params.push(filters.capacity);
            }

            if (filters.search) {
                query += ' AND (name LIKE ? OR description LIKE ? OR location LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            query += ' ORDER BY name ASC';

            const [rows] = await promisePool.query(query, params);
            
            // Parse equipment JSON for each resource
            rows.forEach(row => {
                if (row.equipment) {
                    try {
                        row.equipment = JSON.parse(row.equipment);
                    } catch (e) {
                        row.equipment = [];
                    }
                }
            });
            
            return rows;
        } catch (error) {
            logger.error('Error finding all resources:', error);
            throw error;
        }
    }

    /**
     * Update resource
     * @param {Number} resourceId - Resource ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated resource
     */
    static async update(resourceId, updateData) {
        try {
            const allowedFields = ['name', 'type', 'faculty', 'building', 'capacity', 'location', 'equipment', 'status', 'description'];
            const updates = [];
            const values = [];

            Object.keys(updateData).forEach(key => {
                if (allowedFields.includes(key) && updateData[key] !== undefined) {
                    if (key === 'equipment') {
                        updates.push(`${key} = ?`);
                        values.push(JSON.stringify(updateData[key]));
                    } else {
                        updates.push(`${key} = ?`);
                        values.push(updateData[key]);
                    }
                }
            });

            if (updates.length === 0) {
                throw new Error('No valid fields to update');
            }

            values.push(resourceId);

            await promisePool.query(
                `UPDATE resources SET ${updates.join(', ')} WHERE resource_id = ?`,
                values
            );

            return await this.findById(resourceId);
        } catch (error) {
            logger.error('Error updating resource:', error);
            throw error;
        }
    }

    /**
     * Delete resource
     * @param {Number} resourceId - Resource ID
     * @returns {Promise<Boolean>} Success status
     */
    static async delete(resourceId) {
        try {
            await promisePool.query('DELETE FROM resources WHERE resource_id = ?', [resourceId]);
            return true;
        } catch (error) {
            logger.error('Error deleting resource:', error);
            throw error;
        }
    }

    /**
     * Get resource statistics
     * @returns {Promise<Object>} Resource statistics
     */
    static async getStatistics() {
        try {
            const [stats] = await promisePool.query(`
                SELECT 
                    COUNT(*) as total_resources,
                    SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
                    SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied,
                    SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance,
                    SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved,
                    SUM(CASE WHEN type = 'laboratory' THEN 1 ELSE 0 END) as laboratories,
                    SUM(CASE WHEN type = 'lecture-hall' THEN 1 ELSE 0 END) as lecture_halls,
                    SUM(CASE WHEN type = 'auditorium' THEN 1 ELSE 0 END) as auditoriums,
                    SUM(CASE WHEN type = 'meeting-room' THEN 1 ELSE 0 END) as meeting_rooms
                FROM resources
            `);
            return stats[0];
        } catch (error) {
            logger.error('Error getting resource statistics:', error);
            throw error;
        }
    }

    /**
     * Get available resources for specific date and time
     * @param {String} date - Date
     * @param {String} startTime - Start time
     * @param {String} endTime - End time
     * @param {Object} filters - Additional filters
     * @returns {Promise<Array>} Array of available resources
     */
    static async findAvailable(date, startTime, endTime, filters = {}) {
        try {
            let query = `
                SELECT r.* FROM resources r
                WHERE r.status = 'available'
                AND r.resource_id NOT IN (
                    SELECT resource_id FROM bookings
                    WHERE date = ?
                    AND status IN ('approved', 'pending')
                    AND (
                        (start_time <= ? AND end_time > ?)
                        OR (start_time < ? AND end_time >= ?)
                        OR (start_time >= ? AND end_time <= ?)
                    )
                )
            `;
            const params = [date, startTime, startTime, endTime, endTime, startTime, endTime];

            if (filters.type) {
                query += ' AND r.type = ?';
                params.push(filters.type);
            }

            if (filters.faculty) {
                query += ' AND r.faculty = ?';
                params.push(filters.faculty);
            }

            if (filters.capacity) {
                query += ' AND r.capacity >= ?';
                params.push(filters.capacity);
            }

            query += ' ORDER BY r.name ASC';

            const [rows] = await promisePool.query(query, params);
            
            // Parse equipment JSON
            rows.forEach(row => {
                if (row.equipment) {
                    try {
                        row.equipment = JSON.parse(row.equipment);
                    } catch (e) {
                        row.equipment = [];
                    }
                }
            });
            
            return rows;
        } catch (error) {
            logger.error('Error finding available resources:', error);
            throw error;
        }
    }

    /**
     * Get resource schedule for a specific date
     * @param {Number} resourceId - Resource ID
     * @param {String} date - Date
     * @returns {Promise<Array>} Array of time slots
     */
    static async getSchedule(resourceId, date) {
        try {
            const [bookings] = await promisePool.query(
                `SELECT start_time, end_time, status, title 
                 FROM bookings 
                 WHERE resource_id = ? AND date = ? AND status IN ('approved', 'pending')
                 ORDER BY start_time`,
                [resourceId, date]
            );

            // Generate time slots from 8:00 to 18:00
            const timeSlots = [];
            for (let hour = 8; hour < 18; hour++) {
                const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
                const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`;
                
                // Check if this slot is booked
                const isBooked = bookings.some(booking => {
                    const bookingStart = booking.start_time;
                    const bookingEnd = booking.end_time;
                    return (bookingStart <= startTime && bookingEnd > startTime) ||
                           (bookingStart < endTime && bookingEnd >= endTime) ||
                           (bookingStart >= startTime && bookingEnd <= endTime);
                });

                timeSlots.push({
                    start_time: startTime,
                    end_time: endTime,
                    status: isBooked ? 'booked' : 'available'
                });
            }

            return timeSlots;
        } catch (error) {
            logger.error('Error getting resource schedule:', error);
            throw error;
        }
    }

    /**
     * Check if resource is available for booking
     * @param {Number} resourceId - Resource ID
     * @param {String} date - Date
     * @param {String} startTime - Start time
     * @param {String} endTime - End time
     * @param {Number} excludeBookingId - Booking ID to exclude (for updates)
     * @returns {Promise<Boolean>} Availability status
     */
    static async checkAvailability(resourceId, date, startTime, endTime, excludeBookingId = null) {
        try {
            let query = `
                SELECT COUNT(*) as conflicts
                FROM bookings
                WHERE resource_id = ?
                AND date = ?
                AND status IN ('approved', 'pending')
                AND (
                    (start_time <= ? AND end_time > ?)
                    OR (start_time < ? AND end_time >= ?)
                    OR (start_time >= ? AND end_time <= ?)
                )
            `;
            const params = [resourceId, date, startTime, startTime, endTime, endTime, startTime, endTime];

            if (excludeBookingId) {
                query += ' AND booking_id != ?';
                params.push(excludeBookingId);
            }

            const [result] = await promisePool.query(query, params);
            return result[0].conflicts === 0;
        } catch (error) {
            logger.error('Error checking resource availability:', error);
            throw error;
        }
    }

    /**
     * Get resources by type
     * @param {String} type - Resource type
     * @returns {Promise<Array>} Array of resources
     */
    static async findByType(type) {
        try {
            const [rows] = await promisePool.query(
                'SELECT * FROM resources WHERE type = ? ORDER BY name ASC',
                [type]
            );
            
            rows.forEach(row => {
                if (row.equipment) {
                    try {
                        row.equipment = JSON.parse(row.equipment);
                    } catch (e) {
                        row.equipment = [];
                    }
                }
            });
            
            return rows;
        } catch (error) {
            logger.error('Error finding resources by type:', error);
            throw error;
        }
    }

    /**
     * Get resources by faculty
     * @param {String} faculty - Faculty name
     * @returns {Promise<Array>} Array of resources
     */
    static async findByFaculty(faculty) {
        try {
            const [rows] = await promisePool.query(
                'SELECT * FROM resources WHERE faculty = ? ORDER BY name ASC',
                [faculty]
            );
            
            rows.forEach(row => {
                if (row.equipment) {
                    try {
                        row.equipment = JSON.parse(row.equipment);
                    } catch (e) {
                        row.equipment = [];
                    }
                }
            });
            
            return rows;
        } catch (error) {
            logger.error('Error finding resources by faculty:', error);
            throw error;
        }
    }
}

module.exports = Resource;

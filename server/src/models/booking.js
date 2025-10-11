const { promisePool } = require('../config/database');
const logger = require('../utils/logger');

class Booking {
    /**
     * Create a new booking
     * @param {Object} bookingData - Booking data
     * @returns {Promise<Object>} Created booking
     */
    static async create(bookingData) {
        try {
            const {
                user_id,
                resource_id,
                title,
                date,
                start_time,
                end_time,
                reason,
                purpose,
                requirements,
                attendees,
                status = 'pending'
            } = bookingData;

            const [result] = await promisePool.query(
                `INSERT INTO bookings (user_id, resource_id, title, date, start_time, end_time, reason, purpose, requirements, attendees, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [user_id, resource_id, title, date, start_time, end_time, reason, purpose, requirements, attendees, status]
            );

            return await this.findById(result.insertId);
        } catch (error) {
            logger.error('Error creating booking:', error);
            throw error;
        }
    }

    /**
     * Find booking by ID
     * @param {Number} bookingId - Booking ID
     * @returns {Promise<Object>} Booking object
     */
    static async findById(bookingId) {
        try {
            const [rows] = await promisePool.query(
                `SELECT b.*, 
                        u.full_name as user_name, u.email as user_email, u.phone as user_phone,
                        r.name as resource_name, r.type as resource_type, r.building as resource_building, r.location as resource_location
                 FROM bookings b
                 JOIN users u ON b.user_id = u.user_id
                 JOIN resources r ON b.resource_id = r.resource_id
                 WHERE b.booking_id = ?`,
                [bookingId]
            );
            return rows[0] || null;
        } catch (error) {
            logger.error('Error finding booking by ID:', error);
            throw error;
        }
    }

    /**
     * Get all bookings with optional filtering
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} Array of bookings
     */
    static async findAll(filters = {}) {
        try {
            let query = `
                SELECT b.*, 
                       u.full_name as user_name, u.email as user_email,
                       r.name as resource_name, r.type as resource_type, r.building as resource_building
                FROM bookings b
                JOIN users u ON b.user_id = u.user_id
                JOIN resources r ON b.resource_id = r.resource_id
                WHERE 1=1
            `;
            const params = [];

            if (filters.user_id) {
                query += ' AND b.user_id = ?';
                params.push(filters.user_id);
            }

            if (filters.resource_id) {
                query += ' AND b.resource_id = ?';
                params.push(filters.resource_id);
            }

            if (filters.status) {
                query += ' AND b.status = ?';
                params.push(filters.status);
            }

            if (filters.date) {
                query += ' AND b.date = ?';
                params.push(filters.date);
            }

            if (filters.start_date && filters.end_date) {
                query += ' AND b.date BETWEEN ? AND ?';
                params.push(filters.start_date, filters.end_date);
            }

            if (filters.reason) {
                query += ' AND b.reason = ?';
                params.push(filters.reason);
            }

            if (filters.search) {
                query += ' AND (b.title LIKE ? OR b.purpose LIKE ? OR r.name LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            query += ' ORDER BY b.date DESC, b.start_time DESC';

            const [rows] = await promisePool.query(query, params);
            return rows;
        } catch (error) {
            logger.error('Error finding all bookings:', error);
            throw error;
        }
    }

    /**
     * Update booking
     * @param {Number} bookingId - Booking ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated booking
     */
    static async update(bookingId, updateData) {
        try {
            const allowedFields = ['title', 'date', 'start_time', 'end_time', 'reason', 'purpose', 'requirements', 'attendees', 'status'];
            const updates = [];
            const values = [];

            Object.keys(updateData).forEach(key => {
                if (allowedFields.includes(key) && updateData[key] !== undefined) {
                    updates.push(`${key} = ?`);
                    values.push(updateData[key]);
                }
            });

            if (updates.length === 0) {
                throw new Error('No valid fields to update');
            }

            values.push(bookingId);

            await promisePool.query(
                `UPDATE bookings SET ${updates.join(', ')} WHERE booking_id = ?`,
                values
            );

            return await this.findById(bookingId);
        } catch (error) {
            logger.error('Error updating booking:', error);
            throw error;
        }
    }

    /**
     * Delete booking
     * @param {Number} bookingId - Booking ID
     * @returns {Promise<Boolean>} Success status
     */
    static async delete(bookingId) {
        try {
            await promisePool.query('DELETE FROM bookings WHERE booking_id = ?', [bookingId]);
            return true;
        } catch (error) {
            logger.error('Error deleting booking:', error);
            throw error;
        }
    }

    /**
     * Approve booking
     * @param {Number} bookingId - Booking ID
     * @returns {Promise<Object>} Updated booking
     */
    static async approve(bookingId) {
        try {
            await promisePool.query(
                'UPDATE bookings SET status = ? WHERE booking_id = ?',
                ['approved', bookingId]
            );
            return await this.findById(bookingId);
        } catch (error) {
            logger.error('Error approving booking:', error);
            throw error;
        }
    }

    /**
     * Reject booking
     * @param {Number} bookingId - Booking ID
     * @returns {Promise<Object>} Updated booking
     */
    static async reject(bookingId) {
        try {
            await promisePool.query(
                'UPDATE bookings SET status = ? WHERE booking_id = ?',
                ['rejected', bookingId]
            );
            return await this.findById(bookingId);
        } catch (error) {
            logger.error('Error rejecting booking:', error);
            throw error;
        }
    }

    /**
     * Cancel booking
     * @param {Number} bookingId - Booking ID
     * @returns {Promise<Object>} Updated booking
     */
    static async cancel(bookingId) {
        try {
            await promisePool.query(
                'UPDATE bookings SET status = ? WHERE booking_id = ?',
                ['cancelled', bookingId]
            );
            return await this.findById(bookingId);
        } catch (error) {
            logger.error('Error cancelling booking:', error);
            throw error;
        }
    }

    /**
     * Get booking statistics
     * @returns {Promise<Object>} Booking statistics
     */
    static async getStatistics() {
        try {
            const [stats] = await promisePool.query(`
                SELECT 
                    COUNT(*) as total_bookings,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
                    SUM(CASE WHEN date >= CURDATE() AND status = 'approved' THEN 1 ELSE 0 END) as upcoming
                FROM bookings
            `);
            return stats[0];
        } catch (error) {
            logger.error('Error getting booking statistics:', error);
            throw error;
        }
    }

    /**
     * Get user bookings
     * @param {Number} userId - User ID
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} Array of bookings
     */
    static async findByUser(userId, filters = {}) {
        try {
            let query = `
                SELECT b.*, 
                       r.name as resource_name, r.type as resource_type, r.building as resource_building, r.location as resource_location
                FROM bookings b
                JOIN resources r ON b.resource_id = r.resource_id
                WHERE b.user_id = ?
            `;
            const params = [userId];

            if (filters.status) {
                query += ' AND b.status = ?';
                params.push(filters.status);
            }

            if (filters.upcoming) {
                query += ' AND b.date >= CURDATE()';
            }

            query += ' ORDER BY b.date DESC, b.start_time DESC';

            const [rows] = await promisePool.query(query, params);
            return rows;
        } catch (error) {
            logger.error('Error finding bookings by user:', error);
            throw error;
        }
    }

    /**
     * Get user bookings with resource names (for booking history)
     * @param {Number} userId - User ID
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} Array of bookings
     */
    static async findByUserWithResource(userId, filters = {}) {
        try {
            let query = `
                SELECT b.*, r.name as resource_name
                FROM bookings b
                JOIN resources r ON b.resource_id = r.resource_id
                WHERE b.user_id = ?
            `;
            const params = [userId];

            if (filters.status) {
                query += ' AND b.status = ?';
                params.push(filters.status);
            }

            if (filters.upcoming) {
                query += ' AND b.date >= CURDATE()';
            }

            query += ' ORDER BY b.date DESC, b.start_time DESC';

            const [rows] = await promisePool.query(query, params);
            return rows;
        } catch (error) {
            logger.error('Error finding user bookings with resource:', error);
            throw error;
        }
    }

    /**
     * Get resource bookings
     * @param {Number} resourceId - Resource ID
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} Array of bookings
     */
    static async findByResource(resourceId, filters = {}) {
        try {
            let query = `
                SELECT b.*, 
                       u.full_name as user_name, u.email as user_email
                FROM bookings b
                JOIN users u ON b.user_id = u.user_id
                WHERE b.resource_id = ?
            `;
            const params = [resourceId];

            if (filters.date) {
                query += ' AND b.date = ?';
                params.push(filters.date);
            }

            if (filters.status) {
                query += ' AND b.status = ?';
                params.push(filters.status);
            }

            if (filters.start_date && filters.end_date) {
                query += ' AND b.date BETWEEN ? AND ?';
                params.push(filters.start_date, filters.end_date);
            }

            query += ' ORDER BY b.date DESC, b.start_time DESC';

            const [rows] = await promisePool.query(query, params);
            return rows;
        } catch (error) {
            logger.error('Error finding bookings by resource:', error);
            throw error;
        }
    }

    /**
     * Get upcoming bookings
     * @param {Number} limit - Limit number of results
     * @returns {Promise<Array>} Array of upcoming bookings
     */
    static async findUpcoming(limit = 10) {
        try {
            const [rows] = await promisePool.query(
                `SELECT b.*, 
                        u.full_name as user_name, u.email as user_email,
                        r.name as resource_name, r.type as resource_type, r.building as resource_building
                 FROM bookings b
                 JOIN users u ON b.user_id = u.user_id
                 JOIN resources r ON b.resource_id = r.resource_id
                 WHERE b.date >= CURDATE() AND b.status = 'approved'
                 ORDER BY b.date ASC, b.start_time ASC
                 LIMIT ?`,
                [limit]
            );
            return rows;
        } catch (error) {
            logger.error('Error finding upcoming bookings:', error);
            throw error;
        }
    }

    /**
     * Get pending bookings
     * @returns {Promise<Array>} Array of pending bookings
     */
    static async findPending() {
        try {
            const [rows] = await promisePool.query(
                `SELECT b.*, 
                        u.full_name as user_name, u.email as user_email, u.department,
                        r.name as resource_name, r.type as resource_type, r.building as resource_building
                 FROM bookings b
                 JOIN users u ON b.user_id = u.user_id
                 JOIN resources r ON b.resource_id = r.resource_id
                 WHERE b.status = 'pending'
                 ORDER BY b.created_at DESC`
            );
            return rows;
        } catch (error) {
            logger.error('Error finding pending bookings:', error);
            throw error;
        }
    }

    /**
     * Check for booking conflicts
     * @param {Number} resourceId - Resource ID
     * @param {String} date - Date
     * @param {String} startTime - Start time
     * @param {String} endTime - End time
     * @param {Number} excludeBookingId - Booking ID to exclude
     * @returns {Promise<Array>} Array of conflicting bookings
     */
    static async findConflicts(resourceId, date, startTime, endTime, excludeBookingId = null) {
        try {
            let query = `
                SELECT * FROM bookings
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

            const [rows] = await promisePool.query(query, params);
            return rows;
        } catch (error) {
            logger.error('Error finding booking conflicts:', error);
            throw error;
        }
    }

    /**
     * Get bookings for today
     * @returns {Promise<Array>} Array of today's bookings
     */
    static async findToday() {
        try {
            const [rows] = await promisePool.query(
                `SELECT b.*, 
                        u.full_name as user_name,
                        r.name as resource_name, r.type as resource_type, r.location as resource_location
                 FROM bookings b
                 JOIN users u ON b.user_id = u.user_id
                 JOIN resources r ON b.resource_id = r.resource_id
                 WHERE b.date = CURDATE() AND b.status = 'approved'
                 ORDER BY b.start_time ASC`
            );
            return rows;
        } catch (error) {
            logger.error("Error finding today's bookings:", error);
            throw error;
        }
    }

    /**
     * Get bookings by date range
     * @param {String} startDate - Start date
     * @param {String} endDate - End date
     * @param {Object} filters - Additional filters
     * @returns {Promise<Array>} Array of bookings
     */
    static async findByDateRange(startDate, endDate, filters = {}) {
        try {
            let query = `
                SELECT b.*, 
                       u.full_name as user_name, u.email as user_email,
                       r.name as resource_name, r.type as resource_type
                FROM bookings b
                JOIN users u ON b.user_id = u.user_id
                JOIN resources r ON b.resource_id = r.resource_id
                WHERE b.date BETWEEN ? AND ?
            `;
            const params = [startDate, endDate];

            if (filters.user_id) {
                query += ' AND b.user_id = ?';
                params.push(filters.user_id);
            }

            if (filters.resource_id) {
                query += ' AND b.resource_id = ?';
                params.push(filters.resource_id);
            }

            if (filters.status) {
                query += ' AND b.status = ?';
                params.push(filters.status);
            }

            query += ' ORDER BY b.date ASC, b.start_time ASC';

            const [rows] = await promisePool.query(query, params);
            return rows;
        } catch (error) {
            logger.error('Error finding bookings by date range:', error);
            throw error;
        }
    }

    /**
     * Get booking count by resource
     * @param {Number} resourceId - Resource ID
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>} Booking count
     */
    static async getCountByResource(resourceId, filters = {}) {
        try {
            let query = 'SELECT COUNT(*) as count FROM bookings WHERE resource_id = ?';
            const params = [resourceId];

            if (filters.status) {
                query += ' AND status = ?';
                params.push(filters.status);
            }

            if (filters.start_date && filters.end_date) {
                query += ' AND date BETWEEN ? AND ?';
                params.push(filters.start_date, filters.end_date);
            }

            const [result] = await promisePool.query(query, params);
            return result[0].count;
        } catch (error) {
            logger.error('Error getting booking count by resource:', error);
            throw error;
        }
    }

    /**
     * Get booking count by user
     * @param {Number} userId - User ID
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>} Booking count
     */
    static async getCountByUser(userId, filters = {}) {
        try {
            let query = 'SELECT COUNT(*) as count FROM bookings WHERE user_id = ?';
            const params = [userId];

            if (filters.status) {
                query += ' AND status = ?';
                params.push(filters.status);
            }

            if (filters.start_date && filters.end_date) {
                query += ' AND date BETWEEN ? AND ?';
                params.push(filters.start_date, filters.end_date);
            }

            const [result] = await promisePool.query(query, params);
            return result[0].count;
        } catch (error) {
            logger.error('Error getting booking count by user:', error);
            throw error;
        }
    }

    /**
     * Cancel expired bookings
     * @returns {Promise<Number>} Number of cancelled bookings
     */
    static async cancelExpiredBookings() {
        try {
            const [result] = await promisePool.query(
                `UPDATE bookings 
                 SET status = 'cancelled' 
                 WHERE date < CURDATE() AND status IN ('pending', 'approved')`
            );
            return result.affectedRows;
        } catch (error) {
            logger.error('Error cancelling expired bookings:', error);
            throw error;
        }
    }

    /**
     * Get booking analytics
     * @param {String} period - Period (week, month, year)
     * @returns {Promise<Array>} Analytics data
     */
    static async getAnalytics(period = 'month') {
        try {
            let dateCondition = '';
            switch (period) {
                case 'week':
                    dateCondition = 'AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
                    break;
                case 'month':
                    dateCondition = 'AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
                    break;
                case 'year':
                    dateCondition = 'AND date >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)';
                    break;
            }

            const [rows] = await promisePool.query(
                `SELECT 
                    DATE(date) as booking_date,
                    COUNT(*) as total_bookings,
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_bookings,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_bookings,
                    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings
                 FROM bookings
                 WHERE 1=1 ${dateCondition}
                 GROUP BY DATE(date)
                 ORDER BY booking_date DESC`
            );
            return rows;
        } catch (error) {
            logger.error('Error getting booking analytics:', error);
            throw error;
        }
    }
}

module.exports = Booking;
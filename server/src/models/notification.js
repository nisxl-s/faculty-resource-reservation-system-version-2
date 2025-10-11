

const { promisePool } = require('../config/database');
const logger = require('../utils/logger');

class Notification {
    
    static async create(notificationData) {
        try {
            const { user_id, type, title, message, priority = 'medium' } = notificationData;

            const [result] = await promisePool.query(
                `INSERT INTO notifications (user_id, type, title, message, priority)
                 VALUES (?, ?, ?, ?, ?)`,
                [user_id, type, title, message, priority]
            );

            return await this.findById(result.insertId);
        } catch (error) {
            logger.error('Error creating notification:', error);
            throw error;
        }
    }

    
    static async findById(notificationId) {
        try {
            const [rows] = await promisePool.query(
                'SELECT * FROM notifications WHERE notification_id = ?',
                [notificationId]
            );
            return rows[0] || null;
        } catch (error) {
            logger.error('Error finding notification by ID:', error);
            throw error;
        }
    }

   
    static async findByUser(userId, filters = {}) {
        try {
            let query = 'SELECT * FROM notifications WHERE user_id = ?';
            const params = [userId];

            if (filters.type) {
                query += ' AND type = ?';
                params.push(filters.type);
            }

            if (filters.is_read !== undefined) {
                query += ' AND is_read = ?';
                params.push(filters.is_read);
            }

            if (filters.priority) {
                query += ' AND priority = ?';
                params.push(filters.priority);
            }

            query += ' ORDER BY created_at DESC';

            if (filters.limit) {
                query += ' LIMIT ?';
                params.push(parseInt(filters.limit));
            }

            if (filters.offset) {
                query += ' OFFSET ?';
                params.push(parseInt(filters.offset));
            }

            const [rows] = await promisePool.query(query, params);
            return rows;
        } catch (error) {
            logger.error('Error finding notifications by user:', error);
            throw error;
        }
    }

    
    static async markAsRead(notificationId) {
        try {
            await promisePool.query(
                'UPDATE notifications SET is_read = 1 WHERE notification_id = ?',
                [notificationId]
            );
            return await this.findById(notificationId);
        } catch (error) {
            logger.error('Error marking notification as read:', error);
            throw error;
        }
    }

    
    static async markAllAsRead(userId) {
        try {
            const [result] = await promisePool.query(
                'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
                [userId]
            );
            return true;
        } catch (error) {
            logger.error('Error marking all notifications as read:', error);
            throw error;
        }
    }

    static async getUnreadCount(userId) {
        try {
            const [result] = await promisePool.query(
                'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
                [userId]
            );
            return result[0].count;
        } catch (error) {
            logger.error('Error getting unread count:', error);
            throw error;
        }
    }

    
    static async getRecent(userId, limit = 5) {
        try {
            const [rows] = await promisePool.query(
                `SELECT * FROM notifications 
                 WHERE user_id = ? 
                 ORDER BY created_at DESC 
                 LIMIT ?`,
                [userId, limit]
            );
            return rows;
        } catch (error) {
            logger.error('Error getting recent notifications:', error);
            throw error;
        }
    }

    
    static async delete(notificationId) {
        try {
            await promisePool.query('DELETE FROM notifications WHERE notification_id = ?', [notificationId]);
            return true;
        } catch (error) {
            logger.error('Error deleting notification:', error);
            throw error;
        }
    }

    /**
     * Create booking notification - ADD THIS METHOD
     */
    static async createBookingNotification(userId, type, booking, resource) {
        try {
            let title, message, priority;

            switch (type) {
                case 'approved':
                    title = 'Booking Approved';
                    message = `Your booking for ${resource.name} on ${booking.date} has been approved.`;
                    priority = 'high';
                    break;
                case 'rejected':
                    title = 'Booking Rejected';
                    message = `Your booking for ${resource.name} on ${booking.date} has been rejected.`;
                    priority = 'high';
                    break;
                case 'pending':
                    title = 'Booking Pending';
                    message = `Your booking for ${resource.name} on ${booking.date} is pending approval.`;
                    priority = 'medium';
                    break;
                case 'reminder':
                    title = 'Booking Reminder';
                    message = `Reminder: You have a booking for ${resource.name} on ${booking.date} at ${booking.start_time}.`;
                    priority = 'high';
                    break;
                default:
                    title = 'Booking Update';
                    message = `Your booking for ${resource.name} has been updated.`;
                    priority = 'medium';
            }

            return await this.create({
                user_id: userId,
                type: 'booking',
                title,
                message,
                priority
            });
        } catch (error) {
            logger.error('Error creating booking notification:', error);
            throw error;
        }
    }
}

module.exports = Notification;
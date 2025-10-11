const Notification = require('../models/notification');
const logger = require('../utils/logger');

/**
 * Get all notifications for authenticated user
 */
const getAllNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, type, is_read, priority } = req.query;
        
        const filters = {
            type,
            is_read: is_read !== undefined ? Boolean(parseInt(is_read)) : undefined,
            priority
        };

        // Get all notifications (we'll handle pagination manually)
        const allNotifications = await Notification.findByUser(req.user.user_id, filters);
        
        // Manual pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedNotifications = allNotifications.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: paginatedNotifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: allNotifications.length,
                pages: Math.ceil(allNotifications.length / limit)
            }
        });
    } catch (error) {
        logger.error('Get all notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications'
        });
    }
};

/**
 * Get recent notifications for authenticated user
 */
const getRecentNotifications = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const notifications = await Notification.getRecent(req.user.user_id, parseInt(limit));

        res.json({
            success: true,
            data: notifications
        });
    } catch (error) {
        logger.error('Get recent notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recent notifications'
        });
    }
};

/**
 * Get unread notifications count for authenticated user
 */
const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.getUnreadCount(req.user.user_id);

        res.json({
            success: true,
            data: { unread_count: count }
        });
    } catch (error) {
        logger.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unread count'
        });
    }
};

/**
 * MARK ALL NOTIFICATIONS AS READ - This was missing!
 */
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.user_id || req.user.id;
        
        const success = await Notification.markAllAsRead(userId);

        if (success) {
            logger.info(`User ${userId} marked all notifications as read`);
            
            res.json({
                success: true,
                message: 'All notifications marked as read',
                data: { 
                    user_id: userId
                }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to mark notifications as read'
            });
        }
    } catch (error) {
        logger.error('Mark all as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notifications as read'
        });
    }
};

/**
 * Mark a specific notification as read
 */
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id || req.user.id;

        // First, verify the notification belongs to the user
        const notification = await Notification.findById(id);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        if (notification.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this notification'
            });
        }

        const updatedNotification = await Notification.markAsRead(id);

        if (updatedNotification) {
            res.json({
                success: true,
                message: 'Notification marked as read',
                data: updatedNotification
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to mark notification as read'
            });
        }
    } catch (error) {
        logger.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read'
        });
    }
};

/**
 * Delete a specific notification
 */
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id || req.user.id;

        // First, verify the notification belongs to the user
        const notification = await Notification.findById(id);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        if (notification.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this notification'
            });
        }

        const success = await Notification.delete(id);

        if (success) {
            res.json({
                success: true,
                message: 'Notification deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to delete notification'
            });
        }
    } catch (error) {
        logger.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification'
        });
    }
};

/**
 * Get all notifications (Admin only)
 */
const getAllNotificationsAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 50, user_id } = req.query;
        
        let notifications;
        let totalCount;

        if (user_id) {
            // Get notifications for specific user
            notifications = await Notification.findByUser(user_id, { limit: parseInt(limit) });
            const allUserNotifications = await Notification.findByUser(user_id);
            totalCount = allUserNotifications.length;
        } else {
            // For admin to get all notifications, return limited functionality for now
            return res.status(501).json({
                success: false,
                message: 'Admin notification view not fully implemented'
            });
        }

        res.json({
            success: true,
            data: notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount,
                pages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        logger.error('Get all notifications admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications'
        });
    }
};

module.exports = {
    getAllNotifications,
    getRecentNotifications,
    getUnreadCount,
    markAllAsRead, // ← Make sure this is exported!
    markAsRead,
    deleteNotification,
    getAllNotificationsAdmin
};
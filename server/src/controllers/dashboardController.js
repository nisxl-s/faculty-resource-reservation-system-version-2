const { promisePool } = require('../config/database');
const logger = require('../utils/logger');

class DashboardController {
    async getDashboardStats(req, res) {
        try {
            const userId = req.user.user_id || req.user.id; // ← Fixed
            const userRole = req.user.role;
            
            let stats = {};
            
            if (userRole === 'admin') {
                // Admin stats - using promisePool.query
                const [userStats] = await promisePool.query(
                    `SELECT 
                        COUNT(*) as totalUsers,
                        SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students,
                        SUM(CASE WHEN role = 'lecturer' THEN 1 ELSE 0 END) as lecturers,
                        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins
                     FROM users WHERE is_active = 1`
                );
                
                const [resourceStats] = await promisePool.query(
                    `SELECT 
                        COUNT(*) as totalResources,
                        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as availableResources,
                        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenanceResources
                     FROM resources`
                );
                
                const [bookingStats] = await promisePool.query(
                    `SELECT 
                        COUNT(*) as totalBookings,
                        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingBookings,
                        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approvedBookings,
                        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejectedBookings
                     FROM bookings`
                );
                
                stats = {
                    users: userStats[0],
                    resources: resourceStats[0],
                    bookings: bookingStats[0]
                };
            } else {
                // User stats - using promisePool.query
                const [userBookings] = await promisePool.query(
                    `SELECT 
                        COUNT(*) as totalBookings,
                        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingBookings,
                        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approvedBookings,
                        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejectedBookings
                     FROM bookings WHERE user_id = ?`,
                    [userId]
                );
                
                const [upcomingBookings] = await promisePool.query(
                    `SELECT COUNT(*) as upcomingBookings
                     FROM bookings 
                     WHERE user_id = ? AND status = 'approved' AND date >= CURDATE()`,
                    [userId]
                );
                
                stats = {
                    bookings: userBookings[0],
                    upcoming: upcomingBookings[0]
                };
            }
            
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            logger.error('Error in getDashboardStats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to load dashboard statistics'
            });
        }
    }

    async getRecentActivity(req, res) {
        try {
            const userId = req.user.user_id || req.user.id; // ← Fixed
            const userRole = req.user.role;
            
            let query = `
                SELECT 
                    b.booking_id as id,
                    b.title,
                    b.date,
                    b.start_time,
                    b.end_time,
                    b.status,
                    b.created_at,
                    r.name as resource_name,
                    r.type as resource_type
                FROM bookings b
                JOIN resources r ON b.resource_id = r.resource_id
            `;
            
            const params = [];
            
            if (userRole !== 'admin') {
                query += ' WHERE b.user_id = ?';
                params.push(userId);
            }
            
            query += ' ORDER BY b.created_at DESC LIMIT 10';
            
            const [activities] = await promisePool.query(query, params);
            
            res.json({
                success: true,
                data: activities
            });
        } catch (error) {
            logger.error('Error in getRecentActivity:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to load recent activity'
            });
        }
    }

    async getDashboardUpcomingBookings(req, res) {
        try {
            const userId = req.user.user_id || req.user.id; // ← Fixed
            const userRole = req.user.role;
            
            let query = `
                SELECT 
                    b.booking_id as id,
                    b.title,
                    b.date,
                    b.start_time,
                    b.end_time,
                    b.status,
                    r.name as resource_name,
                    r.type as resource_type,
                    r.location
                FROM bookings b
                JOIN resources r ON b.resource_id = r.resource_id
                WHERE b.status = 'approved' AND b.date >= CURDATE()
            `;
            
            const params = [];
            
            if (userRole !== 'admin') {
                query += ' AND b.user_id = ?';
                params.push(userId);
            }
            
            query += ' ORDER BY b.date ASC, b.start_time ASC LIMIT 5';
            
            const [bookings] = await promisePool.query(query, params);
            
            res.json({
                success: true,
                data: bookings
            });
        } catch (error) {
            logger.error('Error in getDashboardUpcomingBookings:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to load upcoming bookings'
            });
        }
    }

    async getResourceUtilization(req, res) {
        try {
            const { period = 'month' } = req.query;
            
            let dateFilter = '';
            if (period === 'week') {
                dateFilter = 'AND b.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
            } else if (period === 'month') {
                dateFilter = 'AND b.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
            } else if (period === 'year') {
                dateFilter = 'AND b.date >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)';
            }
            
            const [utilization] = await promisePool.query(
                `SELECT 
                    r.resource_id,
                    r.name,
                    r.type,
                    r.capacity,
                    COUNT(b.booking_id) as total_bookings,
                    SUM(CASE WHEN b.status = 'approved' THEN 1 ELSE 0 END) as approved_bookings
                FROM resources r
                LEFT JOIN bookings b ON r.resource_id = b.resource_id ${dateFilter}
                GROUP BY r.resource_id, r.name, r.type, r.capacity
                ORDER BY approved_bookings DESC
                LIMIT 10`
            );
            
            res.json({
                success: true,
                data: utilization
            });
        } catch (error) {
            logger.error('Error in getResourceUtilization:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to load resource utilization'
            });
        }
    }

    async getQuickStats(req, res) {
        try {
            const userId = req.user.user_id || req.user.id; // ← Fixed

            const [stats] = await promisePool.query(
                `SELECT 
                    (SELECT COUNT(*) FROM bookings WHERE user_id = ? AND status = 'approved' AND date >= CURDATE()) as upcoming_count,
                    (SELECT COUNT(*) FROM bookings WHERE user_id = ? AND status = 'pending') as pending_count,
                    (SELECT COUNT(*) FROM bookings WHERE user_id = ? AND status = 'approved' AND date < CURDATE()) as completed_count,
                    (SELECT COUNT(*) FROM resources WHERE status = 'available') as total_resources`,
                [userId, userId, userId]
            );

            res.json({
                success: true,
                data: stats[0]
            });
        } catch (error) {
            logger.error('Error in getQuickStats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to load quick stats'
            });
        }
    }

    async getUserDashboard(req, res) {
        try {
            const userId = req.user.user_id || req.user.id; // ← Fixed

            // Get recent bookings
            const [recentBookings] = await promisePool.query(
                `SELECT b.*, r.name as resource_name
                 FROM bookings b
                 LEFT JOIN resources r ON b.resource_id = r.resource_id
                 WHERE b.user_id = ?
                 ORDER BY b.created_at DESC
                 LIMIT 5`,
                [userId]
            );

            // Get booking stats
            const [bookingStats] = await promisePool.query(
                `SELECT 
                    COUNT(*) as total_bookings,
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_bookings,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_bookings
                 FROM bookings
                 WHERE user_id = ?`,
                [userId]
            );

            // Get upcoming bookings
            const [upcomingBookings] = await promisePool.query(
                `SELECT b.*, r.name as resource_name
                 FROM bookings b
                 LEFT JOIN resources r ON b.resource_id = r.resource_id
                 WHERE b.user_id = ? AND b.status = 'approved' 
                 AND b.date >= CURDATE()
                 ORDER BY b.date ASC, b.start_time ASC
                 LIMIT 3`,
                [userId]
            );

            res.json({
                success: true,
                data: {
                    recent_bookings: recentBookings,
                    booking_stats: bookingStats[0],
                    upcoming_bookings: upcomingBookings
                }
            });
        } catch (error) {
            logger.error('Error in getUserDashboard:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to load user dashboard'
            });
        }
    }
}

module.exports = new DashboardController();
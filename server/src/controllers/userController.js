const User = require('../models/user');
const Booking = require('../models/booking');
const logger = require('../utils/logger');

/**
 * Get all users
 * GET /api/users
 */
const getAllUsers = async (req, res) => {
    try {
        const filters = {
            role: req.query.role,
            department: req.query.department,
            faculty: req.query.faculty,
            is_active: req.query.is_active,
            search: req.query.search
        };

        const users = await User.findAll(filters);

        res.json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        logger.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

/**
 * Get user by ID
 * GET /api/users/:id
 */
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        logger.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
};

/**
 * Update user
 * PUT /api/users/:id
 */
const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if user exists
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Map frontend fields to backend fields
        const updateData = {
            full_name: req.body.name || req.body.full_name || existingUser.full_name, // ← Fixed
            email: req.body.email || existingUser.email,
            registration_no: req.body.id || req.body.registration_no || existingUser.registration_no, // ← Fixed
            role: req.body.status || req.body.role || existingUser.role, // ← Fixed
            faculty: req.body.faculty || existingUser.faculty,
            department: req.body.department || existingUser.department,
            academic_year: req.body.year || req.body.academic_year || existingUser.academic_year, // ← Fixed
            phone: req.body.phone || existingUser.phone
        };

        const updatedUser = await User.update(userId, updateData);

        res.json({
            success: true,
            message: 'User updated successfully',
            user: updatedUser
        });
    } catch (error) {
        logger.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
};

/**
 * Delete user
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deleting yourself
        if (req.user.user_id === parseInt(userId)) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        await User.delete(userId);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        logger.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};

/**
 * Get user statistics
 * GET /api/users/stats
 */
const getUserStats = async (req, res) => {
    try {
        const stats = await User.getStatistics();

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        logger.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user statistics',
            error: error.message
        });
    }
};

/**
 * Get user bookings
 * GET /api/users/:id/bookings
 */
const getUserBookings = async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const filters = {
            status: req.query.status,
            upcoming: req.query.upcoming === 'true'
        };

        const bookings = await Booking.findByUser(userId, filters);

        res.json({
            success: true,
            count: bookings.length,
            bookings
        });
    } catch (error) {
        logger.error('Get user bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user bookings',
            error: error.message
        });
    }
};

/**
 * Deactivate user
 * PUT /api/users/:id/deactivate
 */
const deactivateUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deactivating yourself
        if (req.user.user_id === parseInt(userId)) {
            return res.status(400).json({
                success: false,
                message: 'You cannot deactivate your own account'
            });
        }

        await User.update(userId, { is_active: false });

        res.json({
            success: true,
            message: 'User deactivated successfully'
        });
    } catch (error) {
        logger.error('Deactivate user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deactivating user',
            error: error.message
        });
    }
};

/**
 * Activate user
 * PUT /api/users/:id/activate
 */
const activateUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await User.update(userId, { is_active: true });

        res.json({
            success: true,
            message: 'User activated successfully'
        });
    } catch (error) {
        logger.error('Activate user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error activating user',
            error: error.message
        });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getUserStats,
    getUserBookings,
    deactivateUser,
    activateUser
};
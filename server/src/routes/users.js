
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, isAdmin, isOwnerOrAdmin } = require('../middleware/authMiddleware');
const { validateUserUpdate, validateId } = require('../middleware/validationMiddleware');

// All routes require authentication
router.use(authenticate);

// Get user statistics (admin only)
router.get('/stats', isAdmin, userController.getUserStats);

// Get all users (admin only)
router.get('/', isAdmin, userController.getAllUsers);

// Get user by ID
router.get('/:id', validateId, userController.getUserById);

// Update user
router.put('/:id', validateId, validateUserUpdate, isOwnerOrAdmin, userController.updateUser);

// Delete user (admin only)
router.delete('/:id', validateId, isAdmin, userController.deleteUser);

// Get user bookings
router.get('/:id/bookings', validateId, isOwnerOrAdmin, userController.getUserBookings);

// Deactivate user (admin only)
router.put('/:id/deactivate', validateId, isAdmin, userController.deactivateUser);

// Activate user (admin only)
router.put('/:id/activate', validateId, isAdmin, userController.activateUser);

module.exports = router;



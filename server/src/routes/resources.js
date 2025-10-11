
const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');
const { validateResourceCreate, validateResourceUpdate, validateId } = require('../middleware/validationMiddleware');

// Public routes (require authentication)
router.use(authenticate);

// Get resource statistics
router.get('/stats', resourceController.getResourceStats);

// Get available resources
router.get('/available', resourceController.getAvailableResources);

// Get resources by type
router.get('/type/:type', resourceController.getResourcesByType);

// Get resources by faculty
router.get('/faculty/:faculty', resourceController.getResourcesByFaculty);

// Get all resources
router.get('/', resourceController.getAllResources);

// Get resource by ID
router.get('/:id', validateId, resourceController.getResourceById);

// Get resource schedule
router.get('/:id/schedule', validateId, resourceController.getResourceSchedule);

// Check resource availability
router.get('/:id/check-availability', validateId, resourceController.checkResourceAvailability);

// Get resource bookings
router.get('/:id/bookings', validateId, resourceController.getResourceBookings);

// Admin only routes
router.post('/', isAdmin, validateResourceCreate, resourceController.createResource);
router.put('/:id', isAdmin, validateId, validateResourceUpdate, resourceController.updateResource);
router.delete('/:id', isAdmin, validateId, resourceController.deleteResource);

module.exports = router;

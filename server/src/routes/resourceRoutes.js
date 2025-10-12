const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const resourceController = require('../controllers/resourceController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Validation rules
const resourceValidation = [
  body('name').trim().notEmpty().withMessage('Resource name is required'),
  body('type').isIn(['classroom', 'lab', 'equipment', 'hall', 'other']).withMessage('Invalid resource type'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be a positive integer')
];

// Public routes (available to all authenticated users)
router.get('/', verifyToken, resourceController.getAllResources);
router.get('/available', verifyToken, resourceController.getAvailableForTimeSlot);
router.get('/popular', verifyToken, resourceController.getPopularResources);
router.get('/:id', verifyToken, resourceController.getResourceById);
router.get('/:id/availability', verifyToken, resourceController.checkAvailability);

// Admin only routes
router.post('/', verifyToken, isAdmin, resourceValidation, resourceController.createResource);
router.put('/:id', verifyToken, isAdmin, resourceController.updateResource);
router.delete('/:id', verifyToken, isAdmin, resourceController.deleteResource);
router.get('/stats/summary', verifyToken, isAdmin, resourceController.getResourceStats);

module.exports = router;

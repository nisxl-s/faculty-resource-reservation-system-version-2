const express = require('express');
const router = express.Router();
router.param('id', (req, res, next, value) => {
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) return res.status(400).json({ success: false, message: 'Invalid record ID' });
  next();
});
const { body } = require('express-validator');
const resourceController = require('../controllers/resourceController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { sensitiveWriteLimiter } = require('../middleware/rateLimiter');
const { cacheMiddleware } = require('../middleware/cache');
const { filteredCacheKey } = require('../utils/cacheKey');

// Validation rules
const resourceValidation = [
  body('name').trim().notEmpty().withMessage('Resource name is required'),
  body('type').isIn(['classroom', 'lab', 'equipment', 'hall', 'other']).withMessage('Invalid resource type'),
  body('status').optional().isIn(['available','unavailable','maintenance']).withMessage('Invalid status'),
  body('capacity').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1 }).withMessage('Capacity must be a positive integer')
];

// Public routes (available to all authenticated users)
router.get('/', verifyToken, cacheMiddleware(filteredCacheKey('resources:list', ['type','status','building','faculty_code','sharing_scope','limit','offset']), 300), resourceController.getAllResources);
router.get('/faculties', verifyToken, (req,res)=>res.json({success:true,data:{faculties:require('../config/faculties.json')}}));
router.get('/available', verifyToken, resourceController.getAvailableForTimeSlot);
router.get('/popular', verifyToken, resourceController.getPopularResources);
router.get('/stats/summary', verifyToken, isAdmin, resourceController.getResourceStats);
router.get('/:id', verifyToken, (req, res, next) => {
  // Administrators inspect the current record before editing or deleting it.
  if (req.user.role === 'admin') { res.setHeader('Cache-Control', 'no-store'); return next(); }
  return cacheMiddleware((request) => `resources:${request.params.id}`, 300)(req, res, next);
}, resourceController.getResourceById);
router.get('/:id/availability', verifyToken, resourceController.checkAvailability);
router.get('/:id/calendar', verifyToken, resourceController.getCalendar);

// Admin only routes
router.post('/', verifyToken, isAdmin, sensitiveWriteLimiter, resourceValidation, resourceController.createResource);
router.put('/:id', verifyToken, isAdmin, sensitiveWriteLimiter, resourceValidation, resourceController.updateResource);
router.delete('/:id', verifyToken, isAdmin, sensitiveWriteLimiter, resourceController.deleteResource);

module.exports = router;

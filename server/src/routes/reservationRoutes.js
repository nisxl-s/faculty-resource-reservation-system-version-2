const express = require('express');
const router = express.Router();
router.param('id', (req, res, next, value) => {
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) return res.status(400).json({ success: false, message: 'Invalid record ID' });
  next();
});
const { body } = require('express-validator');
const reservationController = require('../controllers/reservationController');
const { verifyToken, isAdmin, isFacultyOrAdmin } = require('../middleware/auth');
const { sensitiveWriteLimiter } = require('../middleware/rateLimiter');
const { cacheMiddleware } = require('../middleware/cache');
const { filteredCacheKey } = require('../utils/cacheKey');

// Validation rules
const reservationValidation = [
  body('resource_id').isInt({ min: 1 }).withMessage('Valid resource ID is required'),
  body('start_time').isISO8601().withMessage('Valid start time is required'),
  body('end_time').isISO8601().withMessage('Valid end time is required'),
  body('purpose').optional().trim()
];

// All routes require authentication
router.use(verifyToken);

// User routes (accessible to all authenticated users)
router.get('/my-reservations', reservationController.getUserReservations);
router.get('/upcoming', reservationController.getUpcomingReservations);
router.get('/stats', reservationController.getReservationStats);
router.get('/by-date', reservationController.getReservationsByDate);

router.post('/', sensitiveWriteLimiter, reservationValidation, reservationController.createReservation);
router.get('/:id', reservationController.getReservationById);
router.put('/:id', sensitiveWriteLimiter, reservationController.updateReservation);
router.post('/:id/cancel', sensitiveWriteLimiter, reservationController.cancelReservation);

// Faculty and Admin routes
router.put('/:id/status', isFacultyOrAdmin, sensitiveWriteLimiter, reservationController.updateReservationStatus);

// Admin only routes
router.get('/', isFacultyOrAdmin, cacheMiddleware(filteredCacheKey('reservations:all', ['user_id','resource_id','status','date','limit','offset']), 120), reservationController.getAllReservations);
router.delete('/:id', isAdmin, sensitiveWriteLimiter, reservationController.deleteReservation);

module.exports = router;

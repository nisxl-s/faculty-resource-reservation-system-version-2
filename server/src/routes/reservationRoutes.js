const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const reservationController = require('../controllers/reservationController');
const { verifyToken, isAdmin, isFacultyOrAdmin } = require('../middleware/auth');

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

router.post('/', reservationValidation, reservationController.createReservation);
router.get('/:id', reservationController.getReservationById);
router.put('/:id', reservationController.updateReservation);
router.post('/:id/cancel', reservationController.cancelReservation);

// Faculty and Admin routes
router.put('/:id/status', isFacultyOrAdmin, reservationController.updateReservationStatus);

// Admin only routes
router.get('/', isAdmin, reservationController.getAllReservations);
router.delete('/:id', isAdmin, reservationController.deleteReservation);

module.exports = router;

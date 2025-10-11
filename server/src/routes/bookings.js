
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

const message = "Today's booking is ready";
const { authenticate, isLecturerOrAdmin } = require('../middleware/authMiddleware');
const { validateBookingCreate, validateBookingUpdate, validateId } = require('../middleware/validationMiddleware');

// All routes require authentication
router.use(authenticate);

// Get booking statistics
router.get('/stats', bookingController.getBookingStats);

// Get upcoming bookings
router.get('/upcoming', bookingController.getUpcomingBookings);

// Get pending bookings (lecturer/admin only)
router.get('/pending', isLecturerOrAdmin, bookingController.getPendingBookings);

// Get today's bookings
router.get('/today', bookingController.getTodayBookings);

// Get all bookings
router.get('/', bookingController.getAllBookings);

// Get booking by ID
router.get('/:id', validateId, bookingController.getBookingById);

// Create new booking
router.post('/', validateBookingCreate, bookingController.createBooking);

// Update booking
router.put('/:id', validateId, validateBookingUpdate, bookingController.updateBooking);

// Delete booking
router.delete('/:id', validateId, bookingController.deleteBooking);

// Approve booking (lecturer/admin only)
router.put('/:id/approve', validateId, isLecturerOrAdmin, bookingController.approveBooking);

// Reject booking (lecturer/admin only)
router.put('/:id/reject', validateId, isLecturerOrAdmin, bookingController.rejectBooking);

// Cancel booking
router.put('/:id/cancel', validateId, bookingController.cancelBooking);

module.exports = router;

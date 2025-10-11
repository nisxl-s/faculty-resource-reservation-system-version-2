const Booking = require('../models/booking');
const Resource = require('../models/resource');
const User = require('../models/user');
const Notification = require('../models/notification');
const { sendBookingApproval, sendBookingRejection } = require('../utils/email');
const { formatDate, formatTime, calculateDuration, isPastDate } = require('../utils/helpers');
const logger = require('../utils/logger');

// Helper function to format time consistently
const formatTimeForDB = (time) => {
    if (time.length === 8) return time; // HH:MM:SS
    return `${time}:00`; // HH:MM to HH:MM:SS
};

/**
 * Get all bookings
 * GET /api/bookings
 */
const getAllBookings = async (req, res) => {
    try {
        const filters = {
            user_id: req.query.user_id,
            resource_id: req.query.resource_id,
            status: req.query.status,
            date: req.query.date,
            start_date: req.query.start_date,
            end_date: req.query.end_date,
            reason: req.query.reason,
            search: req.query.search
        };

        // If not admin, only show user's own bookings
        if (req.user.role !== 'admin' && !filters.user_id) {
            filters.user_id = req.user.user_id;
        }

        const bookings = await Booking.findAll(filters);

        res.json({
            success: true,
            count: bookings.length,
            bookings
        });
    } catch (error) {
        logger.error('Get all bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bookings',
            error: error.message
        });
    }
};

/**
 * Get booking by ID
 * GET /api/bookings/:id
 */
const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if user has permission to view this booking
        if (req.user.role !== 'admin' && booking.user_id !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this booking'
            });
        }

        res.json({
            success: true,
            booking
        });
    } catch (error) {
        logger.error('Get booking by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching booking',
            error: error.message
        });
    }
};

/**
 * Create new booking
 * POST /api/bookings
 */
const createBooking = async (req, res) => {
    try {
        const { resource_id, date, start_time, end_time, attendees } = req.body;

        // Check if resource exists
        const resource = await Resource.findById(resource_id);
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        // Check if date is in the past
        if (isPastDate(date)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot book resources for past dates'
            });
        }

        // Check if attendees exceed capacity
        if (attendees > resource.capacity) {
            return res.status(400).json({
                success: false,
                message: `Number of attendees (${attendees}) exceeds resource capacity (${resource.capacity})`
            });
        }

        // Format times consistently
        const formattedStartTime = formatTimeForDB(start_time);
        const formattedEndTime = formatTimeForDB(end_time);

        // Check duration
        const duration = calculateDuration(formattedStartTime, formattedEndTime);
        if (duration < 30) {
            return res.status(400).json({
                success: false,
                message: 'Minimum booking duration is 30 minutes'
            });
        }
        if (duration > 240) {
            return res.status(400).json({
                success: false,
                message: 'Maximum booking duration is 4 hours'
            });
        }

        // Check availability
        const isAvailable = await Resource.checkAvailability(
            resource_id,
            date,
            formattedStartTime,
            formattedEndTime
        );

        if (!isAvailable) {
            const conflicts = await Booking.findConflicts(
                resource_id,
                date,
                formattedStartTime,
                formattedEndTime
            );
            return res.status(409).json({
                success: false,
                message: 'Resource is not available for the selected time slot',
                conflicts
            });
        }

        // Create booking
        const bookingData = {
            ...req.body,
            user_id: req.user.user_id,
            start_time: formattedStartTime,
            end_time: formattedEndTime,
            status: req.user.role === 'admin' ? 'approved' : 'pending'
        };

        const booking = await Booking.create(bookingData);

        // Create notification
        await Notification.createBookingNotification(
            req.user.user_id,
            booking.status === 'approved' ? 'approved' : 'pending',
            booking,
            resource
        );

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            booking
        });
    } catch (error) {
        logger.error('Create booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating booking',
            error: error.message
        });
    }
};

/**
 * Update booking
 * PUT /api/bookings/:id
 */
const updateBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;

        // Check if booking exists
        const existingBooking = await Booking.findById(bookingId);
        if (!existingBooking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check permission
        if (req.user.role !== 'admin' && existingBooking.user_id !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this booking'
            });
        }

        // Check if booking is in the past
        if (isPastDate(existingBooking.date)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot update past bookings'
            });
        }

        // If date or time is being changed, check availability
        if (req.body.date || req.body.start_time || req.body.end_time) {
            const date = req.body.date || existingBooking.date;
            const startTime = req.body.start_time ? formatTimeForDB(req.body.start_time) : existingBooking.start_time;
            const endTime = req.body.end_time ? formatTimeForDB(req.body.end_time) : existingBooking.end_time;

            const isAvailable = await Resource.checkAvailability(
                existingBooking.resource_id,
                date,
                startTime,
                endTime,
                bookingId
            );

            if (!isAvailable) {
                return res.status(409).json({
                    success: false,
                    message: 'Resource is not available for the selected time slot'
                });
            }

            // Format times if provided
            if (req.body.start_time) req.body.start_time = startTime;
            if (req.body.end_time) req.body.end_time = endTime;
        }

        // Reset status to pending if user updates their booking
        if (req.user.role !== 'admin' && existingBooking.status === 'approved') {
            req.body.status = 'pending';
        }

        const updatedBooking = await Booking.update(bookingId, req.body);

        res.json({
            success: true,
            message: 'Booking updated successfully',
            booking: updatedBooking
        });
    } catch (error) {
        logger.error('Update booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating booking',
            error: error.message
        });
    }
};

/**
 * Delete/Cancel booking
 * DELETE /api/bookings/:id
 */
const deleteBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;

        // Check if booking exists
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check permission
        if (req.user.role !== 'admin' && booking.user_id !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this booking'
            });
        }

        await Booking.delete(bookingId);

        res.json({
            success: true,
            message: 'Booking deleted successfully'
        });
    } catch (error) {
        logger.error('Delete booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting booking',
            error: error.message
        });
    }
};

/**
 * Approve booking
 * PUT /api/bookings/:id/approve
 */
const approveBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;

        // Check if booking exists
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (booking.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending bookings can be approved'
            });
        }

        // Check availability again
        const isAvailable = await Resource.checkAvailability(
            booking.resource_id,
            booking.date,
            booking.start_time,
            booking.end_time,
            bookingId
        );

        if (!isAvailable) {
            return res.status(409).json({
                success: false,
                message: 'Resource is no longer available for this time slot'
            });
        }

        const approvedBooking = await Booking.approve(bookingId);

        // Get user and resource details
        const user = await User.findById(booking.user_id);
        const resource = await Resource.findById(booking.resource_id);

        // Create notification
        await Notification.createBookingNotification(
            booking.user_id,
            'approved',
            approvedBooking,
            resource
        );

        // Send email
        sendBookingApproval(approvedBooking, user, resource).catch(err =>
            logger.error('Failed to send approval email:', err)
        );

        res.json({
            success: true,
            message: 'Booking approved successfully',
            booking: approvedBooking
        });
    } catch (error) {
        logger.error('Approve booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving booking',
            error: error.message
        });
    }
};

/**
 * Reject booking
 * PUT /api/bookings/:id/reject
 */
const rejectBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { reason } = req.body;

        // Check if booking exists
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (booking.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending bookings can be rejected'
            });
        }

        const rejectedBooking = await Booking.reject(bookingId);

        // Get user and resource details
        const user = await User.findById(booking.user_id);
        const resource = await Resource.findById(booking.resource_id);

        // Create notification
        await Notification.create({
            user_id: booking.user_id,
            type: 'rejected',
            title: 'Booking Rejected',
            message: `Your booking for ${resource.name} on ${booking.date} has been rejected. ${reason ? 'Reason: ' + reason : ''}`,
            priority: 'high'
        });

        // Send email
        sendBookingRejection(rejectedBooking, user, resource, reason).catch(err =>
            logger.error('Failed to send rejection email:', err)
        );

        res.json({
            success: true,
            message: 'Booking rejected successfully',
            booking: rejectedBooking
        });
    } catch (error) {
        logger.error('Reject booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error rejecting booking',
            error: error.message
        });
    }
};

/**
 * Cancel booking
 * PUT /api/bookings/:id/cancel
 */
const cancelBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;

        // Check if booking exists
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check permission
        if (req.user.role !== 'admin' && booking.user_id !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to cancel this booking'
            });
        }

        const cancelledBooking = await Booking.cancel(bookingId);

        res.json({
            success: true,
            message: 'Booking cancelled successfully',
            booking: cancelledBooking
        });
    } catch (error) {
        logger.error('Cancel booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling booking',
            error: error.message
        });
    }
};

/**
 * Get booking statistics
 * GET /api/bookings/stats
 */
const getBookingStats = async (req, res) => {
    try {
        const stats = await Booking.getStatistics();

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        logger.error('Get booking stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching booking statistics',
            error: error.message
        });
    }
};

/**
 * Get upcoming bookings
 * GET /api/bookings/upcoming
 */
const getUpcomingBookings = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const bookings = await Booking.findUpcoming(limit);

        res.json({
            success: true,
            count: bookings.length,
            bookings
        });
    } catch (error) {
        logger.error('Get upcoming bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching upcoming bookings',
            error: error.message
        });
    }
};

/**
 * Get pending bookings
 * GET /api/bookings/pending
 */
const getPendingBookings = async (req, res) => {
    try {
        const bookings = await Booking.findPending();

        res.json({
            success: true,
            count: bookings.length,
            bookings
        });
    } catch (error) {
        logger.error('Get pending bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pending bookings',
            error: error.message
        });
    }
};

/**
 * Get today's bookings
 * GET /api/bookings/today
 */
const getTodayBookings = async (req, res) => {
    try {
        const bookings = await Booking.findToday();

        res.json({
            success: true,
            count: bookings.length,
            bookings
        });
    } catch (error) {
        logger.error("Get today's bookings error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching today's bookings",
            error: error.message
        });
    }
};

module.exports = {
    getAllBookings,
    getBookingById,
    createBooking,
    updateBooking,
    deleteBooking,
    approveBooking,
    rejectBooking,
    cancelBooking,
    getBookingStats,
    getUpcomingBookings,
    getPendingBookings,
    getTodayBookings
};
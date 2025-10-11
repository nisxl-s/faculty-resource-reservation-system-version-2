
const express = require('express');
const router = express.Router();
const Resource = require('../models/resource');
const Booking = require('../models/booking');
const { authenticate } = require('../middleware/authMiddleware');
const { validateAvailabilityCheck } = require('../middleware/validationMiddleware');
const logger = require('../utils/logger');

// All routes require authentication
router.use(authenticate);

/**
 * Check resource availability
 * GET /api/availability/check
 */
router.get('/check', validateAvailabilityCheck, async (req, res) => {
    try {
        const { resource_id, date, start_time, end_time } = req.query;

        // Check if resource exists
        const resource = await Resource.findById(resource_id);
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        // Format times
        const formattedStartTime = start_time.length === 5 ? `${start_time}:00` : start_time;
        const formattedEndTime = end_time.length === 5 ? `${end_time}:00` : end_time;

        // Check availability
        const isAvailable = await Resource.checkAvailability(
            resource_id,
            date,
            formattedStartTime,
            formattedEndTime
        );

        // Get conflicts if not available
        let conflicts = [];
        if (!isAvailable) {
            conflicts = await Booking.findConflicts(
                resource_id,
                date,
                formattedStartTime,
                formattedEndTime
            );
        }

        // Get schedule for the day
        const schedule = await Resource.getSchedule(resource_id, date);

        res.json({
            success: true,
            available: isAvailable,
            resource: {
                resource_id: resource.resource_id,
                name: resource.name,
                type: resource.type,
                capacity: resource.capacity
            },
            date,
            start_time: formattedStartTime,
            end_time: formattedEndTime,
            conflicts,
            schedule
        });
    } catch (error) {
        logger.error('Check availability error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking availability',
            error: error.message
        });
    }
});

/**
 * Get available resources for specific time
 * GET /api/availability/resources
 */
router.get('/resources', async (req, res) => {
    try {
        const { date, start_time, end_time, type, faculty, capacity } = req.query;

        if (!date || !start_time || !end_time) {
            return res.status(400).json({
                success: false,
                message: 'Date, start_time, and end_time are required'
            });
        }

        // Format times
        const formattedStartTime = start_time.length === 5 ? `${start_time}:00` : start_time;
        const formattedEndTime = end_time.length === 5 ? `${end_time}:00` : end_time;

        const filters = {
            type,
            faculty,
            capacity: capacity ? parseInt(capacity) : undefined
        };

        const resources = await Resource.findAvailable(
            date,
            formattedStartTime,
            formattedEndTime,
            filters
        );

        res.json({
            success: true,
            count: resources.length,
            date,
            start_time: formattedStartTime,
            end_time: formattedEndTime,
            resources
        });
    } catch (error) {
        logger.error('Get available resources error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching available resources',
            error: error.message
        });
    }
});

/**
 * Get resource schedule for date range
 * GET /api/availability/schedule
 */
router.get('/schedule', async (req, res) => {
    try {
        const { resource_id, start_date, end_date } = req.query;

        if (!resource_id || !start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'resource_id, start_date, and end_date are required'
            });
        }

        // Check if resource exists
        const resource = await Resource.findById(resource_id);
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        // Get bookings for date range
        const bookings = await Booking.findByResource(resource_id, {
            start_date,
            end_date
        });

        res.json({
            success: true,
            resource: {
                resource_id: resource.resource_id,
                name: resource.name,
                type: resource.type
            },
            start_date,
            end_date,
            bookings
        });
    } catch (error) {
        logger.error('Get schedule error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching schedule',
            error: error.message
        });
    }
});

module.exports = router;

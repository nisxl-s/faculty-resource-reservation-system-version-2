const Resource = require('../models/resource');
const Booking = require('../models/booking');
const logger = require('../utils/logger');

/**
 * Get all resources
 * GET /api/resources
 */
const getAllResources = async (req, res) => {
    try {
        const filters = {
            type: req.query.type,
            faculty: req.query.faculty,
            status: req.query.status,
            building: req.query.building,
            capacity: req.query.capacity,
            search: req.query.search
        };

        const resources = await Resource.findAll(filters);

        // Get statistics
        const stats = await Resource.getStatistics();

        res.json({
            success: true,
            count: resources.length,
            resources,
            stats
        });
    } catch (error) {
        logger.error('Get all resources error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching resources',
            error: error.message
        });
    }
};

/**
 * Get resource by ID
 * GET /api/resources/:id
 */
const getResourceById = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        // Get schedule if date is provided
        let schedule = null;
        if (req.query.date) {
            schedule = await Resource.getSchedule(req.params.id, req.query.date);
        }

        res.json({
            success: true,
            resource,
            ...(schedule && { schedule })
        });
    } catch (error) {
        logger.error('Get resource by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching resource',
            error: error.message
        });
    }
};

/**
 * Create new resource
 * POST /api/resources
 */
const createResource = async (req, res) => {
    try {
        const resource = await Resource.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Resource created successfully',
            resource
        });
    } catch (error) {
        logger.error('Create resource error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating resource',
            error: error.message
        });
    }
};

/**
 * Update resource
 * PUT /api/resources/:id
 */
const updateResource = async (req, res) => {
    try {
        const resourceId = req.params.id;

        // Check if resource exists
        const existingResource = await Resource.findById(resourceId);
        if (!existingResource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        const updatedResource = await Resource.update(resourceId, req.body);

        res.json({
            success: true,
            message: 'Resource updated successfully',
            resource: updatedResource
        });
    } catch (error) {
        logger.error('Update resource error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating resource',
            error: error.message
        });
    }
};

/**
 * Delete resource
 * DELETE /api/resources/:id
 */
const deleteResource = async (req, res) => {
    try {
        const resourceId = req.params.id;

        // Check if resource exists
        const resource = await Resource.findById(resourceId);
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        // Check if resource has active bookings
        const activeBookings = await Booking.findByResource(resourceId, { 
            status: 'approved' 
        });
        
        if (activeBookings.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete resource with active bookings'
            });
        }

        await Resource.delete(resourceId);

        res.json({
            success: true,
            message: 'Resource deleted successfully'
        });
    } catch (error) {
        logger.error('Delete resource error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting resource',
            error: error.message
        });
    }
};

/**
 * Get resource statistics
 * GET /api/resources/stats
 */
const getResourceStats = async (req, res) => {
    try {
        const stats = await Resource.getStatistics();

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        logger.error('Get resource stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching resource statistics',
            error: error.message
        });
    }
};

/**
 * Get available resources
 * GET /api/resources/available
 */
const getAvailableResources = async (req, res) => {
    try {
        const { date, start_time, end_time } = req.query;

        if (!date || !start_time || !end_time) {
            return res.status(400).json({
                success: false,
                message: 'Date, start_time, and end_time are required'
            });
        }

        const filters = {
            type: req.query.type,
            faculty: req.query.faculty,
            capacity: req.query.capacity
        };

        const resources = await Resource.findAvailable(date, start_time, end_time, filters);

        res.json({
            success: true,
            count: resources.length,
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
};

/**
 * Get resource schedule
 * GET /api/resources/:id/schedule
 */
const getResourceSchedule = async (req, res) => {
    try {
        const resourceId = req.params.id;
        const date = req.query.date || new Date().toISOString().split('T')[0];

        // Check if resource exists
        const resource = await Resource.findById(resourceId);
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        const schedule = await Resource.getSchedule(resourceId, date);

        res.json({
            success: true,
            resource_id: resourceId,
            resource_name: resource.name,
            date,
            schedule
        });
    } catch (error) {
        logger.error('Get resource schedule error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching resource schedule',
            error: error.message
        });
    }
};

/**
 * Check resource availability
 * GET /api/resources/:id/check-availability
 */
const checkResourceAvailability = async (req, res) => {
    try {
        const resourceId = req.params.id;
        const { date, start_time, end_time } = req.query;

        if (!date || !start_time || !end_time) {
            return res.status(400).json({
                success: false,
                message: 'Date, start_time, and end_time are required'
            });
        }

        // Check if resource exists
        const resource = await Resource.findById(resourceId);
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        const isAvailable = await Resource.checkAvailability(
            resourceId, 
            date, 
            start_time, 
            end_time
        );

        // Get conflicts if not available
        let conflicts = [];
        if (!isAvailable) {
            conflicts = await Booking.findConflicts(resourceId, date, start_time, end_time);
        }

        res.json({
            success: true,
            available: isAvailable,
            resource: {
                resource_id: resource.resource_id,
                name: resource.name,
                type: resource.type
            },
            date,
            start_time,
            end_time,
            ...(conflicts.length > 0 && { conflicts })
        });
    } catch (error) {
        logger.error('Check resource availability error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking resource availability',
            error: error.message
        });
    }
};

/**
 * Get resource bookings
 * GET /api/resources/:id/bookings
 */
const getResourceBookings = async (req, res) => {
    try {
        const resourceId = req.params.id;

        // Check if resource exists
        const resource = await Resource.findById(resourceId);
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        const filters = {
            date: req.query.date,
            status: req.query.status
        };

        const bookings = await Booking.findByResource(resourceId, filters);

        res.json({
            success: true,
            resource_id: resourceId,
            resource_name: resource.name,
            count: bookings.length,
            bookings
        });
    } catch (error) {
        logger.error('Get resource bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching resource bookings',
            error: error.message
        });
    }
};

/**
 * Get resources by type
 * GET /api/resources/type/:type
 */
const getResourcesByType = async (req, res) => {
    try {
        const type = req.params.type;
        const resources = await Resource.findByType(type);

        res.json({
            success: true,
            type,
            count: resources.length,
            resources
        });
    } catch (error) {
        logger.error('Get resources by type error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching resources by type',
            error: error.message
        });
    }
};

/**
 * Get resources by faculty
 * GET /api/resources/faculty/:faculty
 */
const getResourcesByFaculty = async (req, res) => {
    try {
        const faculty = req.params.faculty;
        const resources = await Resource.findByFaculty(faculty);

        res.json({
            success: true,
            faculty,
            count: resources.length,
            resources
        });
    } catch (error) {
        logger.error('Get resources by faculty error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching resources by faculty',
            error: error.message
        });
    }
};

module.exports = {
    getAllResources,
    getResourceById,
    createResource,
    updateResource,
    deleteResource,
    getResourceStats,
    getAvailableResources,
    getResourceSchedule,
    checkResourceAvailability,
    getResourceBookings,
    getResourcesByType,
    getResourcesByFaculty
};
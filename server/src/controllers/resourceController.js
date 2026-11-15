const { normalizeDetails } = require('../utils/resourceDetails');
const { pagination } = require('../utils/pagination');
const { interval } = require('../utils/bookingTime');
const Resource = require('../models/resource');
const { validationResult } = require('express-validator');
const { cacheDeletePattern } = require('../config/cache');
const { monthWindow, occupiedIntervals } = require('../utils/resourceCalendar');

exports.getCalendar = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const { month } = req.query;
    const { start, end } = monthWindow(month);
    const calendar = await Resource.getCalendar(req.params.id, start, end);
    if (!calendar) return res.status(404).json({ success: false, message: 'Resource not found' });
    return res.json({ success: true, data: {
      month, time_zone: 'Asia/Colombo', resource_status: calendar.status,
      bookings: occupiedIntervals(calendar.bookings)
    } });
  } catch (error) {
    if (!error.status) console.error('Resource calendar error:', error.code || error.message);
    return res.status(error.status || 500).json({ success: false, message: error.status === 400 ? error.message : 'Unable to load resource availability' });
  }
};

// Get all resources
exports.getAllResources = async (req, res) => {
  try {
    const { type, status, building, faculty_code, sharing_scope } = req.query;
    
    const filters = {faculty_code,sharing_scope};
    if (type) filters.type = type;
    if (status) filters.status = status;
    if (building) filters.building = building;

    const resources = await Resource.findAll(filters, pagination(req.query));

    res.json({
      success: true,
      data: { resources }
    });
  } catch (error) {
    console.error('Get all resources error:', error);
    res.status(error.code === 'ER_DUP_ENTRY' ? 409 : error.status || 500).json({ 
      success: false, 
      message: 'Error fetching resources',
      error: error.message
    });
  }
};

// Get resource by ID
exports.getResourceById = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findById(id);

    if (!resource || resource.is_archived) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resource not found' 
      });
    }

    res.json({
      success: true,
      data: { resource }
    });
  } catch (error) {
    console.error('Get resource error:', error);
    res.status(error.code === 'ER_DUP_ENTRY' ? 409 : error.status || 500).json({ 
      success: false, 
      message: 'Error fetching resource',
      error: error.message
    });
  }
};

// Create new resource (admin only)
exports.createResource = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, type, building, location, capacity, description, status, images } = req.body;

    const resourceId = await Resource.create({
      ...req.body,
      name,
      type,
      building,
      location,
      capacity,
      description,
      status,
      images,
      details: normalizeDetails(type, req.body.details)
    });

    const resource = await Resource.findById(resourceId);

    // Invalidate resources list cache
    await cacheDeletePattern('resources:*');

    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      data: { resource }
    });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(error.code === 'ER_DUP_ENTRY' ? 409 : error.status || 500).json({ 
      success: false, 
      message: error.code === 'ER_DUP_ENTRY' ? 'Asset code already exists' : error.status === 400 ? error.message : 'Error creating resource',
      error: error.message
    });
  }
};

// Update resource (admin only)
exports.updateResource = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { id } = req.params;
    
    // Check if resource exists
    const existingResource = await Resource.findById(id);
    if (!existingResource || existingResource.is_archived) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resource not found' 
      });
    }

    const { name, type, building, location, capacity, description, status, images } = req.body;

    await Resource.update(id, {
      ...req.body,
      name,
      type,
      building,
      location,
      capacity,
      description,
      status,
      images,
      details: normalizeDetails(type, req.body.details === undefined && type === existingResource.type ? existingResource.details : req.body.details)
    });

    const resource = await Resource.findById(id);

    // Invalidate resource caches
    await cacheDeletePattern('resources:*');

    res.json({
      success: true,
      message: 'Resource updated successfully',
      data: { resource }
    });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(error.code === 'ER_DUP_ENTRY' ? 409 : error.status || 500).json({ 
      success: false, 
      message: error.code === 'ER_DUP_ENTRY' ? 'Asset code already exists' : error.status === 400 ? error.message : 'Error updating resource',
      error: error.message
    });
  }
};

// Delete resource (admin only)
exports.deleteResource = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if resource exists
    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resource not found' 
      });
    }

    await Resource.delete(id);

    // Invalidate resource caches
    await cacheDeletePattern('resources:*');

    res.json({
      success: true,
      message: 'Resource deleted successfully'
    });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(error.code === 'ER_DUP_ENTRY' ? 409 : error.status || 500).json({ 
      success: false, 
      message: error.status ? error.message : 'Error deleting resource',
      error: error.message
    });
  }
};

// Check resource availability
exports.checkAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    let { start_time, end_time } = req.query;

    if (!start_time || !end_time) {
      return res.status(400).json({ 
        success: false, 
        message: 'start_time and end_time are required' 
      });
    }

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resource not found' 
      });
    }

    ({ start_time, end_time } = interval(start_time, end_time));
    const isAvailable = resource.status === 'available' && await Resource.checkAvailability(id, start_time, end_time);

    res.json({
      success: true,
      data: { 
        resource_id: id,
        available: isAvailable,
        start_time,
        end_time
      }
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(error.code === 'ER_DUP_ENTRY' ? 409 : error.status || 500).json({ 
      success: false, 
      message: 'Error checking availability',
      error: error.message
    });
  }
};

// Get available resources for time slot
exports.getAvailableForTimeSlot = async (req, res) => {
  try {
    let { start_time, end_time, type, attendees } = req.query;
    if (attendees !== undefined && (!/^[1-9]\d*$/.test(String(attendees)) || !Number.isSafeInteger(Number(attendees)))) {
      return res.status(400).json({success:false,message:'Expected attendees must be a positive whole number'});
    }
    res.setHeader('Cache-Control', 'no-store');

    if (!start_time || !end_time) {
      return res.status(400).json({ 
        success: false, 
        message: 'start_time and end_time are required' 
      });
    }

    ({ start_time, end_time } = interval(start_time, end_time, {future:true}));
    const resources = await Resource.findAvailableForTimeSlot(start_time, end_time, type, attendees ? Number(attendees) : null);

    res.json({
      success: true,
      data: { resources }
    });
  } catch (error) {
    console.error('Get available resources error:', error);
    res.status(error.code === 'ER_DUP_ENTRY' ? 409 : error.status || 500).json({ 
      success: false, 
      message: 'Error fetching available resources',
      error: error.message
    });
  }
};

// Get resource statistics (admin only)
exports.getResourceStats = async (req, res) => {
  try {
    const stats = await Resource.getStats();

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get resource stats error:', error);
    res.status(error.code === 'ER_DUP_ENTRY' ? 409 : error.status || 500).json({ 
      success: false, 
      message: 'Error fetching resource statistics',
      error: error.message
    });
  }
};

// Get popular resources
exports.getPopularResources = async (req, res) => {
  try {
    const { limit } = req.query;
    const resources = await Resource.getPopular(pagination(req.query, 5).limit);

    res.json({
      success: true,
      data: { resources }
    });
  } catch (error) {
    console.error('Get popular resources error:', error);
    res.status(error.code === 'ER_DUP_ENTRY' ? 409 : error.status || 500).json({ 
      success: false, 
      message: 'Error fetching popular resources',
      error: error.message
    });
  }
};


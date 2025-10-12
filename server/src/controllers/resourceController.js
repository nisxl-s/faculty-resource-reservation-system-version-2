const Resource = require('../models/Resource');
const { validationResult } = require('express-validator');

// Get all resources
exports.getAllResources = async (req, res) => {
  try {
    const { type, status, building } = req.query;
    
    const filters = {};
    if (type) filters.type = type;
    if (status) filters.status = status;
    if (building) filters.building = building;

    const resources = await Resource.findAll(filters);

    res.json({
      success: true,
      data: { resources }
    });
  } catch (error) {
    console.error('Get all resources error:', error);
    res.status(500).json({ 
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

    if (!resource) {
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
    res.status(500).json({ 
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

    const { name, type, building, location, capacity, description, status } = req.body;

    const resourceId = await Resource.create({
      name,
      type,
      building,
      location,
      capacity,
      description,
      status
    });

    const resource = await Resource.findById(resourceId);

    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      data: { resource }
    });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating resource',
      error: error.message
    });
  }
};

// Update resource (admin only)
exports.updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if resource exists
    const existingResource = await Resource.findById(id);
    if (!existingResource) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resource not found' 
      });
    }

    const { name, type, building, location, capacity, description, status } = req.body;

    await Resource.update(id, {
      name,
      type,
      building,
      location,
      capacity,
      description,
      status
    });

    const resource = await Resource.findById(id);

    res.json({
      success: true,
      message: 'Resource updated successfully',
      data: { resource }
    });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating resource',
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

    res.json({
      success: true,
      message: 'Resource deleted successfully'
    });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting resource',
      error: error.message
    });
  }
};

// Check resource availability
exports.checkAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_time, end_time } = req.query;

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

    const isAvailable = await Resource.checkAvailability(id, start_time, end_time);

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
    res.status(500).json({ 
      success: false, 
      message: 'Error checking availability',
      error: error.message
    });
  }
};

// Get available resources for time slot
exports.getAvailableForTimeSlot = async (req, res) => {
  try {
    const { start_time, end_time, type } = req.query;

    if (!start_time || !end_time) {
      return res.status(400).json({ 
        success: false, 
        message: 'start_time and end_time are required' 
      });
    }

    const resources = await Resource.findAvailableForTimeSlot(start_time, end_time, type);

    res.json({
      success: true,
      data: { resources }
    });
  } catch (error) {
    console.error('Get available resources error:', error);
    res.status(500).json({ 
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
    res.status(500).json({ 
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
    const resources = await Resource.getPopular(limit ? parseInt(limit) : 5);

    res.json({
      success: true,
      data: { resources }
    });
  } catch (error) {
    console.error('Get popular resources error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching popular resources',
      error: error.message
    });
  }
};

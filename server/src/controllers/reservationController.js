const Reservation = require('../models/Reservation');
const Resource = require('../models/Resource');
const { validationResult } = require('express-validator');

// Get all reservations
exports.getAllReservations = async (req, res) => {
  try {
    const { user_id, resource_id, status, date } = req.query;
    
    const filters = {};
    if (user_id) filters.user_id = user_id;
    if (resource_id) filters.resource_id = resource_id;
    if (status) filters.status = status;
    if (date) filters.date = date;

    // If not admin, only show user's own reservations
    if (req.user.role !== 'admin') {
      filters.user_id = req.user.id;
    }

    const reservations = await Reservation.findAll(filters);

    res.json({
      success: true,
      data: { reservations }
    });
  } catch (error) {
    console.error('Get all reservations error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching reservations',
      error: error.message
    });
  }
};

// Get reservation by ID
exports.getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reservation not found' 
      });
    }

    // Check if user has permission to view this reservation
    if (req.user.role !== 'admin' && reservation.user_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    res.json({
      success: true,
      data: { reservation }
    });
  } catch (error) {
    console.error('Get reservation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching reservation',
      error: error.message
    });
  }
};

// Create new reservation
exports.createReservation = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { resource_id, start_time, end_time, purpose, notes } = req.body;

    // Check if resource exists
    const resource = await Resource.findById(resource_id);
    if (!resource) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resource not found' 
      });
    }

    // Check if resource is available
    if (resource.status !== 'available') {
      return res.status(400).json({ 
        success: false, 
        message: `Resource is currently ${resource.status}` 
      });
    }

    // Check for time conflicts with existing approved or pending reservations
    console.log('Checking conflicts for:', { resource_id, start_time, end_time });
    const hasConflict = await Reservation.checkConflict(resource_id, start_time, end_time);
    console.log('Conflict check result:', hasConflict);
    
    if (hasConflict) {
      // Get conflicting reservations for more details
      const conflicts = await Reservation.getConflictingReservations(resource_id, start_time, end_time);
      console.log('Conflicting reservations:', conflicts);
      
      const conflictDetails = conflicts.map(c => {
        const start = new Date(c.start_time).toLocaleString('en-US', { 
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        });
        const end = new Date(c.end_time).toLocaleString('en-US', { 
          hour: '2-digit', minute: '2-digit' 
        });
        return `${start} - ${end}`;
      }).join(', ');
      
      return res.status(409).json({ 
        success: false, 
        message: `This resource is already reserved for the selected time. Conflicting reservation(s): ${conflictDetails}. Please choose a different time slot or resource.`,
        conflicts: conflicts
      });
    }

    // Validate time range
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    if (endDate <= startDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'End time must be after start time' 
      });
    }

    // Create reservation
    const reservationId = await Reservation.create({
      user_id: req.user.id,
      resource_id,
      start_time,
      end_time,
      purpose,
      notes
    });

    const reservation = await Reservation.findById(reservationId);

    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: { reservation }
    });
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating reservation',
      error: error.message
    });
  }
};

// Update reservation
exports.updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if reservation exists
    const existingReservation = await Reservation.findById(id);
    if (!existingReservation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reservation not found' 
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && existingReservation.user_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const { start_time, end_time, purpose, notes, status } = req.body;

    // If times are being changed, check for conflicts
    if (start_time || end_time) {
      const newStartTime = start_time || existingReservation.start_time;
      const newEndTime = end_time || existingReservation.end_time;

      const hasConflict = await Reservation.checkConflict(
        existingReservation.resource_id,
        newStartTime,
        newEndTime,
        id
      );

      if (hasConflict) {
        return res.status(409).json({ 
          success: false, 
          message: 'Resource is already booked for this time slot' 
        });
      }
    }

    await Reservation.update(id, {
      start_time: start_time || existingReservation.start_time,
      end_time: end_time || existingReservation.end_time,
      purpose: purpose || existingReservation.purpose,
      notes: notes || existingReservation.notes,
      status: status || existingReservation.status
    });

    const reservation = await Reservation.findById(id);

    res.json({
      success: true,
      message: 'Reservation updated successfully',
      data: { reservation }
    });
  } catch (error) {
    console.error('Update reservation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating reservation',
      error: error.message
    });
  }
};

// Update reservation status (admin/faculty only)
exports.updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status value' 
      });
    }

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reservation not found' 
      });
    }

    await Reservation.updateStatus(id, status);

    const updatedReservation = await Reservation.findById(id);

    res.json({
      success: true,
      message: `Reservation ${status} successfully`,
      data: { reservation: updatedReservation }
    });
  } catch (error) {
    console.error('Update reservation status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating reservation status',
      error: error.message
    });
  }
};

// Cancel reservation
exports.cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reservation not found' 
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && reservation.user_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const success = await Reservation.cancel(id, req.user.id);

    if (!success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Unable to cancel reservation' 
      });
    }

    res.json({
      success: true,
      message: 'Reservation cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error cancelling reservation',
      error: error.message
    });
  }
};

// Delete reservation (admin only)
exports.deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reservation not found' 
      });
    }

    await Reservation.delete(id);

    res.json({
      success: true,
      message: 'Reservation deleted successfully'
    });
  } catch (error) {
    console.error('Delete reservation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting reservation',
      error: error.message
    });
  }
};

// Get user's reservations
exports.getUserReservations = async (req, res) => {
  try {
    const { status } = req.query;
    const reservations = await Reservation.findByUserId(req.user.id, status);

    res.json({
      success: true,
      data: { reservations }
    });
  } catch (error) {
    console.error('Get user reservations error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user reservations',
      error: error.message
    });
  }
};

// Get upcoming reservations
exports.getUpcomingReservations = async (req, res) => {
  try {
    const { limit } = req.query;
    const userId = req.user.role === 'admin' ? null : req.user.id;
    const reservations = await Reservation.getUpcoming(userId, limit ? parseInt(limit) : 10);

    res.json({
      success: true,
      data: { reservations }
    });
  } catch (error) {
    console.error('Get upcoming reservations error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching upcoming reservations',
      error: error.message
    });
  }
};

// Get reservation statistics
exports.getReservationStats = async (req, res) => {
  try {
    const userId = req.user.role === 'admin' ? null : req.user.id;
    const stats = await Reservation.getStats(userId);

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get reservation stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching reservation statistics',
      error: error.message
    });
  }
};

// Get reservations by date
exports.getReservationsByDate = async (req, res) => {
  try {
    const { date, resource_id } = req.query;

    if (!date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Date parameter is required' 
      });
    }

    const reservations = await Reservation.findByDate(date, resource_id);

    res.json({
      success: true,
      data: { reservations }
    });
  } catch (error) {
    console.error('Get reservations by date error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching reservations',
      error: error.message
    });
  }
};

const Reservation = require('../models/Reservation');
const service = require('../services/reservationService');
const { pagination } = require('../utils/pagination');
const {pool}=require('../config/database');
const { validationResult } = require('express-validator');
const { cacheDeletePattern } = require('../config/cache');

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
    if (!['admin', 'faculty'].includes(req.user.role)) {
      filters.user_id = req.user.id;
    }

    const page = pagination(req.query);
    const reservations = await Reservation.findAll(filters, page);

    res.json({
      success: true,
      data: { reservations }
    });
  } catch (error) {
    console.error('Get all reservations error:', error);
    res.status(error.status || 500).json({ 
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
    if (!['admin', 'faculty'].includes(req.user.role) && reservation.user_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const [history]=await pool.query('SELECT e.*,u.full_name AS actor_name FROM reservation_events e LEFT JOIN users u ON u.id=e.actor_id WHERE e.reservation_id=? ORDER BY e.id',[id]);
    res.json({
      success: true,
      data: { reservation, history }
    });
  } catch (error) {
    console.error('Get reservation error:', error);
    res.status(error.status || 500).json({ 
      success: false, 
      message: 'Error fetching reservation',
      error: error.message
    });
  }
};

// Create new reservation
exports.createReservation = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const id = await service.create(req.body, req.user);
    await cacheDeletePattern('reservations:*');
    res.status(201).json({ success: true, message: 'Reservation created successfully', data: { reservation: await Reservation.findById(id) } });
  } catch (error) { next(error); }
};

exports.updateReservation = async (req, res, next) => {
  try {
    await service.mutate(req.params.id, req.user, 'edit', req.body);
    await cacheDeletePattern('reservations:*');
    res.json({ success: true, message: 'Reservation updated successfully', data: { reservation: await Reservation.findById(req.params.id) } });
  } catch (error) { next(error); }
};

exports.updateReservationStatus = async (req, res, next) => {
  try {
    await service.mutate(req.params.id, req.user, 'status', req.body);
    await cacheDeletePattern('reservations:*');
    res.json({ success: true, message: 'Reservation updated successfully', data: { reservation: await Reservation.findById(req.params.id) } });
  } catch (error) { next(error); }
};

exports.cancelReservation = async (req, res, next) => {
  try {
    await service.mutate(req.params.id, req.user, 'cancel', req.body);
    await cacheDeletePattern('reservations:*');
    res.json({ success: true, message: 'Reservation cancelled successfully' });
  } catch (error) { next(error); }
};

exports.deleteReservation = async (req, res, next) => {
  try {
    await service.mutate(req.params.id, req.user, 'delete', req.body);
    await cacheDeletePattern('reservations:*');
    res.json({ success: true, message: 'Reservation deleted successfully' });
  } catch (error) { next(error); }
};

exports.getUserReservations = async (req, res) => {
  try {
    const { status } = req.query;
    const reservations = await Reservation.findByUserId(req.user.id, status, pagination(req.query));

    res.json({
      success: true,
      data: { reservations }
    });
  } catch (error) {
    console.error('Get user reservations error:', error);
    res.status(error.status || 500).json({ 
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
    const reservations = await Reservation.getUpcoming(userId, pagination(req.query, 10).limit);

    res.json({
      success: true,
      data: { reservations }
    });
  } catch (error) {
    console.error('Get upcoming reservations error:', error);
    res.status(error.status || 500).json({ 
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
    res.status(error.status || 500).json({ 
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

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Date parameter is required' 
      });
    }

    const reservations = await Reservation.findByDate(date, resource_id, pagination(req.query));

    res.json({
      success: true,
      data: { reservations }
    });
  } catch (error) {
    console.error('Get reservations by date error:', error);
    res.status(error.status || 500).json({ 
      success: false, 
      message: 'Error fetching reservations',
      error: error.message
    });
  }
};

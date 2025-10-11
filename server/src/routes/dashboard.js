const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/authMiddleware');

// Apply authentication to all dashboard routes
router.use(authenticate);

// Dashboard routes
router.get('/stats', dashboardController.getDashboardStats);
router.get('/recent-activity', dashboardController.getRecentActivity);
router.get('/upcoming-bookings', dashboardController.getDashboardUpcomingBookings);
router.get('/resource-utilization', dashboardController.getResourceUtilization);
router.get('/quick-stats', dashboardController.getQuickStats);
router.get('/user', dashboardController.getUserDashboard);

module.exports = router;
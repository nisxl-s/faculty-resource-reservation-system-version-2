const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const userRoutes = require('./users');
const resourceRoutes = require('./resources');
const bookingRoutes = require('./bookings');
const notificationRoutes = require('./notifications'); 
const dashboardRoutes = require('./dashboard'); 
const availabilityRoutes = require('./availability');

// Health check endpoint - ADD THIS
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString()
    });
});

// API info endpoint
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'University Resource Management API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            resources: '/api/resources',
            bookings: '/api/bookings',
            notifications: '/api/notifications',
            dashboard: '/api/dashboard',
            availability: '/api/availability'
        }
    });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/resources', resourceRoutes);
router.use('/bookings', bookingRoutes);
router.use('/notifications', notificationRoutes); 
router.use('/dashboard', dashboardRoutes); 
router.use('/availability', availabilityRoutes);

module.exports = router;
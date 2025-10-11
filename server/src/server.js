const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');
const { testConnection, initializeDatabase } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { initializeTransporter } = require('./utils/email');
const logger = require('./utils/logger');
const routes = require('./routes');

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors(config.cors));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting - Increased limit 10x for testing
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max * 10, // Increase limit 10x for testing
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', limiter);

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    next();
});

// Mount API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'University Resource Management System API',
        version: '1.0.0',
        documentation: '/api',
        status: 'running'
    });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Initialize server
const startServer = async () => {
    try {
        // Test database connection
        logger.info('Testing database connection...');
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            logger.error('Failed to connect to database. Please check your configuration.');
            process.exit(1);
        }

        // Initialize database tables
        await initializeDatabase();

        // Initialize email transporter
        initializeTransporter();

        // Start server
        const PORT = config.port;
        app.listen(PORT, () => {
            logger.info(`
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                              ║
║   University Resource Management System API                                                  ║
║                                                                                              ║
║   Server running on port ${PORT}                                                                 ║
║   Environment: ${config.nodeEnv}                                                              ║
║   Database: Connected                                                                         ║
║                                                                                              ║
║   API Documentation: http://localhost:${PORT}/api                ║
║   Health Check: http://localhost:${PORT}/api/health             ║
║                                                                                              ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
            `);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    // Close server & exit process
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    process.exit(0);
});

// Start the server
startServer();

module.exports = app;

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
require('dotenv').config();

const { testConnection, initializeTables, pool } = require('./config/database');
const { generalLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const feedbackRoutes = require('./routes/feedback');
const helpRoutes = require('./routes/help');

const app = express();

// Security HTTP Headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Restrict Cross-Origin Requests (CORS)
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (tools, curl, server-to-server)
    if (!origin) return callback(null, true);

    // In development, allow any localhost, 127.0.0.1, and private LAN IP
    if (process.env.NODE_ENV !== 'production') {
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      const isPrivateLan = /^https?:\/\/(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin);
      if (isLocalhost || isPrivateLan) {
        return callback(null, true);
      }
    }

    if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true
}));

// Protect against HTTP Parameter Pollution
app.use(hpp());

// Request body size limits (prevents JSON payload DoS memory exhaustion)
app.use(express.json({ limit: '10mb' }));
if (process.env.NODE_ENV === 'production') {
  app.set('json replacer', (key, value) => ['error', 'stack'].includes(key) ? undefined : value);
}
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint (exempt from rate limiting)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/ready', async (req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ready' }); }
  catch (_) { res.status(503).json({ status: 'unavailable' }); }
});

// Apply general rate limiting across all API routes
app.use('/api', generalLimiter, (req, res, next) => {
  try {
    if (Object.values(req.query).some(value => typeof value !== 'string')) return res.status(400).json({success:false,message:'Query values must be text'});
    if (req.query.limit !== undefined || req.query.offset !== undefined) require('./utils/pagination').pagination(req.query); next(); }
  catch (error) { next(error); }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/help', helpRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Serve client build in production
const clientBuildPath = path.join(__dirname, '..', '..', 'client', 'build');
if (require('fs').existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  app.get('*', (req, res) => {
    res.status(404).json({ 
      success: false,
      message: 'Client build not found. Run in development mode or build the client first.' 
    });
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: (err.status && err.status < 500) || process.env.NODE_ENV !== 'production' ? err.message : 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Initialize database tables
    await initializeTables();
    require('./utils/bookingPolicy').readPolicy();
    
    require('./services/emailService').startEmailWorker();

    // Start listening
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`API Base URL: http://localhost:${PORT}/api`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
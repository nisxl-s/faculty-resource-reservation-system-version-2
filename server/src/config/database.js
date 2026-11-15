process.env.TZ = 'Asia/Colombo';
const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool for better performance with configurable limits
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'faculty_reservation',
  timezone: '+05:30',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_MAX || '20', 10),
  maxIdle: parseInt(process.env.DB_POOL_MIN || '2', 10),
  idleTimeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
  connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '30000', 10),
  queueLimit: 100,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Interpret NOW() and DATETIME conversions in campus time on every connection.
pool.on('connection', connection => connection.query("SET time_zone = '+05:30'"));

// Pool lifecycle logging in development mode
if (process.env.NODE_ENV !== 'production') {
  pool.on('connection', () => {
    console.log('[DB Pool] New connection created');
  });
  pool.on('acquire', (connection) => {
    console.log(`[DB Pool] Connection ${connection.threadId} acquired`);
  });
  pool.on('release', (connection) => {
    console.log(`[DB Pool] Connection ${connection.threadId} released back to pool`);
  });
  pool.on('enqueue', () => {
    console.log('[DB Pool] Waiting for available connection slot');
  });
}

// Graceful pool shutdown on app termination
const closePool = async () => {
  try {
    await pool.end();
    console.log('DB Connection pool closed cleanly');
  } catch (err) {
    console.error('Error closing DB connection pool:', err.message);
  }
};

process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});

// Test database connection
const testConnection = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.error('Please check your database credentials in .env file');
    throw error;
  } finally {
    connection?.release();
  }
};

// I use the same schema and migration history for new and existing databases.
const { runMigrations } = require('./migrations');
const initializeTables = async () => {
  const connection = await pool.getConnection();
  try { await runMigrations(connection); }
  finally { connection.release(); }
};
module.exports = { pool, testConnection, initializeTables };

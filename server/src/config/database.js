const mysql = require('mysql2');
const config = require('./config');
const logger = require('../utils/logger');

// Create connection pool
const pool = mysql.createPool(config.database);

// Get promise-based pool
const promisePool = pool.promise();

// Test database connection
const testConnection = async () => {
    try {
        const connection = await promisePool.getConnection();
        logger.info('✓ MySQL Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        logger.error('✗ MySQL Database connection failed:', error.message);
        return false;
    }
};

// Initialize database tables if they don't exist
const initializeDatabase = async () => {
    try {
        const connection = await promisePool.getConnection();
        
        // Check if tables exist
        const [tables] = await connection.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('users', 'resources', 'bookings', 'notifications')
        `, [config.database.database]);
        
        if (tables.length === 0) {
            logger.warn('Database tables not found. Please run the SQL schema file to create tables.');
        } else {
            logger.info(`✓ Found ${tables.length} database tables`);
        }
        
        connection.release();
    } catch (error) {
        logger.error('Error checking database tables:', error.message);
    }
};

module.exports = {
    pool,
    promisePool,
    testConnection,
    initializeDatabase
};
const { promisePool } = require('../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

class User {
    /**
     * Create a new user
     * @param {Object} userData - User data
     * @returns {Promise<Object>} Created user
     */
    static async create(userData) {
        try {
            const {
                full_name,
                email,
                password,
                registration_no,
                department,
                faculty,
                role = 'student',
                academic_year,
                phone,
                profile_photo
            } = userData;

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            const [result] = await promisePool.query(
                `INSERT INTO users (full_name, email, password_hash, registration_no, department, faculty, role, academic_year, phone, profile_photo)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [full_name, email, password_hash, registration_no, department, faculty, role, academic_year, phone, profile_photo]
            );

            return await this.findById(result.insertId);
        } catch (error) {
            logger.error('Error creating user:', error);
            throw error;
        }
    }

    /**
     * Find user by ID
     * @param {Number} userId - User ID
     * @returns {Promise<Object>} User object
     */
    static async findById(userId) {
        try {
            const [rows] = await promisePool.query(
                'SELECT * FROM users WHERE user_id = ?',
                [userId]
            );
            return rows[0] || null;
        } catch (error) {
            logger.error('Error finding user by ID:', error);
            throw error;
        }
    }

    /**
     * Find user by email
     * @param {String} email - User email
     * @returns {Promise<Object>} User object
     */
    static async findByEmail(email) {
        try {
            const [rows] = await promisePool.query(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            return rows[0] || null;
        } catch (error) {
            logger.error('Error finding user by email:', error);
            throw error;
        }
    }

    /**
     * Find user by registration number
     * @param {String} registrationNo - Registration number
     * @returns {Promise<Object>} User object
     */
    static async findByRegistrationNo(registrationNo) {
        try {
            const [rows] = await promisePool.query(
                'SELECT * FROM users WHERE registration_no = ?',
                [registrationNo]
            );
            return rows[0] || null;
        } catch (error) {
            logger.error('Error finding user by registration number:', error);
            throw error;
        }
    }

    /**
     * Get all users with optional filtering
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} Array of users
     */
    static async findAll(filters = {}) {
        try {
            let query = 'SELECT * FROM users WHERE 1=1';
            const params = [];

            if (filters.role) {
                query += ' AND role = ?';
                params.push(filters.role);
            }

            if (filters.department) {
                query += ' AND department = ?';
                params.push(filters.department);
            }

            if (filters.faculty) {
                query += ' AND faculty = ?';
                params.push(filters.faculty);
            }

            if (filters.is_active !== undefined) {
                query += ' AND is_active = ?';
                params.push(filters.is_active);
            }

            if (filters.search) {
                query += ' AND (full_name LIKE ? OR email LIKE ? OR registration_no LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            query += ' ORDER BY full_name ASC';

            const [rows] = await promisePool.query(query, params);
            return rows;
        } catch (error) {
            logger.error('Error finding all users:', error);
            throw error;
        }
    }

    /**
     * Update user
     * @param {Number} userId - User ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated user
     */
    static async update(userId, updateData) {
        try {
            const allowedFields = ['full_name', 'email', 'department', 'faculty', 'academic_year', 'phone', 'profile_photo', 'is_active'];
            const updates = [];
            const values = [];

            Object.keys(updateData).forEach(key => {
                if (allowedFields.includes(key) && updateData[key] !== undefined) {
                    updates.push(`${key} = ?`);
                    values.push(updateData[key]);
                }
            });

            if (updates.length === 0) {
                throw new Error('No valid fields to update');
            }

            values.push(userId);

            await promisePool.query(
                `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
                values
            );

            return await this.findById(userId);
        } catch (error) {
            logger.error('Error updating user:', error);
            throw error;
        }
    }

    /**
     * Update user password
     * @param {Number} userId - User ID
     * @param {String} newPassword - New password
     * @returns {Promise<Boolean>} Success status
     */
    static async updatePassword(userId, newPassword) {
        try {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(newPassword, salt);

            await promisePool.query(
                'UPDATE users SET password_hash = ? WHERE user_id = ?',
                [password_hash, userId]
            );
            return true;
        } catch (error) {
            logger.error('Error updating password:', error);
            throw error;
        }
    }

    /**
     * Delete user (soft delete by setting is_active to false)
     * @param {Number} userId - User ID
     * @returns {Promise<Boolean>} Success status
     */
    static async delete(userId) {
        try {
            await promisePool.query('UPDATE users SET is_active = 0 WHERE user_id = ?', [userId]);
            return true;
        } catch (error) {
            logger.error('Error deleting user:', error);
            throw error;
        }
    }

    /**
     * Verify password
     * @param {String} password - Plain password
     * @param {String} hashedPassword - Hashed password
     * @returns {Promise<Boolean>} Verification result
     */
    static async verifyPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    /**
     * Get user statistics
     * @returns {Promise<Object>} User statistics
     */
    static async getStatistics() {
        try {
            const [stats] = await promisePool.query(`
                SELECT 
                    COUNT(*) as total_users,
                    SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_users,
                    SUM(CASE WHEN role = 'lecturer' THEN 1 ELSE 0 END) as lecturer_users,
                    SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as student_users,
                    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users
                FROM users
            `);
            return stats[0];
        } catch (error) {
            logger.error('Error getting user statistics:', error);
            throw error;
        }
    }
}

module.exports = User;
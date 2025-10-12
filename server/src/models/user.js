const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Create a new user
  static async create(userData) {
    const { full_name, email, password, role, department, phone } = userData;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO users (full_name, email, password, role, department, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(query, [
      full_name,
      email,
      hashedPassword,
      role || 'student',
      department,
      phone
    ]);
    
    return result.insertId;
  }

  // Find user by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await pool.query(query, [email]);
    return rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const query = 'SELECT id, full_name, email, role, department, phone, created_at FROM users WHERE id = ?';
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // Get all users (admin only)
  static async findAll() {
    const query = 'SELECT id, full_name, email, role, department, phone, created_at FROM users ORDER BY created_at DESC';
    const [rows] = await pool.query(query);
    return rows;
  }

  // Update user
  static async update(id, userData) {
    const { full_name, email, department, phone, role } = userData;
    
    const query = `
      UPDATE users 
      SET full_name = ?, email = ?, department = ?, phone = ?, role = ?
      WHERE id = ?
    `;
    
    await pool.query(query, [full_name, email, department, phone, role, id]);
    return true;
  }

  // Delete user
  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = ?';
    await pool.query(query, [id]);
    return true;
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Change password
  static async changePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const query = 'UPDATE users SET password = ? WHERE id = ?';
    await pool.query(query, [hashedPassword, id]);
    return true;
  }

  // Get user statistics
  static async getStats() {
    const query = `
      SELECT 
        role,
        COUNT(*) as count
      FROM users
      GROUP BY role
    `;
    const [rows] = await pool.query(query);
    return rows;
  }
}

module.exports = User;

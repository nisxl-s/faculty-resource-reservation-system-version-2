const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Create a new user
  static async create(userData) {
    const { full_name, email, password, role, department, phone, registration_id } = userData;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO users (full_name, email, password, role, department, phone, registration_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const connection = await pool.getConnection();
    try {
    await connection.beginTransaction();
    const [result] = await connection.query(query, [
      full_name,
      email,
      hashedPassword,
      role || 'student',
      department || null,
      phone || null,
      registration_id || null
    ]);
    
    await require('../services/emailService').welcome({full_name,email},connection);
    await connection.commit();
    return result.insertId;
    } catch(error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
  }

  // Find user by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await pool.query(query, [email]);
    return rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const query = 'SELECT id, full_name, email, role, department, phone, registration_id, is_active, token_version, created_at FROM users WHERE id = ?';
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // Get all users (admin only)
  static async findAll(page = { limit: 100, offset: 0 }) {
    const query = 'SELECT id, full_name, email, role, department, phone, registration_id, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const [rows] = await pool.query(query, [page.limit, page.offset]);
    return rows;
  }

  // Update user
  static async update(id, userData) {
    const { full_name, email, department, phone, role, registration_id } = userData;
    
    const query = `
      UPDATE users 
      SET token_version = token_version + IF(role <> ?, 1, 0), full_name = ?, email = ?, department = IF(?, department, ?), phone = IF(?, phone, ?), role = ?, registration_id = IF(?, registration_id, ?)
      WHERE id = ?
    `;
    
    await pool.query(query, [role, full_name, email, department === undefined, department ?? null, phone === undefined, phone ?? null, role, registration_id === undefined, registration_id || null, id]);
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
    const query = 'UPDATE users SET password = ?, token_version = token_version + 1, failed_login_attempts = 0, lockout_until = NULL WHERE id = ?';
    const connection=await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(query,[hashedPassword,id]);
      const [[user]]=await connection.query('SELECT email FROM users WHERE id=?',[id]);
      await require('../services/emailService').passwordChanged(user,connection);
      await connection.commit();return true;
    } catch(error) { await connection.rollback();throw error; }
    finally { connection.release(); }
  }

  // Record a failed login attempt; lock out if attempts >= 5
  static async recordFailedLogin(id) {
    await pool.query(`UPDATE users SET
      failed_login_attempts = IF(lockout_until IS NOT NULL AND lockout_until <= NOW(), 1, failed_login_attempts + 1),
      lockout_until = IF(failed_login_attempts >= 5, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NULL)
      WHERE id = ?`, [id]);
    const [[state]] = await pool.query('SELECT failed_login_attempts, lockout_until FROM users WHERE id = ?', [id]);
    return { locked: !!state.lockout_until, attempts: state.failed_login_attempts };
  }

  // Reset failed login counter upon successful authentication
  static async resetFailedLogin(id) {
    const query = 'UPDATE users SET failed_login_attempts = 0, lockout_until = NULL WHERE id = ?';
    await pool.query(query, [id]);
    return true;
  }

  // Save password reset token (invalidating previous unused tokens for the user)
  static async saveResetToken(userId, token, expiresAt, message) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query('SELECT id FROM users WHERE id = ? FOR UPDATE', [userId]);
      await connection.query('UPDATE password_reset_tokens SET used = TRUE WHERE user_id = ?', [userId]);
      const [result] = await connection.query('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)', [userId, token, expiresAt]);
      if(message) await require('../services/emailService').queueEmail(message,connection);
      await connection.commit(); return result.insertId;
    } catch (error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
  }

  // Find a valid, non-expired, unused password reset token
  static async findByResetToken(token) {
    const query = `
      SELECT * FROM password_reset_tokens 
      WHERE token = ? AND used = FALSE AND expires_at > NOW()
      ORDER BY id DESC LIMIT 1
    `;
    const [rows] = await pool.query(query, [token]);
    return rows[0];
  }

  static async resetPassword(token, newPassword) {
    const hash = await bcrypt.hash(newPassword, 10);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [[identity]] = await connection.query('SELECT user_id FROM password_reset_tokens WHERE token = ? LIMIT 1', [token]);
      if (!identity) { await connection.rollback(); return false; }
      await connection.query('SELECT id FROM users WHERE id = ? FOR UPDATE', [identity.user_id]);
      const [[record]] = await connection.query('SELECT * FROM password_reset_tokens WHERE token = ? AND used = FALSE AND expires_at > NOW() LIMIT 1 FOR UPDATE', [token]);
      if (!record) { await connection.rollback(); return false; }
      await connection.query('UPDATE users SET password = ?, token_version = token_version + 1, failed_login_attempts = 0, lockout_until = NULL WHERE id = ?', [hash, record.user_id]);
      await connection.query('UPDATE password_reset_tokens SET used = TRUE WHERE user_id = ?', [record.user_id]);
      const [[user]]=await connection.query('SELECT email FROM users WHERE id=?',[record.user_id]);
      await require('../services/emailService').passwordChanged(user,connection);
      await connection.commit();
      return true;
    } catch (error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
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

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/database');
require('dotenv').config();

const configuredSecret = process.env.JWT_SECRET;
if (process.env.NODE_ENV === 'production' && (!configuredSecret || configuredSecret.length < 32 || /change|replace|your.secret|example/i.test(configuredSecret))) {
  throw new Error('Production requires a unique JWT_SECRET of at least 32 characters');
}
const JWT_SECRET = configuredSecret || crypto.randomBytes(48).toString('hex');

async function verifyToken(req, res, next) {
  const authorization = req.header('Authorization');
  const match = typeof authorization === 'string' && /^Bearer ([^\s]+)$/i.exec(authorization);
  if (!match) return res.status(401).json({ success: false, message: 'Sign in to continue' });
  let decoded;
  try {
    decoded = jwt.verify(match[1], JWT_SECRET, { algorithms: ['HS256'] });
    if (!Number.isInteger(decoded.id) || !Number.isInteger(decoded.version)) throw new Error('Invalid identity');
  } catch (_) {
    return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
  }
  try {
    const [[user]] = await pool.query('SELECT id, email, role, is_active, token_version FROM users WHERE id = ?', [decoded.id]);
    if (!user || !user.is_active || Number(user.token_version) !== decoded.version || user.role !== decoded.role) {
      return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
    }
    // Current database state is authoritative, including role and email changes.
    req.user = { id: user.id, email: user.email, role: user.role, version: Number(user.token_version) };
    return next();
  } catch (error) {
    return next(error);
  }
}
const isAdmin = (req, res, next) => req.user.role === 'admin' ? next() : res.status(403).json({ success: false, message: 'Administrator access required' });
const isFacultyOrAdmin = (req, res, next) => ['faculty', 'admin'].includes(req.user.role) ? next() : res.status(403).json({ success: false, message: 'Faculty or administrator access required' });
module.exports = { verifyToken, isAdmin, isFacultyOrAdmin, JWT_SECRET };

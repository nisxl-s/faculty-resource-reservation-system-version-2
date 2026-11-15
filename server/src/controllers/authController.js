const User = require('../models/user');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pagination } = require('../utils/pagination');
const { JWT_SECRET } = require('../middleware/auth');
const { validationResult } = require('express-validator');
const emailService = require('../services/emailService');

// Register a new user
exports.register = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { full_name, email, password, department, phone, registration_id } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    // Create new user
    const userId = await User.create({
      full_name,
      email,
      password,
      role: 'student',
      department,
      phone: phone || null,
      registration_id: registration_id || null
    });

    // Get created user
    const user = await User.findById(userId);


    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role, version: Number(user.token_version)
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          registration_id: user.registration_id,
          department: user.department
        },
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(error.status || 500).json({ 
      success: false, 
      message: 'Error registering user',
      error: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user || !user.is_active) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check account lockout status
    if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
      const remainingMinutes = Math.max(1, Math.ceil((new Date(user.lockout_until) - new Date()) / 60000));
      return res.status(403).json({
        success: false,
        message: `Account temporarily locked due to multiple failed attempts. Please try again in ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`
      });
    }

    // Verify password
    const isPasswordValid = await User.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      const lockoutState = await User.recordFailedLogin(user.id, user.lockout_until && new Date(user.lockout_until) <= new Date() ? 0 : (user.failed_login_attempts || 0));
      if (lockoutState.locked) {
        return res.status(403).json({
          success: false,
          message: 'Account locked for 15 minutes due to 5 consecutive failed login attempts.'
        });
      }
      const attemptsLeft = Math.max(1, 5 - lockoutState.attempts);
      return res.status(401).json({ 
        success: false, 
        message: `Invalid email or password. (${attemptsLeft} attempt${attemptsLeft > 1 ? 's' : ''} remaining before account lockout)` 
      });
    }

    // Reset failed login counter upon successful authentication
    if (user.failed_login_attempts > 0 || user.lockout_until) {
      await User.resetFailedLogin(user.id);
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role, version: Number(user.token_version)
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          registration_id: user.registration_id,
          department: user.department
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(error.status || 500).json({ 
      success: false, 
      message: 'Error logging in',
      error: error.message
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(error.status || 500).json({ 
      success: false, 
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({success:false,errors:errors.array()});
    const { full_name, email, department, phone, registration_id } = req.body;

    // Check if email is being changed to an existing email
    if (email !== req.user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email already in use' 
        });
      }
    }

    await User.update(req.user.id, {
      full_name,
      email,
      department,
      phone,
      registration_id,
      role: req.user.role // Keep existing role
    });

    const updatedUser = await User.findById(req.user.id);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(error.status || 500).json({ 
      success: false, 
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findByEmail(req.user.email);
    
    // Verify current password
    const isPasswordValid = await User.verifyPassword(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    // Change password
    await User.changePassword(req.user.id, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(error.status || 500).json({ 
      success: false, 
      message: 'Error changing password',
      error: error.message
    });
  }
};

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll(pagination(req.query));

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(error.status || 500).json({ 
      success: false, 
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Create a user from the admin management area.
exports.createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { full_name, email, password, role, department, phone } = req.body;
    if (await User.findByEmail(email)) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const userId = await User.create({ full_name, email, password, role, department, phone });
    const user = await User.findById(userId);
    res.status(201).json({ success: true, message: 'User created successfully', data: { user } });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(error.status || 500).json({ success: false, message: 'Error creating user', error: error.message });
  }
};

// Update a user, including role, from the admin management area.
exports.updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { full_name, email, role, department, phone } = req.body;
    if (parseInt(id, 10) === req.user.id && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot remove administrator access from your own account'
      });
    }
    const emailOwner = await User.findByEmail(email);
    if (emailOwner && emailOwner.id !== parseInt(id, 10)) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    await User.update(id, { full_name, email, role, department, phone });
    const user = await User.findById(id);
    res.json({ success: true, message: 'User updated successfully', data: { user } });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(error.status || 500).json({ success: false, message: 'Error updating user', error: error.message });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete your own account' 
      });
    }

    await User.delete(id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(error.status || 500).json({ 
      success: false, 
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// Forgot password request
exports.forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findByEmail(email);

    // Check if user exists in database
    if (!user) {
      return res.json({ success: true, message: 'If an account with that email exists, a password reset email will be sent shortly.' });
    }

    // Generate secure 32-byte token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Save hashed token

    // Build reset link
    const clientUrl = emailService.clientUrl();
    const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;

    // Send email or log to dev console
    await User.saveResetToken(user.id,hashedToken,expiresAt,{to:user.email, subject:'Reset your password', text:'Use this link to choose a new password (valid for one hour):\n'+resetUrl+'\nIf you did not request this, ignore this email.', key:'reset:'+hashedToken, expiresAt});

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset email will be sent shortly.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(error.status || 500).json({
      success: false,
      message: 'An error occurred while processing your password reset request.',
      error: error.message
    });
  }
};

// Reset password with token
exports.resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { token, newPassword } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Reset token is required.' });
    }

    // Hash user-provided token to query database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const changed = await User.resetPassword(hashedToken, newPassword);
    if (!changed) return res.status(400).json({ success: false, message: 'Password reset link is invalid or has expired. Please request a new one.' });

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(error.status || 500).json({
      success: false,
      message: 'An error occurred while resetting your password.',
      error: error.message
    });
  }
};

const User = require('../models/user');
const { generateToken } = require('../utils/jwt');
const { sendWelcomeEmail } = require('../utils/email');
const Notification = require('../models/notification');
const logger = require('../utils/logger');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
    try {
        const { email, facultyId, fullName, department } = req.body;

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Check if registration number already exists
        if (facultyId) {
            const existingRegNo = await User.findByRegistrationNo(facultyId);
            if (existingRegNo) {
                return res.status(400).json({
                    success: false,
                    message: 'Registration number already exists'
                });
            }
        }

        // Map frontend fields to backend fields
        const userData = {
            full_name: fullName, // ← Fixed mapping
            email: email,
            password: req.body.password,
            registration_no: facultyId, // ← Fixed mapping
            department: department,
            faculty: req.body.faculty || 'General',
            role: 'student' // Default role for registration
        };

        // Create new user
        const user = await User.create(userData);

        // Create welcome notification
        await Notification.create({
            user_id: user.user_id,
            type: 'registration',
            title: 'Welcome to University Resource Management',
            message: 'Your account has been successfully created. You can now browse and book resources.',
            priority: 'medium'
        });

        // Send welcome email (optional)
        sendWelcomeEmail(user).catch(err => 
            logger.error('Failed to send welcome email:', err)
        );

        // Generate token
        const token = generateToken({
            user_id: user.user_id,
            email: user.email,
            role: user.role
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                department: user.department,
                faculty: user.faculty
            }
        });
    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message
        });
    }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
    try {
        const { email, password, userType } = req.body;

        // Find user by email
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated. Please contact administration.'
            });
        }

        // If userType is provided, verify it matches the user's role
        if (userType && user.role !== userType) {
            return res.status(401).json({
                success: false,
                message: 'User type mismatch. Please check your credentials.'
            });
        }

        // Verify password
        const isPasswordValid = await User.verifyPassword(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate token
        const token = generateToken({
            user_id: user.user_id,
            email: user.email,
            role: user.role
        });

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                department: user.department,
                faculty: user.faculty,
                registration_no: user.registration_no,
                academic_year: user.academic_year,
                phone: user.phone,
                profile_photo: user.profile_photo_path // ← Fixed field name
            }
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
    try {
        // In a stateless JWT system, logout is handled client-side
        // by removing the token from storage
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging out',
            error: error.message
        });
    }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.user_id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Handle profile photo field
        if (user.profile_photo_path) {
            user.profile_photo = user.profile_photo_path;
        } else {
            user.profile_photo = null;
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        logger.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: error.message
        });
    }
};

/**
 * Update current user profile
 * PUT /api/auth/me
 */
const updateProfile = async (req, res) => {
    try {
        const allowedUpdates = ['full_name', 'email', 'phone', 'academic_year', 'profile_photo', 'department', 'faculty'];
        const updates = {};

        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        // Check if email is being changed and if it's already taken
        if (updates.email && updates.email !== req.user.email) {
            const existingUser = await User.findByEmail(updates.email);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use'
                });
            }
        }

        const updatedUser = await User.update(req.user.user_id, updates);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        logger.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
};

/**
 * Change password
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        // Get user with password
        const user = await User.findByEmail(req.user.email);

        // Verify current password
        const isPasswordValid = await User.verifyPassword(currentPassword, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        await User.updatePassword(req.user.user_id, newPassword);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        logger.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password',
            error: error.message
        });
    }
};

module.exports = {
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    changePassword
};
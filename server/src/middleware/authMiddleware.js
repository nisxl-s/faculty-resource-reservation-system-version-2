const { verifyToken } = require('../utils/jwt');
const User = require('../models/user');
const logger = require('../utils/logger');

/**
 * Authenticate user with JWT token
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Please login to continue.'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = verifyToken(token);
        
        // Get user from database
        const user = await User.findById(decoded.user_id);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Please login again.'
            });
        }

        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated. Please contact administration.'
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token. Please login again.'
        });
    }
};

/**
 * Authorize user based on roles
 * @param  {...String} roles - Allowed roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'
            });
        }

        next();
    };
};

/**
 * Check if user is admin
 */
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};

/**
 * Check if user is lecturer or admin
 */
const isLecturerOrAdmin = (req, res, next) => {
    if (!req.user || !['lecturer', 'admin'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Lecturer or admin access required'
        });
    }
    next();
};

/**
 * Check if user owns the resource or is admin
 */
const isOwnerOrAdmin = (req, res, next) => {
    const resourceUserId = parseInt(req.params.userId || req.params.id);
    
    if (req.user.role === 'admin' || req.user.user_id === resourceUserId) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: 'You can only access your own resources'
    });
};

module.exports = {
    authenticate,
    authorize,
    isAdmin,
    isLecturerOrAdmin,
    isOwnerOrAdmin
};
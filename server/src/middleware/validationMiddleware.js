const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

/**
 * Validation rules for user registration - UPDATED to match controller
 */
const validateRegistration = [
    body('fullName')  // ← Changed from full_name to fullName
        .trim()
        .notEmpty().withMessage('Full name is required')
        .isLength({ min: 2, max: 255 }).withMessage('Full name must be between 2 and 255 characters'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('facultyId')  // ← Changed from registration_no to facultyId
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Faculty ID must not exceed 100 characters'),
    body('department')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Department must not exceed 100 characters'),
    body('faculty')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Faculty must not exceed 100 characters'),
    body('academic_year')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Academic year must not exceed 50 characters'),
    body('phone')
        .optional()
        .trim()
        .matches(/^[0-9]{3}-[0-9]{7}$/).withMessage('Phone must be in format: 077-1234567'),
    handleValidationErrors
];

/**
 * Validation rules for user login
 */
const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required'),
    handleValidationErrors
];

/**
 * Validation rules for user update - UPDATED to match controller
 */
const validateUserUpdate = [
    body('full_name')  // ← Keep as full_name for update (matches your controller's allowedUpdates)
        .optional()
        .trim()
        .isLength({ min: 2, max: 255 }).withMessage('Full name must be between 2 and 255 characters'),
    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    body('phone')
        .optional()
        .trim()
        .matches(/^[0-9]{3}-[0-9]{7}$/).withMessage('Phone must be in format: 077-1234567'),
    body('department')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Department must not exceed 100 characters'),
    body('faculty')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Faculty must not exceed 100 characters'),
    body('academic_year')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Academic year must not exceed 50 characters'),
    handleValidationErrors
];

/**
 * Validation rules for resource creation
 */
const validateResourceCreate = [
    body('name')
        .trim()
        .notEmpty().withMessage('Resource name is required')
        .isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters'),
    body('type')
        .notEmpty().withMessage('Resource type is required')
        .isIn(['laboratory', 'lecture-hall', 'auditorium', 'meeting-room', 'equipment'])
        .withMessage('Invalid resource type'),
    body('faculty')
        .trim()
        .notEmpty().withMessage('Faculty is required')
        .isLength({ max: 100 }).withMessage('Faculty must not exceed 100 characters'),
    body('building')
        .trim()
        .notEmpty().withMessage('Building is required')
        .isLength({ max: 255 }).withMessage('Building must not exceed 255 characters'),
    body('capacity')
        .notEmpty().withMessage('Capacity is required')
        .isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
    body('location')
        .optional()
        .trim()
        .isLength({ max: 255 }).withMessage('Location must not exceed 255 characters'),
    body('equipment')
        .optional()
        .isArray().withMessage('Equipment must be an array'),
    body('description')
        .optional()
        .trim(),
    handleValidationErrors
];

/**
 * Validation rules for resource update
 */
const validateResourceUpdate = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters'),
    body('type')
        .optional()
        .isIn(['laboratory', 'lecture-hall', 'auditorium', 'meeting-room', 'equipment'])
        .withMessage('Invalid resource type'),
    body('capacity')
        .optional()
        .isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
    body('status')
        .optional()
        .isIn(['available', 'occupied', 'maintenance', 'reserved'])
        .withMessage('Invalid status'),
    handleValidationErrors
];

/**
 * Validation rules for booking creation
 */
const validateBookingCreate = [
    body('resource_id')
        .notEmpty().withMessage('Resource ID is required')
        .isInt({ min: 1 }).withMessage('Invalid resource ID'),
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ min: 2, max: 255 }).withMessage('Title must be between 2 and 255 characters'),
    body('date')
        .notEmpty().withMessage('Date is required')
        .isDate().withMessage('Invalid date format (use YYYY-MM-DD)'),
    body('start_time')
        .notEmpty().withMessage('Start time is required')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (use HH:MM)'),
    body('end_time')
        .notEmpty().withMessage('End time is required')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (use HH:MM)'),
    body('reason')
        .notEmpty().withMessage('Reason is required')
        .isIn(['class', 'exam', 'meeting', 'workshop', 'event', 'research', 'other'])
        .withMessage('Invalid reason'),
    body('purpose')
        .optional()
        .trim(),
    body('requirements')
        .optional()
        .trim(),
    body('attendees')
        .notEmpty().withMessage('Number of attendees is required')
        .isInt({ min: 1 }).withMessage('Attendees must be a positive integer'),
    handleValidationErrors
];

/**
 * Validation rules for booking update
 */
const validateBookingUpdate = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 2, max: 255 }).withMessage('Title must be between 2 and 255 characters'),
    body('date')
        .optional()
        .isDate().withMessage('Invalid date format (use YYYY-MM-DD)'),
    body('start_time')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (use HH:MM)'),
    body('end_time')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (use HH:MM)'),
    body('reason')
        .optional()
        .isIn(['class', 'exam', 'meeting', 'workshop', 'event', 'research', 'other'])
        .withMessage('Invalid reason'),
    body('attendees')
        .optional()
        .isInt({ min: 1 }).withMessage('Attendees must be a positive integer'),
    handleValidationErrors
];

/**
 * Validation rules for ID parameter
 */
const validateId = [
    param('id')
        .isInt({ min: 1 }).withMessage('Invalid ID'),
    handleValidationErrors
];

/**
 * Validation rules for availability check
 */
const validateAvailabilityCheck = [
    query('resource_id')
        .notEmpty().withMessage('Resource ID is required')
        .isInt({ min: 1 }).withMessage('Invalid resource ID'),
    query('date')
        .notEmpty().withMessage('Date is required')
        .isDate().withMessage('Invalid date format (use YYYY-MM-DD)'),
    query('start_time')
        .notEmpty().withMessage('Start time is required')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (use HH:MM)'),
    query('end_time')
        .notEmpty().withMessage('End time is required')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (use HH:MM)'),
    handleValidationErrors
];

/**
 * Validation rules for pagination
 */
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateRegistration,
    validateLogin,
    validateUserUpdate,
    validateResourceCreate,
    validateResourceUpdate,
    validateBookingCreate,
    validateBookingUpdate,
    validateId,
    validateAvailabilityCheck,
    validatePagination
};
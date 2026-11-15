const express = require('express');
const router = express.Router();
router.param('id', (req, res, next, value) => {
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) return res.status(400).json({ success: false, message: 'Invalid record ID' });
  next();
});
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { authLimiter, forgotPasswordLimiter } = require('../middleware/rateLimiter');

// I validate email addresses without removing dots, tags or other valid characters.
// Validation rules
const registerValidation = [
  body('registration_id').optional({nullable:true}).trim().isLength({max:80}).withMessage('Registration ID must be at most 80 characters'),
  body('full_name').trim().notEmpty().isLength({max:255}).withMessage('Full name is required and must be at most 255 characters'),
  body('email').trim().isEmail().isLength({max:255}).withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/\d/).withMessage('Password must contain at least one number'),
  body('role').optional().equals('student').withMessage('Public registration creates student accounts; staff access must be granted by an administrator')
];

const adminUserValidation = [
  body('full_name').trim().notEmpty().isLength({max:255}).withMessage('Full name is required and must be at most 255 characters'),
  body('email').trim().isEmail().isLength({max:255}).withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/\d/).withMessage('Password must contain at least one number'),
  body('role').isIn(['student', 'faculty', 'admin']).withMessage('Invalid role')
];

const adminUserUpdateValidation = [
  body('full_name').trim().notEmpty().isLength({max:255}).withMessage('Full name is required and must be at most 255 characters'),
  body('email').trim().isEmail().isLength({max:255}).withMessage('Valid email is required'),
  body('role').isIn(['student', 'faculty', 'admin']).withMessage('Invalid role')
];

const loginValidation = [
  body('email').trim().isEmail().isLength({max:255}).withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email').trim().isEmail().isLength({max:255}).withMessage('Valid email is required')
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/\d/).withMessage('Password must contain at least one number')
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
    .matches(/\d/).withMessage('New password must contain at least one number')
];

// Public routes
router.post('/register', authLimiter, registerValidation, authController.register);
router.post('/login', authLimiter, loginValidation, authController.login);
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordValidation, authController.forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidation, authController.resetPassword);

// Protected routes (require authentication)
router.get('/profile', verifyToken, authController.getProfile);
router.get('/verify', verifyToken, (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});
router.put('/profile', verifyToken,
  body('full_name').trim().notEmpty().isLength({ max: 255 }),
  body('email').trim().isEmail(),
  body('department').optional({nullable:true}).isString().isLength({max:100}),
  body('phone').optional({nullable:true}).isString().isLength({max:20}),
  body('registration_id').optional({nullable:true}).isString().trim().isLength({max:80}),
  authController.updateProfile);
router.post('/change-password', verifyToken, changePasswordValidation, authController.changePassword);

// Admin only routes
router.get('/email-status',verifyToken,isAdmin,async(req,res,next)=>{
  try {const {pool}=require('../config/database');const [[counts]]=await pool.query("SELECT SUM(sent_at IS NULL AND expires_at>NOW() AND attempts<8) AS pending,SUM(sent_at IS NULL AND expires_at>NOW() AND attempts>=8) AS failed,SUM(sent_at IS NOT NULL) AS sent FROM email_outbox");res.json({success:true,data:{configured:require('../config/email').isSmtpConfigured,...counts,worker:require('../services/emailService').workerState}});}catch(error){next(error);}
});
router.get('/users', verifyToken, isAdmin, authController.getAllUsers);
router.post('/users', verifyToken, isAdmin, adminUserValidation, authController.createUser);
router.put('/users/:id', verifyToken, isAdmin, adminUserUpdateValidation, authController.updateUser);
router.delete('/users/:id', verifyToken, isAdmin, authController.deleteUser);

module.exports = router;

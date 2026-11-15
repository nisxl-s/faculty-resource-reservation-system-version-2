const rateLimit = require('express-rate-limit');

// Standard error handler for rate limit exceedance
const rateLimitHandler = (message) => (req, res, next, options) => {
  const retryAfter = Math.ceil(options.windowMs / 1000);
  res.status(429).json({
    success: false,
    message: message || 'Too many requests. Please try again later.',
    retryAfter
  });
};

// General rate limiter: applies across all /api routes
// 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('Too many requests from this IP. Please try again in 15 minutes.'),
  skip: (req) => process.env.NODE_ENV === 'test'
});

// Authentication rate limiter: prevents brute force attacks on login/register
// 10 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('Too many authentication attempts. Please wait 15 minutes before trying again.'),
  skip: (req) => process.env.NODE_ENV === 'test'
});

// Forgot password rate limiter: prevents email flooding / enumeration
// 3 requests per 1 hour per IP
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('Too many password reset requests. Please wait 1 hour before requesting another reset link.'),
  skip: (req) => process.env.NODE_ENV === 'test'
});

// Sensitive write operations: prevents flooding resource creation/updates or reservation spam
// 30 write operations per 15 minutes per IP
const sensitiveWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('Too many modification requests. Please wait a few moments before trying again.'),
  skip: (req) => process.env.NODE_ENV === 'test'
});

module.exports = {
  generalLimiter,
  authLimiter,
  forgotPasswordLimiter,
  sensitiveWriteLimiter
};

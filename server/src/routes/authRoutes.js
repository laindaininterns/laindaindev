const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

// Rate limiter for authentication routes: max 100 requests in development, 20 in production
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (ADMIN, BUYER, SELLER) and generate profile
 * @access  Public
 */
router.post('/register', authLimiter, authController.register);

/**
 * @route   POST /api/auth/verify-email (or /api/auth/verify-otp)
 * @desc    Verify 6-digit numeric OTP and set is_email_verified to true
 * @access  Public
 */
router.post('/verify-email', authLimiter, authController.verifyEmail);
router.post('/verify-otp', authLimiter, authController.verifyEmail);

/**
 * @route   POST /api/auth/resend-otp (or /api/auth/resend-verification)
 * @desc    Resend a fresh 6-digit OTP code to email
 * @access  Public
 */
router.post('/resend-otp', authLimiter, authController.resendOtp);
router.post('/resend-verification', authLimiter, authController.resendOtp);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and issue JWT token
 * @access  Public
 */
router.post('/login', authLimiter, authController.login);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Generate password reset token and send email via Resend
 * @access  Public
 */
router.post('/forgot-password', authLimiter, authController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Verify reset token and update password with bcrypt
 * @access  Public
 */
router.post('/reset-password', authLimiter, authController.resetPassword);

/**
 * @route   POST /api/auth/seller/submit_application
 * @desc    Submit seller application (Storyboard Flow 4)
 * @access  Public / Authenticated
 */
router.post('/seller/submit_application', authController.submitSellerApplication);

module.exports = router;

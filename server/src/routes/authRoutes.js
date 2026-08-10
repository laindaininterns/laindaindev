const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiter for authentication routes: max 15 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
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
 * @route   POST /api/auth/login
 * @desc    Login user and issue JWT token
 * @access  Public
 */
router.post('/login', authLimiter, authController.login);

/**
 * @route   POST /api/auth/seller/submit_application
 * @desc    Submit seller application (Storyboard Flow 4)
 * @access  Public / Authenticated
 */
router.post('/seller/submit_application', authController.submitSellerApplication);

/**
 * @route   GET /api/auth/profile
 * @desc    Get authenticated user profile details
 * @access  Private
 */
router.get('/profile', verifyToken, authController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update authenticated user profile details
 * @access  Private
 */
router.put('/profile', verifyToken, authController.updateProfile);

module.exports = router;

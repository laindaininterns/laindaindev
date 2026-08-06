const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (ADMIN, BUYER, SELLER) and generate profile
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and issue JWT token
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/auth/seller/submit_application
 * @desc    Submit seller application (Storyboard Flow 4)
 * @access  Public / Authenticated
 */
router.post('/seller/submit_application', authController.submitSellerApplication);

module.exports = router;

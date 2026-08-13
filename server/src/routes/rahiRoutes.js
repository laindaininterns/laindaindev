const express = require('express');
const router = express.Router();
const rahiLimiter = require('../middleware/rahiRateLimit');
const { handleRahiMessage } = require('../controllers/rahiController');

/**
 * POST /api/rahi/message
 * Dedicated endpoint for Rahi 3D voice assistant interaction
 */
router.post('/message', rahiLimiter, handleRahiMessage);

module.exports = router;

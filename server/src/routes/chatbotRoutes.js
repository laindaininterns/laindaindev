const express = require('express');
const router = express.Router();
const { sendMessage } = require('../controllers/chatbotController');
const chatbotLimiter = require('../middleware/chatbotRateLimit');

/**
 * POST /api/chatbot/message
 * Sends a message turn to Laila AI Assistant
 */
router.post('/message', chatbotLimiter, sendMessage);

module.exports = router;

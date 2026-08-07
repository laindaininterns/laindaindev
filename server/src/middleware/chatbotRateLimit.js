const rateLimit = require('express-rate-limit');

const limitPerMin = parseInt(process.env.CHATBOT_RATE_LIMIT_PER_MIN || '20', 10);

/**
 * Dedicated rate limiter for the Chatbot API route to protect Groq quota and prevent abuse
 */
const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: limitPerMin, // Limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests to Laila AI Assistant. Please wait a minute before sending more messages.',
    data: {
      reply: 'You are sending messages too quickly! Please wait a minute before asking Laila another question.',
      language: 'en',
      suggested_actions: [],
      quick_replies: [],
    },
  },
});

module.exports = chatbotLimiter;

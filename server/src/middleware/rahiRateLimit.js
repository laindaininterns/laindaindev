const rateLimit = require('express-rate-limit');

const rahiLimitPerMin = parseInt(process.env.RAHI_RATE_LIMIT_PER_MIN || '30', 10);

/**
 * Dedicated rate limiter for Rahi voice assistant endpoints (/api/rahi/*).
 * Fully independent of Laila's chatbotLimiter and voiceLimiter.
 */
const rahiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: rahiLimitPerMin,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests to Rahi voice assistant. Please wait a minute before trying again.',
  },
});

module.exports = rahiLimiter;

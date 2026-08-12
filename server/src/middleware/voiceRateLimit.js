const rateLimit = require('express-rate-limit');

const sttLimitPerMin = parseInt(process.env.STT_RATE_LIMIT_PER_MIN || '20', 10);

/**
 * Dedicated rate limiter for Voice API routes (/api/voice/*)
 */
const voiceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: sttLimitPerMin,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many voice requests. Please wait a minute before trying again.',
  },
});

module.exports = voiceLimiter;

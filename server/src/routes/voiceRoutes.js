const express = require('express');
const router = express.Router();
const multer = require('multer');
const { transcribeAudio, speakText } = require('../controllers/voiceController');
const voiceLimiter = require('../middleware/voiceRateLimit');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max upload buffer
});

/**
 * POST /api/voice/transcribe
 * Transcribe uploaded audio using Groq Whisper STT
 */
router.post('/transcribe', voiceLimiter, upload.single('audio'), transcribeAudio);

/**
 * POST /api/voice/speak
 * Synthesize text into speech audio or return fallback text response
 */
router.post('/speak', voiceLimiter, speakText);

module.exports = router;

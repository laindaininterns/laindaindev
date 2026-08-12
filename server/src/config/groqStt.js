const { Groq } = require('groq-sdk');
require('dotenv').config();

const apiKey = process.env.GROQ_API_KEY_STT;

if (!apiKey) {
  console.warn('Warning: GROQ_API_KEY_STT is missing in environment variables. Speech-to-text will fall back gracefully.');
}

const groqStt = new Groq({
  apiKey: apiKey || 'dummy-stt-key-for-initialization',
});

const STT_MODEL = process.env.STT_MODEL || 'whisper-large-v3-turbo';
const STT_MAX_AUDIO_SECONDS = parseInt(process.env.STT_MAX_AUDIO_SECONDS || '20', 10);

module.exports = {
  groqStt,
  STT_MODEL,
  STT_MAX_AUDIO_SECONDS,
  hasSttApiKey: Boolean(apiKey),
};

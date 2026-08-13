const { Groq } = require('groq-sdk');
require('dotenv').config();

const apiKey = process.env.GROQ_API_KEY_RAHI;

if (!apiKey) {
  console.warn('Warning: GROQ_API_KEY_RAHI is missing in environment variables. Rahi voice assistant will return fallback responses.');
}

const groqRahi = new Groq({
  apiKey: apiKey || 'dummy-rahi-key-for-initialization',
});

const RAHI_MODEL = process.env.RAHI_MODEL || 'llama-3.3-70b-versatile';
const RAHI_MAX_TOKENS = parseInt(process.env.RAHI_MAX_TOKENS || '250', 10);

module.exports = {
  groqRahi,
  RAHI_MODEL,
  RAHI_MAX_TOKENS,
  hasRahiApiKey: Boolean(apiKey),
};

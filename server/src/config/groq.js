const { Groq } = require('groq-sdk');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: true });
require('dotenv').config({ override: true });

const apiKey = process.env.GROQ_API_KEY_RAHI || process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_STT;

if (!apiKey) {
  console.warn('Warning: GROQ_API_KEY is missing in environment variables. Chatbot feature will return fallback responses.');
}

const groq = new Groq({
  apiKey: apiKey || 'dummy-key-for-initialization',
});

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const CHATBOT_MAX_TOKENS = parseInt(process.env.CHATBOT_MAX_TOKENS || '400', 10);

module.exports = {
  groq,
  GROQ_MODEL,
  CHATBOT_MAX_TOKENS,
  hasApiKey: Boolean(apiKey),
};

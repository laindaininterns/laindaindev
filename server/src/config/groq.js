const { Groq } = require('groq-sdk');
require('dotenv').config();

const apiKey = process.env.GROQ_API_KEY;

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

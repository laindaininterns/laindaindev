const { getChatResponse } = require('../services/chatbotService');

/**
 * POST /api/chatbot/message
 * Handles user chat input, validates length/history, and proxies request to Groq LLM service
 */
const sendMessage = async (req, res) => {
  try {
    const { message, history = [], locale = 'en' } = req.body;

    // Validate message presence and type
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must be a valid text string.',
      });
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty or whitespace only.',
      });
    }

    // Cap message length at 500 characters
    if (trimmedMessage.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Message exceeds the maximum limit of 500 characters.',
      });
    }

    // Validate and sanitize history (max 6 turns, max 500 chars per turn)
    let sanitizedHistory = [];
    if (Array.isArray(history)) {
      sanitizedHistory = history.slice(-6).map((turn) => ({
        role: turn.role === 'user' ? 'user' : 'assistant',
        content: String(turn.content || '').trim().substring(0, 500),
      }));
    }

    // Call Groq LLM service wrapper
    const chatResult = await getChatResponse({
      message: trimmedMessage,
      history: sanitizedHistory,
      locale: String(locale).toLowerCase(),
    });

    return res.status(200).json({
      success: true,
      data: chatResult,
    });
  } catch (error) {
    console.error('Unhandled error in chatbot controller:', error);

    // Return safe fallback without revealing internal error details (BE-12 compliant)
    return res.status(500).json({
      success: false,
      message: 'Internal server error while processing chat message.',
      data: {
        reply: 'I can only help with LainDain — our categories, products, and how wholesale ordering works. Ask me anything about that!',
        language: 'en',
        suggested_actions: [],
        quick_replies: ['Browse Categories', 'What is MOQ?'],
      },
    });
  }
};

module.exports = {
  sendMessage,
};

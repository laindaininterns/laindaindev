const { getRahiResponse } = require('../services/rahiService');

/**
 * Controller handling Rahi voice assistant message requests (POST /api/rahi/message)
 */
async function handleRahiMessage(req, res) {
  try {
    const { message, history = [], locale = 'en', currentPageContext = '' } = req.body || {};

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body must include a non-empty "message" string field.',
      });
    }

    if (message.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Message length exceeds maximum allowed limit of 500 characters.',
      });
    }

    const responseData = await getRahiResponse({
      message: message.trim(),
      history,
      locale,
      currentPageContext,
    });

    return res.status(200).json({
      success: true,
      ...responseData,
    });
  } catch (error) {
    console.error('Unhandled error in handleRahiMessage controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error processing Rahi request.',
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
}

module.exports = {
  handleRahiMessage,
};

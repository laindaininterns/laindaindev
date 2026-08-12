/**
 * Controller for Voice API endpoints: /api/voice/transcribe & /api/voice/speak
 */

const transcribeAudio = async (req, res) => {
  return res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const speakText = async (req, res) => {
  return res.status(501).json({ success: false, message: 'Not implemented yet' });
};

module.exports = {
  transcribeAudio,
  speakText,
};

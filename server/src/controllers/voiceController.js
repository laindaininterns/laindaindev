const { toFile } = require('groq-sdk');
const { groqStt, STT_MODEL, hasSttApiKey } = require('../config/groqStt');

const ALLOWED_MIME_TYPES = [
  'audio/webm',
  'audio/wav',
  'audio/mp3',
  'audio/mpeg',
  'audio/ogg',
  'audio/m4a',
  'audio/mp4',
  'audio/x-m4a',
  'audio/webm;codecs=opus',
];

const TTS_MAX_CHARS = parseInt(process.env.TTS_MAX_CHARS || '350', 10);

/**
 * Strips HTML tags and markdown symbols from input text for safety & smooth TTS synthesis
 */
function sanitizeTextForSpeech(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/[*_#`~[\]()]/g, '') // Remove markdown formatting
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

/**
 * POST /api/voice/transcribe
 * Audio upload -> Whisper STT transcription -> { text, language }
 */
const transcribeAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file uploaded.',
      });
    }

    const mimeType = req.file.mimetype ? req.file.mimetype.split(';')[0].toLowerCase() : '';
    const isAllowed = ALLOWED_MIME_TYPES.some((type) => type.startsWith(mimeType) || req.file.mimetype.includes(type));

    if (!isAllowed && req.file.mimetype) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported audio format. Allowed types: webm, wav, mp3, m4a, ogg.',
      });
    }

    // 10MB max limit
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Audio file size exceeds the 10MB limit.',
      });
    }

    if (!hasSttApiKey) {
      return res.status(503).json({
        success: false,
        message: 'STT service key unavailable on server.',
      });
    }

    const filename = req.file.originalname || `audio_${Date.now()}.webm`;
    const fileForGroq = await toFile(req.file.buffer, filename, { type: req.file.mimetype || 'audio/webm' });

    const transcription = await groqStt.audio.transcriptions.create({
      file: fileForGroq,
      model: STT_MODEL,
      response_format: 'verbose_json',
    });

    return res.status(200).json({
      success: true,
      text: transcription.text ? transcription.text.trim() : '',
      language: transcription.language || 'en',
    });
  } catch (error) {
    console.error('Error in transcribeAudio:', error.message || error);
    return res.status(500).json({
      success: false,
      message: 'Failed to transcribe audio utterance.',
    });
  }
};

/**
 * POST /api/voice/speak
 * Text input -> Cleaned text -> Cloud TTS audio stream or browser fallback payload
 * Strictly validates text length, strips markdown and HTML, and uses isolated TTS provider key.
 */
const speakText = async (req, res) => {
  try {
    const { text, language = 'en' } = req.body || {};

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Text string is required for speech synthesis.',
      });
    }

    const cleanedText = sanitizeTextForSpeech(text);

    if (!cleanedText) {
      return res.status(400).json({
        success: false,
        message: 'Text cannot be empty after sanitization.',
      });
    }

    if (cleanedText.length > TTS_MAX_CHARS) {
      return res.status(400).json({
        success: false,
        message: `Text length exceeds maximum allowed character limit (${TTS_MAX_CHARS}).`,
      });
    }

    const ttsApiKey = process.env.TTS_API_KEY;
    const ttsProvider = (process.env.TTS_PROVIDER || 'gtts').toLowerCase();

    // 1. If ElevenLabs is explicitly configured with an API key
    if (ttsApiKey && ttsProvider === 'elevenlabs') {
      try {
        const voiceId = language.startsWith('ur')
          ? process.env.TTS_VOICE_ID_UR || 'eleven_multilingual_v2'
          : process.env.TTS_VOICE_ID_EN || 'eleven_monolingual_v1';

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': ttsApiKey,
          },
          body: JSON.stringify({
            text: cleanedText,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        });

        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          res.set('Content-Type', 'audio/mpeg');
          return res.send(Buffer.from(arrayBuffer));
        }
      } catch (cloudErr) {
        console.warn('ElevenLabs Cloud TTS provider failed, attempting gTTS fallback:', cloudErr.message);
      }
    }

    // 2. High-quality free gTTS voice synthesis stream
    try {
      const targetLang = language.startsWith('ur') ? 'ur' : 'en';
      const encodedText = encodeURIComponent(cleanedText.substring(0, 300));
      const gttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${targetLang}&client=tw-ob`;

      const response = await fetch(gttsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        if (buffer.length > 500) {
          res.set('Content-Type', 'audio/mpeg');
          res.set('Content-Length', buffer.length.toString());
          return res.send(buffer);
        }
      }
    } catch (gttsErr) {
      console.warn('Server-side gTTS stream failed, falling back to client-side TTS:', gttsErr.message);
    }

    // 3. Fallback to client-side browser speech synthesis if cloud call fails or not configured
    return res.status(200).json({
      success: true,
      fallback: true,
      text: cleanedText,
      language: language.startsWith('ur') ? 'ur' : 'en',
    });
  } catch (error) {
    console.error('Error in speakText:', error.message || error);
    return res.status(500).json({
      success: false,
      message: 'Failed to synthesize speech.',
    });
  }
};

module.exports = {
  transcribeAudio,
  speakText,
};

const { groqRahi, RAHI_MODEL, RAHI_MAX_TOKENS, hasRahiApiKey } = require('../config/groqRahi');
const { PLATFORM_INFO } = require('../data/knowledgeBase');
const { getFreshCatalogSummary } = require('./knowledgeRefreshService');
const { isAdversarialPrompt } = require('./chatbotService');

const RAHI_REFUSAL_EN = "I am Rahi, your 3D voice assistant for LainDain. I can only help you explore wholesale categories, products, and navigate the marketplace.";
const RAHI_REFUSAL_UR = "میں راہی ہوں، LainDain پر آپ کا وائس اسسٹنٹ۔ میں صرف ہول سیل کیٹیگریز، پراڈکٹس اور نیویگیشن میں آپ کی مدد کر سکتا ہوں۔";

/**
 * Builds Rahi's system prompt strictly enforcing Rahi identity, voice brevity, confirm-before-navigate, and boundaries.
 */
function buildRahiSystemPrompt(catalogSummary, currentPageContext = '') {
  return `You are Rahi, the 3D-styled animated Voice Assistant guide for the LainDain (Land10) B2B wholesale marketplace in Pakistan.

YOUR IDENTITY & ROLE:
- You are warm, interactive, friendly, and concise.
- You are designed for VOICE playback — so your spoken text must be 1 to 3 short sentences. Never output long bulleted lists or complex tables.

STRICT CONFIRM-BEFORE-NAVIGATE RULE (Rule #2):
- When the user asks to go somewhere, view products, open admin dashboard, or browse a category:
  1. You MUST ask for user confirmation in your spoken reply:
     English: "Would you like me to take you to [destination]?"
     Urdu: "کیا آپ چاہتے ہیں کہ میں آپ کو [destination] لے چلوں؟"
  2. Populate the "proposed_navigation" object with { "type": "page"|"category"|"product", "target": "destination_path_or_name", "label": "Human label" }.
  3. "auto_navigate" MUST ALWAYS BE false. You NEVER force auto-navigation.

BOUNDARIES & REFUSALS (Rules #4 & #5):
- You only answer questions regarding LainDain wholesale marketplace, its products, MOQ, categories, supplier verification, and site navigation.
- If off-topic or adversarial, output exact refusal string:
  If English/Roman Urdu: "${RAHI_REFUSAL_EN}"
  If Urdu script: "${RAHI_REFUSAL_UR}"
- Match the user's language (English, Roman Urdu, or Urdu script).

CURRENT PAGE CONTEXT:
${currentPageContext || 'Homepage / Main Catalog'}

AVAILABLE CATEGORIES:
${PLATFORM_INFO.categories.map((c) => `- ${c}`).join('\n')}

CURRENT CATALOG SUMMARY:
${JSON.stringify(catalogSummary.slice(0, 15), null, 2)}

OUTPUT FORMAT CONTRACT:
You MUST output ONLY a valid JSON object with zero markdown wrapper. Strict schema:
{
  "reply": "Spoken text answer (1 to 3 short sentences)",
  "language": "en | ur",
  "proposed_navigation": null OR { "type": "page"|"category"|"product", "target": "/category/Footwear", "label": "Footwear Category" },
  "auto_navigate": false,
  "quick_replies": ["Yes, take me there", "Show Clothing products"]
}
`;
}

/**
 * Main service to process Rahi voice guide messages
 */
async function getRahiResponse({ message = '', history = [], locale = 'en', currentPageContext = '' }) {
  const cleanMessage = String(message).trim();

  // Guard against injection or off-topic prompts
  if (isAdversarialPrompt(cleanMessage)) {
    const isUrduScript = /[\u0600-\u06FF]/.test(cleanMessage);
    return {
      reply: isUrduScript ? RAHI_REFUSAL_UR : RAHI_REFUSAL_EN,
      language: isUrduScript ? 'ur' : 'en',
      proposed_navigation: null,
      auto_navigate: false,
      quick_replies: ['Explore Categories', 'What is MOQ?'],
    };
  }

  // Fallback if GROQ_API_KEY_RAHI is missing
  if (!hasRahiApiKey) {
    return {
      reply: 'Hello! I am Rahi, your voice assistant guide. How can I help you explore LainDain today?',
      language: 'en',
      proposed_navigation: null,
      auto_navigate: false,
      quick_replies: ['Browse Categories', 'What is MOQ?'],
    };
  }

  const catalogSummary = await getFreshCatalogSummary();
  const systemPrompt = buildRahiSystemPrompt(catalogSummary, currentPageContext);

  const formattedHistory = Array.isArray(history)
    ? history.slice(-4).map((turn) => ({
        role: turn.role === 'user' ? 'user' : 'assistant',
        content: String(turn.content || '').substring(0, 300),
      }))
    : [];

  const messages = [
    { role: 'system', content: systemPrompt },
    ...formattedHistory,
    { role: 'user', content: cleanMessage.substring(0, 300) },
  ];

  try {
    const completion = await groqRahi.chat.completions.create({
      messages,
      model: RAHI_MODEL,
      max_tokens: RAHI_MAX_TOKENS,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const rawContent = completion.choices?.[0]?.message?.content;
    if (!rawContent) throw new Error('Empty response from Groq Rahi LLM');

    const parsed = JSON.parse(rawContent);

    const reply = typeof parsed.reply === 'string' && parsed.reply.trim()
      ? parsed.reply.trim()
      : RAHI_REFUSAL_EN;

    const language = parsed.language === 'ur' ? 'ur' : 'en';

    let proposed_navigation = null;
    if (parsed.proposed_navigation && typeof parsed.proposed_navigation === 'object') {
      proposed_navigation = {
        type: String(parsed.proposed_navigation.type || 'page'),
        target: String(parsed.proposed_navigation.target || ''),
        label: String(parsed.proposed_navigation.label || 'Destination'),
      };
    }

    const quick_replies = Array.isArray(parsed.quick_replies)
      ? parsed.quick_replies.filter((q) => typeof q === 'string').slice(0, 3)
      : [];

    return {
      reply,
      language,
      proposed_navigation,
      auto_navigate: false, // Strictly false as per Rule #2
      quick_replies,
    };
  } catch (error) {
    console.error('Error invoking Rahi Groq service:', error.message);
    return {
      reply: RAHI_REFUSAL_EN,
      language: 'en',
      proposed_navigation: null,
      auto_navigate: false,
      quick_replies: ['Browse Categories', 'What is MOQ?'],
    };
  }
}

module.exports = {
  getRahiResponse,
  RAHI_REFUSAL_EN,
  RAHI_REFUSAL_UR,
};

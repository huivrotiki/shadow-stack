// server/lib/router-engine.cjs — Shadow Stack Router Engine
// Takes a query, returns { provider, model, confidence, reason }

const config = require('./config.cjs');
const { getProfile, getModelForSpeed } = require('./speed-profiles.cjs');

const KEYWORDS = {
   code: ['code', 'function', 'class', 'debug', 'fix', 'error', 'bug', 'implement', 'refactor', 'test', 'script', 'program'],
   browser: ['url', 'http', 'browse', 'scrape', 'extract', 'website', 'page', 'fetch page', 'screenshot'],
   summarize: ['summarize', 'summary', 'tldr', 'brief', 'recap', 'shorten'],
   translate: ['translate', 'translation', 'english', 'spanish', 'french', 'german'],
   creative: ['write', 'story', 'poem', 'creative', 'imagine', 'generate idea', 'brainstorm'],
 };

let currentSpeed = config.MODEL_SPEED;
let currentProfile = getProfile(currentSpeed);

function detectIntent(text) {
  const lower = text.toLowerCase();

  for (const [intent, words] of Object.entries(KEYWORDS)) {
    for (const w of words) {
      if (lower.includes(w)) return intent;
    }
  }

   if (text.length < 50 && !text.includes(' ')) return 'short';
   if (text.length > 2000) return 'creative'; // Long prompts are usually creative/analysis
   return 'default';
}

function getSpeed() {
  return {
    current: currentSpeed,
    profile: currentProfile,
  };
}

function setSpeed(speed) {
  if (!['slow', 'medium', 'fast'].includes(speed)) {
    throw new Error(`Invalid speed: ${speed}. Must be slow|medium|fast`);
  }
  currentSpeed = speed;
  currentProfile = getProfile(speed);
  return { speed: currentSpeed, profile: currentProfile };
}

function smartQuery(text) {
  const intent = detectIntent(text);

  switch (intent) {
    case 'code':
      if (config.GROQ_API_KEY) {
        return {
          provider: 'cloud',
          model: getModelForSpeed(currentSpeed, 'groq'),
          confidence: 0.7,
          reason: `code intent → Groq (${currentSpeed})`,
          ...currentProfile,
        };
      }
      if (config.OPENROUTER_API_KEY) {
        return {
          provider: 'cloud',
          model: getModelForSpeed(currentSpeed, 'openrouter'),
          confidence: 0.6,
          reason: `code intent → OpenRouter (${currentSpeed})`,
          ...currentProfile,
        };
      }
      return {
        provider: 'ollama',
        model: getModelForSpeed(currentSpeed, 'ollama'),
        confidence: 0.5,
        reason: `code intent, no cloud → ollama (${currentSpeed})`,
        ...currentProfile,
      };

    case 'browser':
      return {
        provider: 'browser',
        model: 'chromium',
        confidence: 0.9,
        reason: 'browser intent',
        ...currentProfile,
      };

    case 'short':
      return {
        provider: 'ollama',
        model: getModelForSpeed(currentSpeed, 'ollama'),
        confidence: 0.8,
        reason: `short query → ollama (${currentSpeed})`,
        ...currentProfile,
      };

    default:
      return {
        provider: 'ollama',
        model: getModelForSpeed(currentSpeed, 'ollama'),
        confidence: 0.5,
        reason: `default → ollama (${currentSpeed})`,
        ...currentProfile,
      };
  }
}

module.exports = { smartQuery, detectIntent, getSpeed, setSpeed };

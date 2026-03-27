// server/lib/router-engine.cjs — Shadow Stack Router Engine
// Takes a query, returns { provider, model, confidence, reason }

const config = require('./config.cjs');

const KEYWORDS = {
  code: ['code', 'function', 'class', 'debug', 'fix', 'error', 'bug', 'implement', 'refactor', 'test'],
  browser: ['url', 'http', 'browse', 'scrape', 'extract', 'website', 'page', 'fetch page'],
};

function detectIntent(text) {
  const lower = text.toLowerCase();

  for (const [intent, words] of Object.entries(KEYWORDS)) {
    for (const w of words) {
      if (lower.includes(w)) return intent;
    }
  }

  if (text.length < 50) return 'short';
  return 'default';
}

function smartQuery(text) {
  const intent = detectIntent(text);

  switch (intent) {
    case 'code':
      if (config.GROQ_API_KEY) {
        return { provider: 'cloud', model: config.GROQ_MODEL, confidence: 0.7, reason: 'code intent → Groq' };
      }
      if (config.OPENROUTER_API_KEY) {
        return { provider: 'cloud', model: config.OPENROUTER_MODEL, confidence: 0.6, reason: 'code intent → OpenRouter' };
      }
      return { provider: 'ollama', model: config.OLLAMA_MODEL, confidence: 0.5, reason: 'code intent, no cloud key → ollama' };

    case 'browser':
      return { provider: 'browser', model: 'chromium', confidence: 0.9, reason: 'browser intent' };

    case 'short':
      return { provider: 'ollama', model: config.OLLAMA_MODEL, confidence: 0.8, reason: 'short query → ollama' };

    default:
      return { provider: 'ollama', model: config.OLLAMA_MODEL, confidence: 0.5, reason: 'default → ollama' };
  }
}

module.exports = { smartQuery, detectIntent };

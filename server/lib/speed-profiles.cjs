// server/lib/speed-profiles.cjs — Shadow Stack Speed Profiles
// Defines rate limits, timeouts, and model selection for each speed tier

const SPEED_PROFILES = {
  slow: {
    name: '🦥 Медленно',
    description: 'Высокое качество, максимальная точность',
    rateLimit: 2,           // requests per second
    timeout: 120000,        // 2 min
    maxTokens: 8192,
    temperature: 0.7,
    modelTier: 'precise',   // ollama-7b or cloud-gpt-4
    retries: 3,
  },
  medium: {
    name: '⚖️ Средне',
    description: 'Баланс скорости и качества',
    rateLimit: 5,
    timeout: 60000,         // 1 min
    maxTokens: 4096,
    temperature: 0.5,
    modelTier: 'balanced',  // ollama-3b or cloud-gpt-3.5
    retries: 2,
  },
  fast: {
    name: '⚡ Быстро',
    description: 'Минимальная задержка, быстрые ответы',
    rateLimit: 10,
    timeout: 30000,         // 30 sec
    maxTokens: 2048,
    temperature: 0.3,
    modelTier: 'fast',      // ollama-3b or cloud-gpt-4o-mini
    retries: 1,
  },
};

const MODEL_MAP = {
  precise: {
    ollama: 'qwen2.5:7b',
    cloud: 'openai/gpt-4o',
    groq: 'llama-3.3-70b-versatile',
  },
  balanced: {
    ollama: 'llama3.2:3b',
    cloud: 'openai/gpt-4o-mini',
    groq: 'llama-3.1-8b-instant',
  },
  fast: {
    ollama: 'llama3.2:3b',
    cloud: 'openai/gpt-4o-mini',
    groq: 'llama-3.1-8b-instant',
  },
};

function getProfile(speed) {
  return SPEED_PROFILES[speed] || SPEED_PROFILES.medium;
}

function getModelForSpeed(speed, provider) {
  const profile = getProfile(speed);
  return MODEL_MAP[profile.modelTier]?.[provider] || 'llama3.2:3b';
}

module.exports = { SPEED_PROFILES, MODEL_MAP, getProfile, getModelForSpeed };

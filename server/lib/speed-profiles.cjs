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
    aiml: 'aiml-claude-sonnet',
    copilot: 'copilot-sonnet-4.6',
    omniroute: 'kr/claude-sonnet-4.5',
    openrouter: 'or-qwen3.6',
  },
  balanced: {
    ollama: 'llama3.2:3b',
    cloud: 'openai/gpt-4o-mini',
    groq: 'llama-3.1-8b-instant',
    aiml: 'aiml-claude-sonnet',
    copilot: 'copilot-haiku-4.5',
    omniroute: 'kr/claude-sonnet-4.5',
    openrouter: 'or-qwen3.6',
  },
  fast: {
    ollama: 'llama3.2:3b',
    cloud: 'openai/gpt-4o-mini',
    groq: 'llama-3.1-8b-instant',
    aiml: 'aiml-claude-sonnet',
    copilot: 'copilot-haiku-4.5',
    omniroute: 'kr/claude-haiku-4.5',
    openrouter: 'or-qwen3.6',
  },
};

const SPEED_RATE_LIMITS = {
  slow: {
    requestsPerMinute: 10,
    requestsPerHour: 100,
    burstLimit: 3,
  },
  medium: {
    requestsPerMinute: 30,
    requestsPerHour: 500,
    burstLimit: 5,
  },
  fast: {
    requestsPerMinute: 60,
    requestsPerHour: 2000,
    burstLimit: 10,
  },
};

const FREE_CLAUDE_LIMITS = {
  'kr/claude-sonnet-4.5': { rpm: 15, rph: 200, burst: 2 },
  'kr/claude-haiku-4.5': { rpm: 30, rph: 500, burst: 5 },
};

const FREE_MODEL_LIMITS = {
  'qwen/qwen3.6-plus:free': { rpm: 60, rph: 1000, burst: 10 },
  'or-qwen3.6': { rpm: 60, rph: 1000, burst: 10 },
};

function getProfile(speed) {
  return SPEED_PROFILES[speed] || SPEED_PROFILES.medium;
}

function getModelForSpeed(speed, provider) {
  const profile = getProfile(speed);
  return MODEL_MAP[profile.modelTier]?.[provider] || 'llama3.2:3b';
}

function getRateLimits(speed) {
  return SPEED_RATE_LIMITS[speed] || SPEED_RATE_LIMITS.medium;
}

function getClaudeLimits(model) {
  return FREE_CLAUDE_LIMITS[model] || { rpm: 30, rph: 500, burst: 3 };
}

function getModelForIntent(intent, speed) {
  const profile = getProfile(speed);
  const tier = profile.modelTier;
  
  if (tier === 'fast' && (intent === 'short' || intent === 'fast')) {
    return { provider: 'omniroute', model: 'kr/claude-haiku-4.5' };
  }
  if (tier === 'balanced' || tier === 'precise') {
    return { provider: 'omniroute', model: 'kr/claude-sonnet-4.5' };
  }
  return { provider: 'ollama', model: 'llama3.2:3b' };
}

module.exports = { 
  SPEED_PROFILES, 
  MODEL_MAP, 
  SPEED_RATE_LIMITS,
  FREE_CLAUDE_LIMITS,
  getProfile, 
  getModelForSpeed,
  getRateLimits,
  getClaudeLimits,
  getModelForIntent
};

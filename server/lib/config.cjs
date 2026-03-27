// server/lib/config.cjs — Shadow Stack Config Loader
// Loads .env manually (no dotenv dependency) and exports typed config object

const fs = require('fs');
const path = require('path');

const ENV_PATH = path.resolve(__dirname, '../../.env');

function loadEnv(envPath) {
  const env = {};
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      env[key] = val;
    }
  } catch (e) {
    // .env not found — use process.env only
  }
  return env;
}

const fileEnv = loadEnv(ENV_PATH);

function get(key, fallback) {
  return process.env[key] || fileEnv[key] || fallback;
}

const config = {
  // Server
  PORT: parseInt(get('PORT', '3000'), 10),
  LOG_LEVEL: get('LOG_LEVEL', 'info'),

  // Ollama
  OLLAMA_URL: get('OLLAMA_URL', 'http://localhost:11434'),
  OLLAMA_MODEL: get('OLLAMA_MODEL', 'llama3.2'),

  // Cloud providers
  GROQ_API_KEY: get('GROQ_API_KEY', ''),
  GROQ_MODEL: get('GROQ_MODEL', 'llama-3.1-8b-instant'),
  OPENROUTER_API_KEY: get('OPENROUTER_API_KEY', ''),
  OPENROUTER_MODEL: get('OPENROUTER_MODEL', 'openai/gpt-4o-mini'),
  OPENAI_API_KEY: get('OPENAI_API_KEY', ''),
  GEMINI_API_KEY: get('GEMINI_API_KEY', ''),
  ANTHROPIC_API_KEY: get('ANTHROPIC_API_KEY', ''),

  // Telegram
  TELEGRAM_BOT_TOKEN: get('TELEGRAM_BOT_TOKEN', ''),
  TELEGRAM_CHAT_ID: get('TELEGRAM_CHAT_ID', ''),
  TELEGRAM_GROUP_ID: get('TELEGRAM_GROUP_ID', ''),

  // Supabase
  SUPABASE_URL: get('SUPABASE_URL', ''),
  SUPABASE_ANON_KEY: get('SUPABASE_ANON_KEY', ''),

  // Rate limiting
  RATE_LIMIT_RPS: parseInt(get('RATE_LIMIT_RPS', '10'), 10),

  // RAM guard
  RAM_THRESHOLD_MB: parseInt(get('RAM_THRESHOLD_MB', '512'), 10),

  // GitHub
  GITHUB_TOKEN: get('GITHUB_TOKEN', ''),
  GITHUB_REPO_OWNER: get('GITHUB_REPO_OWNER', ''),
  GITHUB_REPO_NAME: get('GITHUB_REPO_NAME', ''),
};

module.exports = config;

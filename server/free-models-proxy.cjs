// server/free-models-proxy.cjs — Free Models Proxy + Cascade
// Объединяет все бесплатные API в один endpoint с fallback
// Port: 20129
//
// FIX 2026-04-05: OmniRoute :20128 is DOWN (better-sqlite3/M1).
// kiro/* models removed — they routed through OmniRoute.
// Primary tier is now OpenRouter FREE + Zen (opencode.ai).

const express = require('express');
const app = express();
const PORT = 20129;

app.use(express.json());

// API ключи из .env (через process.env)
const GROQ_KEY = process.env.GROQ_API_KEY || '';
const MISTRAL_KEY = process.env.MISTRAL_API_KEY || '';
const ZEN_KEY = process.env.ZEN_API_KEY || '';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
const COPILOT_KEY = process.env.GITHUB_TOKEN || '';

// Маппинг моделей с приоритетами и fallback
// FIX 2026-04-05: qwen3.6-plus-preview:free REMOVED (expired Apr 3). Use qwen3.6-plus:free.
// UPDATE 2026-04-05c: Added Gemini, DeepSeek, HuggingFace, Copilot providers
// UPDATE 2026-04-05d: Flat model IDs (no slashes) for opencode.json compatibility
const MODEL_MAP = {
  // 🥇 Tier 1: OpenRouter FREE models
  'or-qwen3.6': { provider: 'openrouter', model: 'qwen/qwen3.6-plus:free', key: OPENROUTER_KEY, url: 'https://openrouter.ai/api/v1/chat/completions', priority: 1 },
  'or-nemotron': { provider: 'openrouter', model: 'nvidia/nemotron-nano-12b:free', key: OPENROUTER_KEY, url: 'https://openrouter.ai/api/v1/chat/completions', priority: 1 },
  'or-trinity': { provider: 'openrouter', model: 'arcee-ai/trinity-large:free', key: OPENROUTER_KEY, url: 'https://openrouter.ai/api/v1/chat/completions', priority: 1 },
  'or-minimax': { provider: 'openrouter', model: 'minimax/minimax-m2.5:free', key: OPENROUTER_KEY, url: 'https://openrouter.ai/api/v1/chat/completions', priority: 1 },
  'or-step-flash': { provider: 'openrouter', model: 'stepfun/step-3.5-flash:free', key: OPENROUTER_KEY, url: 'https://openrouter.ai/api/v1/chat/completions', priority: 1 },
  
  // 🥈 Tier 2: OpenCode Zen (opencode.ai free models)
  'zen-qwen3.6': { provider: 'zen', model: 'qwen3.6-plus-free', key: ZEN_KEY, url: 'https://opencode.ai/zen/v1/chat/completions', priority: 2 },
  'zen-nemotron': { provider: 'zen', model: 'nemotron-3-super-free', key: ZEN_KEY, url: 'https://opencode.ai/zen/v1/chat/completions', priority: 2 },
  'zen-big-pickle': { provider: 'zen', model: 'big-pickle', key: ZEN_KEY, url: 'https://opencode.ai/zen/v1/chat/completions', priority: 2 },
  'zen-mimo-pro': { provider: 'zen', model: 'mimo-v2-pro-free', key: ZEN_KEY, url: 'https://opencode.ai/zen/v1/chat/completions', priority: 2 },
  'zen-mimo-omni': { provider: 'zen', model: 'mimo-v2-omni-free', key: ZEN_KEY, url: 'https://opencode.ai/zen/v1/chat/completions', priority: 2 },
  
  // 🥉 Tier 3: Groq (ultra fast, 30 RPM — needs API key)
  'groq-llama-70b': { provider: 'groq', model: 'llama-3.3-70b-versatile', key: GROQ_KEY, url: 'https://api.groq.com/openai/v1/chat/completions', priority: 3 },
  
  // Tier 4: Gemini (Google — needs API key)
  'gemini-flash': { provider: 'gemini', model: 'gemini-2.0-flash', key: process.env.GEMINI_API_KEY || '', url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', priority: 4 },
  'gemini-flash-lite': { provider: 'gemini', model: 'gemini-2.0-flash-lite', key: process.env.GEMINI_API_KEY || '', url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', priority: 4 },
  'gemini-pro': { provider: 'gemini', model: 'gemini-2.5-pro', key: process.env.GEMINI_API_KEY || '', url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', priority: 4 },
  
  // Tier 5: DeepSeek (via HuggingFace Inference API)
  'hf-deepseek-v3': { provider: 'huggingface', model: 'deepseek-ai/DeepSeek-V3', key: process.env.HUGGINGFACE_API_KEY || '', url: 'https://router.huggingface.co/hf-inference/models/deepseek-ai/DeepSeek-V3/v1/chat/completions', priority: 5 },
  'hf-deepseek-r1': { provider: 'huggingface', model: 'deepseek-ai/DeepSeek-R1', key: process.env.HUGGINGFACE_API_KEY || '', url: 'https://router.huggingface.co/hf-inference/models/deepseek-ai/DeepSeek-R1/v1/chat/completions', priority: 5 },
  
  // Tier 6: GitHub Copilot (needs GitHub token — high quality models)
  'copilot-gpt-5.4': { provider: 'copilot', model: 'gpt-5.4', key: COPILOT_KEY, url: 'https://api.githubcopilot.com/chat/completions', priority: 6 },
  'copilot-gpt-5.4-mini': { provider: 'copilot', model: 'gpt-5.4-mini', key: COPILOT_KEY, url: 'https://api.githubcopilot.com/chat/completions', priority: 6 },
  'copilot-gpt-5.3-codex': { provider: 'copilot', model: 'gpt-5.3-codex', key: COPILOT_KEY, url: 'https://api.githubcopilot.com/chat/completions', priority: 6 },
  'copilot-sonnet-4.6': { provider: 'copilot', model: 'claude-sonnet-4.6', key: COPILOT_KEY, url: 'https://api.githubcopilot.com/chat/completions', priority: 6 },
  'copilot-haiku-4.5': { provider: 'copilot', model: 'claude-haiku-4.5', key: COPILOT_KEY, url: 'https://api.githubcopilot.com/chat/completions', priority: 6 },
  'copilot-opus-4.6': { provider: 'copilot', model: 'claude-opus-4.6', key: COPILOT_KEY, url: 'https://api.githubcopilot.com/chat/completions', priority: 6 },
  'copilot-gemini-2.5-pro': { provider: 'copilot', model: 'gemini-2.5-pro', key: COPILOT_KEY, url: 'https://api.githubcopilot.com/chat/completions', priority: 6 },
  'copilot-grok-code-fast-1': { provider: 'copilot', model: 'grok-code-fast-1', key: COPILOT_KEY, url: 'https://api.githubcopilot.com/chat/completions', priority: 6 },
  
  // Tier 7: Mistral (fast, generous limits — needs API key)
  'mistral-small': { provider: 'mistral', model: 'mistral-small-latest', key: MISTRAL_KEY, url: 'https://api.mistral.ai/v1/chat/completions', priority: 7 },
  
  // Tier 8: Ollama local (все установленные модели)
  'ol-qwen2.5-coder': { provider: 'ollama', model: 'qwen2.5-coder:3b', url: 'http://localhost:11434/v1/chat/completions', priority: 8 },
  'ol-qwen2.5': { provider: 'ollama', model: 'qwen2.5:7b', url: 'http://localhost:11434/v1/chat/completions', priority: 8 },
  'ol-llama3.2': { provider: 'ollama', model: 'llama3.2:3b', url: 'http://localhost:11434/v1/chat/completions', priority: 8 },
  'ol-deepseek-v3.1': { provider: 'ollama', model: 'deepseek-v3.1:671b-cloud', url: 'http://localhost:11434/v1/chat/completions', priority: 8 },
  'ol-qwen3-coder': { provider: 'ollama', model: 'qwen3-coder:480b-cloud', url: 'http://localhost:11434/v1/chat/completions', priority: 8 },
  'ol-gpt-oss': { provider: 'ollama', model: 'gpt-oss:20b-cloud', url: 'http://localhost:11434/v1/chat/completions', priority: 8 },
};

// Cascade fallback цепочка — flat IDs
const CASCADE_CHAIN = [
  'or-qwen3.6',
  'zen-big-pickle',
  'or-nemotron',
  'gemini-flash',
  'copilot-gpt-5.4-mini',
  'or-step-flash',
  'hf-deepseek-v3',
  'copilot-gpt-5.3-codex',
  'groq-llama-70b',
  'ol-qwen2.5-coder',
  'ol-llama3.2',
];

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'free-models-proxy',
    port: PORT,
    models: Object.keys(MODEL_MAP),
    cascade: CASCADE_CHAIN,
  });
});

// Models list
app.get('/v1/models', (req, res) => {
  const models = Object.keys(MODEL_MAP).map(id => ({
    id,
    object: 'model',
    created: Date.now(),
    owned_by: 'free-models-proxy',
  }));
  res.json({ object: 'list', data: models });
});

// Chat completions с cascade fallback
app.post('/v1/chat/completions', async (req, res) => {
  const { model, messages, stream = false } = req.body;
  
  // Если model = "auto" — используем cascade chain
  if (model === 'auto') {
    return handleCascade(req, res, messages, stream);
  }
  
  if (!model || !MODEL_MAP[model]) {
    return res.status(400).json({ error: `Model ${model} not found. Available: ${Object.keys(MODEL_MAP).join(', ')}` });
  }
  
  const config = MODEL_MAP[model];
  
  try {
    const fetch = (await import('node-fetch')).default;
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (config.key) {
      headers['Authorization'] = `Bearer ${config.key}`;
    } else if (config.provider === 'ollama') {
      headers['Authorization'] = 'Bearer ollama';
    }
    
    const response = await fetch(config.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages,
        stream,
        max_tokens: 4096,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error, x_provider: config.provider, x_model: config.model });
    }
    
    const data = await response.json();
    data.x_provider = config.provider;
    data.x_model = config.model;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message, x_provider: config.provider });
  }
});

// Cascade fallback handler
async function handleCascade(req, res, messages, stream) {
  const fetch = (await import('node-fetch')).default;
  
  for (const modelId of CASCADE_CHAIN) {
    const config = MODEL_MAP[modelId];
    if (!config) continue;
    
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (config.key) headers['Authorization'] = `Bearer ${config.key}`;
      
      const response = await fetch(config.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model: config.model, messages, stream, max_tokens: 4096 }),
        signal: AbortSignal.timeout(10000),
      });
      
      if (response.ok) {
        const data = await response.json();
        data.x_provider = config.provider;
        data.x_model = config.model;
        data.x_fallback_chain = true;
        return res.json(data);
      }
      
      console.log(`[cascade] ${modelId} failed (${response.status}), trying next...`);
    } catch (err) {
      console.log(`[cascade] ${modelId} error: ${err.message}, trying next...`);
    }
  }
  
  res.status(503).json({ error: 'All providers in cascade chain failed' });
}

app.listen(PORT, () => {
  console.log(`[free-models-proxy] Running on http://localhost:${PORT}`);
  console.log(`[free-models-proxy] Available models: ${Object.keys(MODEL_MAP).length}`);
  console.log(`[free-models-proxy] Cascade chain: ${CASCADE_CHAIN.join(' -> ')}`);
});

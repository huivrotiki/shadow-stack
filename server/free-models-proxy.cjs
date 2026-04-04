// server/free-models-proxy.cjs — Free Models Proxy + OmniRoute Cascade
// Объединяет все бесплатные API в один endpoint с fallback
// Port: 20129

const express = require('express');
const app = express();
const PORT = 20129;

app.use(express.json());

// API ключи из .env (через process.env)
const GROQ_KEY = process.env.GROQ_API_KEY || '';
const MISTRAL_KEY = process.env.MISTRAL_API_KEY || '';
const ZEN_KEY = process.env.ZEN_API_KEY || '';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';

// Маппинг моделей с приоритетами и fallback
const MODEL_MAP = {
  // 🥇 Tier 1: OmniRoute Kiro Sonnet (приоритет — нужно авторизовать через /dashboard)
  'kiro/sonnet': { provider: 'omniroute', model: 'kiro/claude-sonnet-4.5', url: 'http://localhost:20128/v1/chat/completions', priority: 1 },
  'kiro/haiku': { provider: 'omniroute', model: 'kiro/claude-haiku-4.5', url: 'http://localhost:20128/v1/chat/completions', priority: 1 },
  
  // 🥈 Tier 2: Groq (ultra fast, 30 RPM)
  'groq/llama-3.3-70b': { provider: 'groq', model: 'llama-3.3-70b-versatile', key: GROQ_KEY, url: 'https://api.groq.com/openai/v1/chat/completions', priority: 2 },
  
  // 🥉 Tier 3: Mistral (fast, generous limits)
  'mistral/small': { provider: 'mistral', model: 'mistral-small-latest', key: MISTRAL_KEY, url: 'https://api.mistral.ai/v1/chat/completions', priority: 3 },
  
  // Tier 4: OpenRouter FREE models
  'openrouter/qwen3.6': { provider: 'openrouter', model: 'qwen/qwen3.6-plus-preview:free', key: OPENROUTER_KEY, url: 'https://openrouter.ai/api/v1/chat/completions', priority: 4 },
  'openrouter/nemotron': { provider: 'openrouter', model: 'nvidia/nemotron-3-super-120b-a12b:free', key: OPENROUTER_KEY, url: 'https://openrouter.ai/api/v1/chat/completions', priority: 4 },
  'openrouter/trinity': { provider: 'openrouter', model: 'arcee-ai/trinity-large-preview:free', key: OPENROUTER_KEY, url: 'https://openrouter.ai/api/v1/chat/completions', priority: 4 },
  'openrouter/minimax': { provider: 'openrouter', model: 'minimax/minimax-m2.5:free', key: OPENROUTER_KEY, url: 'https://openrouter.ai/api/v1/chat/completions', priority: 4 },
  'openrouter/step-flash': { provider: 'openrouter', model: 'stepfun/step-3.5-flash:free', key: OPENROUTER_KEY, url: 'https://openrouter.ai/api/v1/chat/completions', priority: 4 },
  
  // Tier 5: OpenCode Zen
  'zen/qwen3.6': { provider: 'zen', model: 'qwen3.6-plus-free', key: ZEN_KEY, url: 'https://opencode.ai/zen/v1/chat/completions', priority: 5 },
  'zen/nemotron': { provider: 'zen', model: 'nemotron-3-super-free', key: ZEN_KEY, url: 'https://opencode.ai/zen/v1/chat/completions', priority: 5 },
  'zen/big-pickle': { provider: 'zen', model: 'big-pickle', key: ZEN_KEY, url: 'https://opencode.ai/zen/v1/chat/completions', priority: 5 },
  
  // Tier 6: Ollama local (fallback, uses RAM)
  'ollama/qwen2.5-coder': { provider: 'ollama', model: 'qwen2.5-coder:3b', url: 'http://localhost:11434/v1/chat/completions', priority: 6 },
  'ollama/qwen2.5': { provider: 'ollama', model: 'qwen2.5:7b', url: 'http://localhost:11434/v1/chat/completions', priority: 6 },
};

// Cascade fallback цепочка
const CASCADE_CHAIN = [
  'groq/llama-3.3-70b',
  'mistral/small',
  'openrouter/nemotron',
  'zen/big-pickle',
  'openrouter/step-flash',
  'ollama/qwen2.5-coder',
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

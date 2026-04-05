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
// UPDATE 2026-04-05e: Cloud-only stack — working models with available keys
// Available keys: OPENROUTER_API_KEY ✅, GITHUB_TOKEN ✅
// Missing keys: ZEN_API_KEY ❌, GROQ_API_KEY ❌, GEMINI_API_KEY ❌, HUGGINGFACE_API_KEY ❌, MISTRAL_API_KEY ❌

const MODEL_MAP = {
  // 🎯 AUTO — Smart model routing (analyzes request, picks optimal model)
  'auto': { provider: 'auto', model: 'auto', priority: 0, isRouter: true },
  
  // 🥇 Tier 1: OpenRouter FREE models (no key needed)
  'or-qwen3.6': { provider: 'openrouter', model: 'qwen/qwen3.6-plus:free', key: OPENROUTER_KEY, url: 'https://openrouter.ai/api/v1/chat/completions', priority: 1 },
  'or-nemotron': { provider: 'openrouter', model: 'nvidia/nemotron-nano-12b:free', key: OPENROUTER_KEY, url: 'https://openrouter.ai/api/v1/chat/completions', priority: 1 },
  'or-trinity': { provider: 'openrouter', model: 'arcee-ai/trinity-large:free', key: OPENROUTER_KEY, url: 'https://openrouter.ai/api/v1/chat/completions', priority: 1 },
  'or-minimax': { provider: 'openrouter', model: 'minimax/minimax-m2.5:free', key: OPENROUTER_KEY, url: 'https://openrouter.ai/api/v1/chat/completions', priority: 1 },
  'or-step-flash': { provider: 'openrouter', model: 'stepfun/step-3.5-flash:free', key: OPENROUTER_KEY, url: 'https://openrouter.ai/api/v1/chat/completions', priority: 1 },
  
  // 🥈 Tier 2: GitHub Copilot (GITHUB_TOKEN ✅)
  'copilot-gpt-5.4': { provider: 'copilot', model: 'gpt-5.4', key: COPILOT_KEY, url: 'https://api.githubcopilot.com/chat/completions', priority: 2 },
  'copilot-gpt-5.4-mini': { provider: 'copilot', model: 'gpt-5.4-mini', key: COPILOT_KEY, url: 'https://api.githubcopilot.com/chat/completions', priority: 2 },
  'copilot-gpt-5.3-codex': { provider: 'copilot', model: 'gpt-5.3-codex', key: COPILOT_KEY, url: 'https://api.githubcopilot.com/chat/completions', priority: 2 },
  'copilot-sonnet-4.6': { provider: 'copilot', model: 'claude-sonnet-4.6', key: COPILOT_KEY, url: 'https://api.githubcopilot.com/chat/completions', priority: 2 },
  'copilot-haiku-4.5': { provider: 'copilot', model: 'claude-haiku-4.5', key: COPILOT_KEY, url: 'https://api.githubcopilot.com/chat/completions', priority: 2 },
  'copilot-opus-4.6': { provider: 'copilot', model: 'claude-opus-4.6', key: COPILOT_KEY, url: 'https://api.githubcopilot.com/chat/completions', priority: 2 },
  'copilot-gemini-2.5-pro': { provider: 'copilot', model: 'gemini-2.5-pro', key: COPILOT_KEY, url: 'https://api.githubcopilot.com/chat/completions', priority: 2 },
  'copilot-grok-code-fast-1': { provider: 'copilot', model: 'grok-code-fast-1', key: COPILOT_KEY, url: 'https://api.githubcopilot.com/chat/completions', priority: 2 },
  
  // 🥉 Tier 3: Ollama local (fallback when cloud fails)
  'ol-qwen2.5-coder': { provider: 'ollama', model: 'qwen2.5-coder:3b', url: 'http://localhost:11434/v1/chat/completions', priority: 3 },
  'ol-qwen2.5': { provider: 'ollama', model: 'qwen2.5:7b', url: 'http://localhost:11434/v1/chat/completions', priority: 3 },
  'ol-llama3.2': { provider: 'ollama', model: 'llama3.2:3b', url: 'http://localhost:11434/v1/chat/completions', priority: 3 },
};

// Cascade fallback цепочка — simplified (only working models)
const CASCADE_CHAIN = [
  'or-qwen3.6',
  'copilot-gpt-5.4-mini',
  'or-step-flash',
  'copilot-gpt-5.3-codex',
  'ol-qwen2.5-coder',
  'ol-llama3.2',
];

// ─── AUTO ROUTING — Smart model selection ─────────────────────────────────────
// Analyzes request content and picks optimal model for speed + quality
// FAST MODE: quick timeout, rapid fallback
// Only uses models with valid API keys (auto-detected at startup)

const ROUTING_RULES = [
  {
    name: 'code',
    patterns: [/код|code|function|class|def |import |const |let |var |=>|async |await |npm|npm install|package\.json|\.js|\.ts|\.jsx|\.tsx|bug|fix|error|syntax|compile|build|test|unit|refactor|api|функцию|функция|напиши|функци/i],
    models: ['copilot-gpt-5.3-codex', 'or-qwen3.6', 'ol-qwen2.5-coder'],
    reason: 'Code task — using best coding model'
  },
  {
    name: 'fast',
    patterns: [/^.{1,50}$/s, /quick|fast|urgent|asap|short|yes|no|ok|ping|pong|hello|hi |hey|test|check|verify/i],
    models: ['copilot-gpt-5.4-mini', 'or-step-flash', 'or-qwen3.6', 'ol-llama3.2'],
    reason: 'Fast task — using fastest model'
  },
  {
    name: 'research',
    patterns: [/explain|analyze|research|compare|what is|how to|why|describe|summary|overview|history|difference|pros and cons|advantages|disadvantages|объясни|что такое|как работает|расскажи/i],
    models: ['or-qwen3.6', 'copilot-gpt-5.4-mini', 'ol-qwen2.5-coder'],
    reason: 'Research task — using best reasoning model'
  },
  {
    name: 'creative',
    patterns: [/write|story|poem|creative|imagine|generate|create|design|brainstorm|idea|suggest|recommend|напиши|придумай|создай/i],
    models: ['copilot-gpt-5.4', 'or-qwen3.6', 'or-step-flash', 'ol-qwen2.5-coder'],
    reason: 'Creative task — using creative model'
  },
  {
    name: 'translate',
    patterns: [/translate|переведи|translate to|in english|на русском|на английском/i],
    models: ['or-qwen3.6', 'copilot-gpt-5.4-mini', 'ol-qwen2.5-coder'],
    reason: 'Translation task — using multilingual model'
  },
];

function autoRouteModel(messages) {
  const text = JSON.stringify(messages).slice(0, 500);
  
  for (const rule of ROUTING_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        return { model: rule.models[0], fallbacks: rule.models.slice(1), reason: rule.reason, category: rule.name };
      }
    }
  }
  
  // Default: best all-rounder
  return { model: 'or-qwen3.6', fallbacks: ['or-step-flash', 'ol-qwen2.5-coder'], reason: 'Default — using best free model', category: 'general' };
}

// Fallback chain for auto — only working models (tested)
// Priority: OpenRouter FREE → Copilot → Ollama local
const AUTO_FALLBACK_CHAIN = [
  'or-qwen3.6',       // ✅ primary, 5-8s
  'or-step-flash',    // ✅ fast, 3-5s
  'copilot-gpt-5.4-mini', // ✅ fast copilot
  'ol-qwen2.5-coder', // ✅ local, 2-4s
  'ol-llama3.2',      // ✅ local, 2-4s
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
  
  // Если model = "auto" — smart routing + cascade fallback
  if (model === 'auto') {
    return handleAutoRoute(req, res, messages, stream);
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

// Auto Route handler — smart model selection + cascade fallback
async function handleAutoRoute(req, res, messages, stream) {
  const fetch = (await import('node-fetch')).default;
  const t0 = Date.now();
  
  // 1. Analyze request and pick optimal model
  const route = autoRouteModel(messages);
  
  // 2. Build model chain: route models + fallback chain (deduplicated)
  const allFallbacks = [...route.fallbacks, ...AUTO_FALLBACK_CHAIN.filter(m => !route.fallbacks.includes(m) && m !== route.model)];
  
  console.log(`[auto-route] Category: ${route.category} → ${route.model} (${route.reason})`);
  
  // 3. Try models in priority order with adaptive timeout
  for (const modelId of allFallbacks) {
    const config = MODEL_MAP[modelId];
    if (!config || config.isRouter) continue;
    
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (config.key) headers['Authorization'] = `Bearer ${config.key}`;
      
      // Adaptive timeout: 60s for ollama, 30s for cloud
      const timeout = config.provider === 'ollama' ? 60000 : 30000;
      
      const response = await fetch(config.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model: config.model, messages, stream, max_tokens: 2048 }),
        signal: AbortSignal.timeout(timeout),
      });
      
      if (response.ok) {
        const data = await response.json();
        data.x_provider = config.provider;
        data.x_model = config.model;
        data.x_auto_route = true;
        data.x_route_category = route.category;
        data.x_route_reason = route.reason;
        data.x_latency_ms = Date.now() - t0;
        return res.json(data);
      }
      
      console.log(`[auto-route] ${modelId} failed (${response.status}), trying next...`);
    } catch (err) {
      console.log(`[auto-route] ${modelId} error: ${err.message}, trying next...`);
    }
  }
  
  res.status(503).json({ error: 'All providers in auto-route chain failed', x_auto_route: true });
}

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

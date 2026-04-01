// server/free-models-proxy.cjs — Free Models Proxy
// Объединяет все бесплатные API в один endpoint
// Port: 20129

const express = require('express');
const app = express();
const PORT = 20129;

app.use(express.json());

// API ключи из .env
const GROQ_KEY = "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";
const MISTRAL_KEY = "gH6KmK51C5FW1U57YCHVqmJuiY4eEi5k";
const ZEN_KEY = "REDACTED_API_KEY";
const OPENROUTER_KEY = "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";

// Маппинг моделей
const MODEL_MAP = {
  // Groq
  'groq/llama-3.3-70b': { provider: 'groq', model: 'llama-3.3-70b-versatile', key: GROQ_KEY, url: 'https://api.groq.com/openai/v1/chat/completions' },
  
  // Mistral
  'mistral/small': { provider: 'mistral', model: 'mistral-small-latest', key: MISTRAL_KEY, url: 'https://api.mistral.ai/v1/chat/completions' },
  
  // OpenRouter FREE models
  'openrouter/qwen3.6': { provider: 'openrouter', model: 'qwen/qwen3.6-plus-preview:free', key: OPENROUTER_KEY, url: 'https://openrouter.ai/api/v1/chat/completions' },
  'openrouter/nemotron': { provider: 'openrouter', model: 'nvidia/nemotron-3-super-120b-a12b:free', key: OPENROUTER_KEY, url: 'https://openrouter.ai/api/v1/chat/completions' },
  'openrouter/trinity': { provider: 'openrouter', model: 'arcee-ai/trinity-large-preview:free', key: OPENROUTER_KEY, url: 'https://openrouter.ai/api/v1/chat/completions' },
  'openrouter/minimax': { provider: 'openrouter', model: 'minimax/minimax-m2.5:free', key: OPENROUTER_KEY, url: 'https://openrouter.ai/api/v1/chat/completions' },
  'openrouter/step-flash': { provider: 'openrouter', model: 'stepfun/step-3.5-flash:free', key: OPENROUTER_KEY, url: 'https://openrouter.ai/api/v1/chat/completions' },
  
  // OpenCode Zen
  'zen/qwen3.6': { provider: 'zen', model: 'qwen3.6-plus-free', key: ZEN_KEY, url: 'https://opencode.ai/zen/v1/chat/completions' },
  'zen/nemotron': { provider: 'zen', model: 'nemotron-3-super-free', key: ZEN_KEY, url: 'https://opencode.ai/zen/v1/chat/completions' },
  'zen/big-pickle': { provider: 'zen', model: 'big-pickle', key: ZEN_KEY, url: 'https://opencode.ai/zen/v1/chat/completions' },
  
  // Ollama local
  'ollama/qwen2.5-coder': { provider: 'ollama', model: 'qwen2.5-coder:3b', url: 'http://localhost:11434/v1/chat/completions' },
  'ollama/qwen2.5': { provider: 'ollama', model: 'qwen2.5:7b', url: 'http://localhost:11434/v1/chat/completions' },
};

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'free-models-proxy',
    port: PORT,
    models: Object.keys(MODEL_MAP),
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

// Chat completions
app.post('/v1/chat/completions', async (req, res) => {
  const { model, messages, stream = false } = req.body;
  
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
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error });
    }
    
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[free-models-proxy] Running on http://localhost:${PORT}`);
  console.log(`[free-models-proxy] Available models: ${Object.keys(MODEL_MAP).length}`);
});

// server/gateway-mask.cjs — Masking Layer: Single API Endpoint
// Hides all infrastructure behind unified OpenAI-compatible API
// Port: 20133

const express = require('express');
const app = express();
const PORT = process.env.MASK_PORT || 20133;

app.use(express.json());

// ─── Unified API Key (single key for all) ──────────────────────────────
const UNIFIED_API_KEY = process.env.UNIFIED_API_KEY || 'sk-unified-shadow-stack-2026';

// ─── Upstream Proxies ──────────────────────────────────────────────────
const UPSTREAMS = {
  primary:   'http://localhost:20129/v1',  // free-models-proxy #1 (113 models)
  secondary: 'http://localhost:20132/v1',  // free-models-proxy #2 (99 models)  
  omniroute: 'http://localhost:20130/v1',   // OmniRouter (56 models)
};

// ─── Model → Upstream Mapping (smart routing) ──────────────────────────
const MODEL_ROUTING = {
  // Primary proxy (most models)
  'auto':              'primary',
  'gr-llama70b':      'primary',
  'gr-qwen3-32b':     'primary',
  'cb-llama70b':      'primary',
  'gem-2.5-flash':    'primary',
  'ms-small':         'primary',
  'or-nemotron':      'primary',
  'sn-llama70b':      'primary',
  'hf-llama8b':       'primary',
  'nv-llama70b':      'primary',
  'fw-llama70b':      'primary',
  'co-command-r':     'primary',
  // Secondary proxy (redundancy, different models)
  'gr-llama8b':      'secondary',
  'or-step-flash':    'secondary',
  'or-llama70b':      'secondary',
  'hf-qwen72b':       'secondary',
  'hf-llama70b':      'secondary',
  // OmniRouter (premium, when available)
  'kr/claude-sonnet-4.5': 'omniroute',
  'kr/claude-haiku-4.5': 'omniroute',
};

// ─── API Key Validation ────────────────────────────────────────────────
function validateKey(req, res) {
  const key = req.headers['authorization']?.replace('Bearer ', '');
  if (key !== UNIFIED_API_KEY && !key?.startsWith('sk-')) {
    res.status(401).json({
      error: {
        message: 'Invalid API key',
        type: 'authentication_error',
        code: 'invalid_api_key'
      }
    });
    return false;
  }
  return true;
}

// ─── Get Upstream URL ─────────────────────────────────────────────────
function getUpstream(model) {
  // Try model-specific routing first
  if (MODEL_ROUTING[model]) {
    return UPSTREAMS[MODEL_ROUTING[model]];
  }
  // Default to round-robin between primary and secondary
  return UPSTREAMS.primary;
}

// ─── Mask Response Headers ─────────────────────────────────────────────
function maskHeaders(res) {
  res.removeHeader('x-proxy-provider');
  res.removeHeader('x-upstream');
  res.removeHeader('server');
  res.setHeader('server', 'nginx/1.24.0');
  res.setHeader('x-request-id', crypto.randomUUID());
}

// ─── Unified /v1/models ────────────────────────────────────────────────
app.get('/v1/models', async (req, res) => {
  if (!validateKey(req, res)) return;
  
  try {
    // Fetch from all upstream in parallel
    const responses = await Promise.allSettled([
      fetch(UPSTREAMS.primary + '/models'),
      fetch(UPSTREAMS.secondary + '/models'),
      fetch(UPSTREAMS.omniroute + '/models'),
    ]);
    
    const allModels = [];
    const seen = new Set();
    
    for (const resp of responses) {
      if (resp.status === 'fulfilled' && resp.value.ok) {
        const data = await resp.value.json();
        for (const model of data.data || []) {
          // Normalize model IDs to hide upstream origin
          const normalizedId = normalizeModelId(model.id);
          if (!seen.has(normalizedId)) {
            seen.add(normalizedId);
            allModels.push({
              id: normalizedId,
              object: 'model',
              created: Date.now(),
              owned_by: 'shadow-stack',
            });
          }
        }
      }
    }
    
    maskHeaders(res);
    res.json({
      object: 'list',
      data: allModels,
    });
  } catch (e) {
    res.status(500).json({ error: { message: e.message } });
  }
});

// ─── Unified /v1/chat/completions ──────────────────────────────────────
app.post('/v1/chat/completions', async (req, res) => {
  if (!validateKey(req, res)) return;
  
  const { model, messages, stream = false, ...options } = req.body;
  const upstream = getUpstream(model);
  
  try {
    const response = await fetch(upstream + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${UNIFIED_API_KEY}`,
      },
      body: JSON.stringify({ model, messages, stream, ...options }),
    });
    
    // Mask response
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      maskHeaders(res);
      response.body.pipe(res);
    } else {
      const data = await response.json();
      // Normalize response to hide upstream
      if (data.choices?.[0]?.message) {
        data.model = 'shadow-ai'; // Mask actual model
      }
      maskHeaders(res);
      res.json(data);
    }
  } catch (e) {
    res.status(500).json({ error: { message: e.message } });
  }
});

// ─── Normalize Model ID ───────────────────────────────────────────────
function normalizeModelId(id) {
  // Remove provider prefixes, keep simple names
  return id
    .replace(/^(kr|kiro|anthropic|groq|mistral|openrouter|fireworks|cerebras|cohere|together)\//, '')
    .replace(/^accounts\/fireworks\/models\//, '')
    .replace(/\:free$/, '')
    .replace(/\-free$/, '');
}

// ─── Health (masked) ──────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Shadow Stack Unified API',
    version: '1.0.0',
    models: '200+',
    uptime: Math.round(process.uptime()),
  });
});

// ─── Start ─────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[gateway-mask] Shadow Stack Unified API running on http://0.0.0.0:${PORT}`);
  console.log(`[gateway-mask] Unified key: ${UNIFIED_API_KEY.slice(0, 20)}...`);
  console.log(`[gateway-mask] Upstreams: primary=${UPSTREAMS.primary}, secondary=${UPSTREAMS.secondary}, omniroute=${UPSTREAMS.omniroute}`);
});

const crypto = require('crypto');

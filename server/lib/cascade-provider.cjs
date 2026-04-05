// server/lib/cascade-provider.cjs — Unified provider via Free Proxy :20129 + Ollama
// Replaces broken OmniRoute :20128. Uses working Free Models Proxy as primary cascade.
// CJS only — no ESM in server/.
//
// FIX 2026-04-05: kiro/* removed (OmniRoute DOWN). Primary → openrouter/qwen3.6.

const http = require('http');
const https = require('https');

const FREE_PROXY_URL = process.env.FREE_PROXY_URL || 'http://localhost:20129/v1';
const OLLAMA_URL = 'http://localhost:11434/api/generate';

// ─── LRU Cache ────────────────────────────────────────────────────────────────

const CACHE_MAX = 300;
const CACHE_TTL_MS = 30 * 60 * 1000;

class LRUCache {
  constructor(max = CACHE_MAX, ttl = CACHE_TTL_MS) {
    this.max = max;
    this.ttl = ttl;
    this.cache = new Map();
  }
  _key(p) { return (p || '').slice(0, 200).trim().toLowerCase(); }
  get(p) {
    const e = this.cache.get(this._key(p));
    if (!e) return null;
    if (Date.now() - e.ts > this.ttl) { this.cache.delete(this._key(p)); return null; }
    this.cache.delete(this._key(p));
    this.cache.set(this._key(p), e);
    return e.value;
  }
  set(p, v) {
    if (this.cache.size >= this.max) { this.cache.delete(this.cache.keys().next().value); }
    this.cache.set(this._key(p), { value: v, ts: Date.now() });
  }
  get size() { return this.cache.size; }
  clear() { this.cache.clear(); }
}

const cache = new LRUCache();

// ─── Provider Calls ───────────────────────────────────────────────────────────

/**
 * Call Free Models Proxy (:20129) — OpenAI-compatible API
 * Models: kiro/sonnet, kiro/haiku, groq/llama-3.3-70b, openrouter/qwen3.6, etc.
 */
async function callFreeProxy(prompt, model = 'kiro/sonnet') {
  const body = JSON.stringify({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 4096,
  });

  const res = await fetch(FREE_PROXY_URL + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FreeProxy/${model} ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Call Ollama local — last resort, uses RAM
 */
async function callOllama(prompt, model = 'qwen2.5-coder:3b') {
  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false }),
  });

  if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.response || '';
}

// ─── Model Mapping ────────────────────────────────────────────────────────────

const MODEL_MAP = {
  // Tier 1: OpenRouter free models
  'qwen': 'openrouter/qwen3.6',
  'qwen3': 'openrouter/qwen3.6',
  'sonnet': 'openrouter/qwen3.6',
  'claude-sonnet': 'openrouter/qwen3.6',

  // Tier 2: Zen models
  'nemotron': 'openrouter/nemotron',
  'big-pickle': 'zen/big-pickle',

  // Tier 3: Fast models
  'groq-llama': 'groq/llama-3.3-70b',
  'llama-70b': 'groq/llama-3.3-70b',
  'haiku': 'openrouter/step-flash',
  'claude-haiku': 'openrouter/step-flash',

  // Tier 4: Other free
  'minimax': 'openrouter/minimax',
  'step-flash': 'openrouter/step-flash',

  // Auto — smart routing
  'auto': 'openrouter/auto',
};

function resolveModel(taskType) {
  if (MODEL_MAP[taskType]) return MODEL_MAP[taskType];
  // Default: OpenRouter Qwen 3.6 (best free model)
  return 'openrouter/qwen3.6';
}

// ─── Task-based Routing ───────────────────────────────────────────────────────

const TASK_MODEL = {
  code: 'openrouter/qwen3.6',
  build: 'openrouter/qwen3.6',
  chat: 'openrouter/qwen3.6',
  fast: 'groq/llama-3.3-70b',
  plan: 'openrouter/qwen3.6',
  research: 'openrouter/qwen3.6',
  write: 'openrouter/step-flash',
  default: 'openrouter/qwen3.6',
};

// ─── Main Cascade ─────────────────────────────────────────────────────────────

/**
 * Unified cascade: Free Proxy → Ollama
 * @param {string} prompt
 * @param {object} opts
 * @param {string} opts.route - Task type (code, fast, research, etc.)
 * @param {string} opts.model - Override model
 * @param {boolean} opts.noCache - Skip cache
 * @returns {object} { text, model, latency, fromCache }
 */
async function query(prompt, opts = {}) {
  const t0 = Date.now();
  const route = opts.route || 'default';

  // Check cache
  if (!opts.noCache) {
    const cached = cache.get(prompt);
    if (cached) return { ...cached, fromCache: true, latency: 0 };
  }

  // Resolve model
  const model = opts.model || TASK_MODEL[route] || TASK_MODEL.default;
  const lastError = null;

  // Try Free Proxy first
  try {
    const text = await callFreeProxy(prompt, model);
    if (text && text.length > 0) {
      const result = { text, model, latency: Date.now() - t0, provider: 'free-proxy' };
      if (!opts.noCache) cache.set(prompt, result);
      return result;
    }
  } catch (e) {
    // Fall through to Ollama
  }

  // Fallback: try alternative model on Free Proxy
  const fallbackModel = model === 'openrouter/qwen3.6' ? 'groq/llama-3.3-70b' : 'openrouter/qwen3.6';
  try {
    const text = await callFreeProxy(prompt, fallbackModel);
    if (text && text.length > 0) {
      const result = { text, model: fallbackModel, latency: Date.now() - t0, provider: 'free-proxy' };
      if (!opts.noCache) cache.set(prompt, result);
      return result;
    }
  } catch (e) {
    // Fall through to Ollama
  }

  // Last resort: Ollama local
  try {
    const text = await callOllama(prompt, 'qwen2.5-coder:3b');
    if (text && text.length > 0) {
      return { text, model: 'qwen2.5-coder:3b', latency: Date.now() - t0, provider: 'ollama' };
    }
  } catch (e) {
    // All providers failed
  }

  throw new Error('All providers failed (free-proxy + ollama)');
}

// ─── Health Check ─────────────────────────────────────────────────────────────

async function health() {
  const status = { freeProxy: false, ollama: false, models: [] };

  try {
    const res = await fetch(FREE_PROXY_URL + '/models');
    if (res.ok) {
      const data = await res.json();
      status.freeProxy = true;
      status.models = (data.data || []).map(m => m.id);
    }
  } catch {}

  try {
    const res = await fetch('http://localhost:11434/api/tags');
    if (res.ok) {
      const data = await res.json();
      status.ollama = true;
      status.ollamaModels = (data.models || []).map(m => m.name);
    }
  } catch {}

  return status;
}

// ─── Available Models ─────────────────────────────────────────────────────────

async function getModels() {
  try {
    const res = await fetch(FREE_PROXY_URL + '/models');
    if (res.ok) {
      const data = await res.json();
      return (data.data || []).map(m => ({
        id: m.id,
        provider: 'free-proxy',
        cost: 'free',
      }));
    }
  } catch {}
  return [];
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  query,
  health,
  getModels,
  callFreeProxy,
  callOllama,
  resolveModel,
  TASK_MODEL,
  cache,
};

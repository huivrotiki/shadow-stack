// server/lib/ai-sdk.cjs — Full cascade with 9 tiers + Telegram escalation
// NOT using Vercel AI SDK — raw fetch to avoid dependencies on 8GB M1

const http = require('http');
const https = require('https');

// ─── LRU CACHE (pure JS, no npm dependency for CJS compat) ─────────────────

const CACHE_MAX = 500;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

class LRUCache {
  constructor(max = CACHE_MAX, ttl = CACHE_TTL_MS) {
    this.max = max;
    this.ttl = ttl;
    this.cache = new Map();
  }

  _makeKey(prompt) {
    // Use first 200 chars as key (sufficient for dedup)
    return (prompt || '').slice(0, 200).trim().toLowerCase();
  }

  get(prompt) {
    const key = this._makeKey(prompt);
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.ts > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(prompt, value) {
    const key = this._makeKey(prompt);

    // Evict oldest if at capacity
    if (this.cache.size >= this.max) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, { value, ts: Date.now() });
  }

  get size() { return this.cache.size; }
  clear() { this.cache.clear(); }
}

const responseCache = new LRUCache();

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const GROUP_ID = process.env.TELEGRAM_GROUP_ID || '-1002107442654';
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN;

// ─── BROWSER PROVIDER (Shadow Router CDP) ───────────────────────────────────

const SHADOW_ROUTER_URL = process.env.SHADOW_ROUTER_URL || 'http://localhost:3002';

async function callBrowserProvider(target, prompt) {
  const encoded = encodeURIComponent(prompt);
  const res = await fetch(SHADOW_ROUTER_URL + '/route/' + target + '/' + encoded, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error('Browser/' + target + ' ' + res.status + ': ' + body);
  }
  const data = await res.json();
  if (data.error) throw new Error('Browser/' + target + ': ' + data.error);
  return data.response || '';
}

// ─── PROVIDER CALLS (API) ───────────────────────────────────────────────────

async function callOpenAI(prompt, model = 'gpt-4o') {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not set');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 4096 }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callGemini(prompt, model = 'gemini-2.0-flash') {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set');
  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent',
    { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callGroq(prompt, model = 'llama-3.3-70b-versatile') {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY not set');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 4096 }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callOpenRouter(prompt, model) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY not set');
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}`, 'HTTP-Referer': 'http://localhost:3001', 'X-Title': 'Shadow Stack' },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 4096 }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callAlibaba(prompt, model = 'qwen-max') {
  const key = process.env.ALIBABA_API_KEY;
  if (!key) throw new Error('ALIBABA_API_KEY not set');
  const res = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 4096 }),
  });
  if (!res.ok) throw new Error(`Alibaba ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callLiteLLM(prompt, model = 'ollama/qwen2.5-coder:3b') {
  const key = process.env.LITELLM_MASTER_KEY || 'sk-shadow-local';
  const res = await fetch('http://127.0.0.1:4001/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 4096 }),
  });
  if (!res.ok) throw new Error(`LiteLLM ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callOllama(prompt, model = 'qwen2.5-coder:3b') {
  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.response || '';
}

// ─── GEMINI CLI PROVIDER (@google/gemini-cli) ────────────────────────────────

const GEMINI_CLI_PATH = process.env.GEMINI_CLI_PATH || '/opt/homebrew/bin/gemini';

async function callGeminiCLI(prompt, model) {
  const { execFile } = require('child_process');
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
  const cleanKey = GEMINI_API_KEY.replace(/^Gemini API Key=/, '');

  return new Promise((resolve, reject) => {
    const env = { ...process.env, GEMINI_API_KEY: cleanKey };
    const args = ['-p', prompt, '--output-format', 'text'];
    if (model) args.push('--model', model);

    const timer = setTimeout(() => { proc.kill('SIGTERM'); }, 60000);
    const proc = execFile(GEMINI_CLI_PATH, args, { env, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      clearTimeout(timer);
      if (err) {
        if (err.signal === 'SIGTERM') return reject(new Error('GeminiCLI: timeout'));
        return reject(new Error(`GeminiCLI: ${err.message}`));
      }
      const text = stdout.trim();
      if (!text) return reject(new Error('GeminiCLI: empty response'));
      resolve(text);
    });
  });
}

// ─── OMNIRoute PROVIDER (Kiro free Claude + Anthropic fallback) ─────────────

const OMNIRoute_URL = process.env.OMNIRoute_URL || 'http://localhost:20128/v1';

async function callOmniRoute(prompt, model = 'kiro/claude-sonnet-4.5') {
  const res = await fetch(OMNIRoute_URL + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OmniRoute/${model} ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ─── TIER DEFINITIONS ────────────────────────────────────────────────────────

const TIERS = {
  // === OMNIRoute (Kiro free Claude 4.5 + Anthropic fallback) ===
  omniroute: [
    { name: 'kiro-sonnet-4.5', fn: (p) => callOmniRoute(p, 'kiro/claude-sonnet-4.5'), cost: 'free' },
    { name: 'kiro-haiku-4.5', fn: (p) => callOmniRoute(p, 'kiro/claude-haiku-4.5'), cost: 'free' },
    { name: 'anthropic-sonnet', fn: (p) => callOmniRoute(p, 'anthropic/claude-sonnet-4-20250514'), cost: 'paid' },
  ],

  // === BROWSER-FIRST (CDP via Shadow Router — free, no API limits) ===

  // Tier 1: Gemini via browser
  'gemini-browser': [
    { name: 'gemini-browser', fn: (p) => callBrowserProvider('gemini', p), cost: 'free' },
  ],
  // Tier 2: Groq via browser
  'groq-browser': [
    { name: 'groq-browser', fn: (p) => callBrowserProvider('groq', p), cost: 'free' },
  ],
  // Tier 3: Manus via browser
  'manus-browser': [
    { name: 'manus-browser', fn: (p) => callBrowserProvider('manus', p), cost: 'free' },
  ],
  // Tier 4: Perplexity via browser (Comet)
  'perplexity-browser': [
    { name: 'perplexity-browser', fn: (p) => callBrowserProvider('perplexity', p), cost: 'free' },
  ],

  // === API PROVIDERS ===

  // Tier 5: OpenRouter free models (verified 2026-03-31)
  openrouter: [
    { name: 'or-step35', fn: (p) => callOpenRouter(p, 'stepfun/step-3.5-flash:free'), cost: 'free' },
    { name: 'or-nemotron', fn: (p) => callOpenRouter(p, 'nvidia/nemotron-3-super-120b-a12b:free'), cost: 'free' },
    { name: 'or-trinity', fn: (p) => callOpenRouter(p, 'arcee-ai/trinity-large-preview:free'), cost: 'free' },
    { name: 'or-gemma3-12b', fn: (p) => callOpenRouter(p, 'google/gemma-3-12b-it:free'), cost: 'free' },
  ],

  // === MORE BROWSER PROVIDERS ===

  // Tier 6: Antigravity Copilot via browser
  'antigravity': [
    { name: 'antigravity-browser', fn: (p) => callBrowserProvider('antigravity', p), cost: 'free' },
  ],
  // Tier 7: Microsoft Copilot via browser
  'copilot-browser': [
    { name: 'copilot-browser', fn: (p) => callBrowserProvider('copilot', p), cost: 'free' },
  ],
  // Tier 8: Perplexity chat via Comet
  'perplexity-chat': [
    { name: 'perplexity-chat', fn: (p) => callBrowserProvider('perplexity2', p), cost: 'free' },
  ],

  // === API PROVIDERS (secondary) ===

  // Gemini API (backup if browser fails)
  gemini: [
    { name: 'gemini-flash', fn: (p) => callGemini(p, 'gemini-2.0-flash'), cost: 'free' },
    { name: 'gemini-pro', fn: (p) => callGemini(p, 'gemini-1.5-pro'), cost: 'free' },
  ],
  // Gemini CLI (headless, 1500 req/day free)
  'gemini-cli': [
    { name: 'gemini-cli-2.5-flash', fn: (p) => callGeminiCLI(p, 'gemini-2.5-flash'), cost: 'free' },
    { name: 'gemini-cli-2.5-pro', fn: (p) => callGeminiCLI(p, 'gemini-2.5-pro'), cost: 'free' },
  ],
  // Groq API (backup if browser fails)
  groq: [
    { name: 'groq-llama70b', fn: (p) => callGroq(p, 'llama-3.3-70b-versatile'), cost: 'free' },
    { name: 'groq-deepseek', fn: (p) => callGroq(p, 'deepseek-r1-distill-llama-70b'), cost: 'free' },
    { name: 'groq-qwenqwq', fn: (p) => callGroq(p, 'qwen-qwq-32b'), cost: 'free' },
  ],
  // REMOVED: alibaba (invalid API key - 401 error)
  // alibaba: [
  //   { name: 'alibaba-qwen-max', fn: (p) => callAlibaba(p, 'qwen-max'), cost: 'free' },
  // ],
  // OpenAI (paid, premium only)
  openai: [
    { name: 'openai-gpt4o', fn: (p) => callOpenAI(p, 'gpt-4o'), cost: 'paid' },
    { name: 'openai-gpt4o-mini', fn: (p) => callOpenAI(p, 'gpt-4o-mini'), cost: 'paid' },
  ],
  // LiteLLM Proxy
  litellm: [
    { name: 'litellm-3b', fn: (p) => callLiteLLM(p, 'ollama/qwen2.5-coder:3b'), cost: 'local' },
  ],

  // === LOCAL (last resort — uses RAM on M1) ===

  // Tier 12: Ollama
  ollama: [
    { name: 'ollama-3b', fn: (p) => callOllama(p, 'qwen2.5-coder:3b'), cost: 'local' },
    { name: 'ollama-7b', fn: (p) => callOllama(p, 'qwen2.5:7b'), cost: 'local' },
  ],
};

// New 12-level cascade: browser-first → API → telegram → local
const CASCADE_ORDER = [
  'omniroute',           // 1. OmniRoute (Kiro free Claude 4.5 + Anthropic fallback)
  'gemini-browser',      // 2. Gemini CDP
  'groq-browser',        // 3. Groq CDP
  'manus-browser',       // 4. Manus CDP
  'perplexity-browser',  // 5. Perplexity/Comet CDP
  'openrouter',          // 6. OpenRouter API (free models)
  'antigravity',         // 7. Antigravity CDP
  'copilot-browser',     // 8. MS Copilot CDP
  'perplexity-chat',     // 9. Perplexity chat CDP
  'gemini',              // 10. Gemini API (backup)
  'gemini-cli',          // 11. Gemini CLI (headless)
],
];

// ─── TIER CHOOSER ────────────────────────────────────────────────────────────

function chooseTier(msg, opts = {}) {
  if (opts.premium) return 'paid';
  const len = (msg || '').length;
  const isCode = /```|function |const |import |class |def |<[a-z]/.test(msg);

  if (isCode || len > 1500) return 'smart';     // complex → full cascade with OpenAI
  if (len > 300) return 'balanced';              // medium → skip OpenAI
  return 'fast';                                  // short → fastest free
}

// ─── TELEGRAM ESCALATION (warmAndAsk) ────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function sendTelegram(chatId, text) {
  return new Promise((resolve, reject) => {
    if (!TELEGRAM_TOKEN) return reject(new Error('No TELEGRAM_BOT_TOKEN'));
    const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' });
    const req = https.request({
      hostname: '149.154.166.110',
      path: `/bot${TELEGRAM_TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'Host': 'api.telegram.org' },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({ ok: false }); } });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

function splitForForwarding(prompt, maxChunk = 1800) {
  if (prompt.length <= maxChunk) return [prompt];
  const chunks = [];
  let current = '';
  for (const para of prompt.split('\n\n')) {
    if ((current + para).length > maxChunk) {
      if (current) chunks.push(current.trim());
      current = para;
    } else {
      current += '\n\n' + para;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

async function warmAndAsk(botUsername, message, timeoutMs = 30000) {
  const chunks = splitForForwarding(message);

  // Send context chunks first (no reply expected)
  for (let i = 0; i < chunks.length - 1; i++) {
    await sendTelegram(GROUP_ID, `${botUsername} [context ${i + 1}/${chunks.length}]: ${chunks[i]}`);
    await sleep(1500);
  }

  // Send final chunk as the actual question
  const finalChunk = chunks[chunks.length - 1];
  await sendTelegram(GROUP_ID, `${botUsername} ${finalChunk}`);

  // Return acknowledgment — actual answer comes async in Telegram
  return `[Forwarded to ${botUsername} in group. Answer will appear in Telegram.]`;
}

// ─── MAIN CASCADE ────────────────────────────────────────────────────────────

async function shadowGenerate(msg, opts = {}) {
  const tier = opts.tier || chooseTier(msg, opts);
  const t0 = Date.now();
  let lastError = null;

  // Check LRU cache first (skip for premium/paid requests)
  if (!opts.premium && !opts.noCache) {
    const cached = responseCache.get(msg);
    if (cached) {
      return { ...cached, fromCache: true, latency: 0 };
    }
  }

  // Determine which tier groups to try
  let tierGroups;
  if (tier === 'smart') {
    tierGroups = SMART_ORDER;
  } else if (tier === 'paid' && opts.premium) {
    // Premium: only OpenAI (or Anthropic if configured)
    try {
      const text = await callOpenAI(msg, 'gpt-4o');
      return { text, tier: 'paid-gpt4o', latency: Date.now() - t0, model: 'openai-gpt4o' };
    } catch (e) {
      lastError = e;
    }
  } else {
    tierGroups = CASCADE_ORDER;
  }

  // Try each tier group
  for (const groupName of tierGroups) {
    const providers = TIERS[groupName];
    if (!providers) continue;

    for (const provider of providers) {
      try {
        const text = await provider.fn(msg);
        if (text && text.length > 0) {
          const result = { text, tier: groupName, latency: Date.now() - t0, model: provider.name };
          // Cache successful responses
          if (!opts.noCache) responseCache.set(msg, result);
          return result;
        }
      } catch (e) {
        lastError = e;
        // Continue to next provider in same tier
      }
    }
  }

  // Telegram escalation (before giving up)
  const telegramBots = [
    { username: '@chatgpt_gidbot', tier: 'telegram-chatgpt', model: 'chatgpt_gidbot' },
    { username: '@deepseek_gidbot', tier: 'telegram-deepseek', model: 'deepseek_gidbot' },
  ];

  for (const bot of telegramBots) {
    try {
      const text = await warmAndAsk(bot.username, msg);
      return { text, tier: bot.tier, latency: Date.now() - t0, model: bot.model };
    } catch (e) {
      lastError = e;
    }
  }

  throw new Error('All 12 providers + Telegram exhausted: ' + (lastError ? lastError.message : 'unknown'));
}

// ─── EXPORTS ─────────────────────────────────────────────────────────────────

module.exports = {
  shadowGenerate,
  chooseTier,
  warmAndAsk,
  splitForForwarding,
  callBrowserProvider,
  callOpenAI,
  callGemini,
  callGeminiCLI,
  callGroq,
  callOpenRouter,
  callAlibaba,
  callLiteLLM,
  callOllama,
  callOmniRoute,
  TIERS,
  CASCADE_ORDER,
  SMART_ORDER,
  responseCache,
};

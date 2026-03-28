// server/lib/ai-sdk.cjs — Full cascade with 9 tiers + Telegram escalation
// NOT using Vercel AI SDK — raw fetch to avoid dependencies on 8GB M1

const http = require('http');
const https = require('https');

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const GROUP_ID = process.env.TELEGRAM_GROUP_ID || '-1002107442654';
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN;

// ─── PROVIDER CALLS ──────────────────────────────────────────────────────────

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
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
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

// ─── TIER DEFINITIONS ────────────────────────────────────────────────────────

const TIERS = {
  // Tier 0: OpenAI direct (best quality, paid but we have key)
  openai: [
    { name: 'openai-gpt4o', fn: (p) => callOpenAI(p, 'gpt-4o'), cost: 'paid' },
    { name: 'openai-gpt4o-mini', fn: (p) => callOpenAI(p, 'gpt-4o-mini'), cost: 'paid' },
  ],
  // Tier 1: Gemini API (free 1500/day)
  gemini: [
    { name: 'gemini-flash', fn: (p) => callGemini(p, 'gemini-2.0-flash'), cost: 'free' },
    { name: 'gemini-pro', fn: (p) => callGemini(p, 'gemini-1.5-pro'), cost: 'free' },
  ],
  // Tier 2: Groq (free 30/min)
  groq: [
    { name: 'groq-llama70b', fn: (p) => callGroq(p, 'llama-3.3-70b-versatile'), cost: 'free' },
    { name: 'groq-deepseek', fn: (p) => callGroq(p, 'deepseek-r1-distill-llama-70b'), cost: 'free' },
    { name: 'groq-qwenqwq', fn: (p) => callGroq(p, 'qwen-qwq-32b'), cost: 'free' },
  ],
  // Tier 3: OpenRouter free models
  openrouter: [
    { name: 'or-deepseek-r1', fn: (p) => callOpenRouter(p, 'deepseek/deepseek-r1:free'), cost: 'free' },
    { name: 'or-step35', fn: (p) => callOpenRouter(p, 'stepfun/step-3.5-flash:free'), cost: 'free' },
    { name: 'or-minimax', fn: (p) => callOpenRouter(p, 'minimax/minimax-m2.5:free'), cost: 'free' },
    { name: 'or-nemotron', fn: (p) => callOpenRouter(p, 'nvidia/nemotron-3-super-120b-a12b:free'), cost: 'free' },
    { name: 'or-qwen3next', fn: (p) => callOpenRouter(p, 'qwen/qwen3-next-80b-a3b-instruct:free'), cost: 'free' },
    { name: 'or-trinity', fn: (p) => callOpenRouter(p, 'arcee-ai/trinity-large-preview:free'), cost: 'free' },
  ],
  // Tier 4: Alibaba DashScope
  alibaba: [
    { name: 'alibaba-qwen-max', fn: (p) => callAlibaba(p, 'qwen-max'), cost: 'free' },
  ],
  // Tier 5: LiteLLM Proxy (Anthropic-compatible API → Ollama)
  litellm: [
    { name: 'litellm-3b', fn: (p) => callLiteLLM(p, 'ollama/qwen2.5-coder:3b'), cost: 'local' },
  ],
  // Tier 6: Ollama LOCAL (last resort — uses RAM on M1)
  ollama: [
    { name: 'ollama-3b', fn: (p) => callOllama(p, 'qwen2.5-coder:3b'), cost: 'local' },
    { name: 'ollama-7b', fn: (p) => callOllama(p, 'qwen2.5:7b'), cost: 'local' },
  ],
};

// Tier ordering for the smart cascade
const CASCADE_ORDER = ['gemini', 'groq', 'openrouter', 'alibaba', 'litellm', 'ollama'];
const SMART_ORDER = ['openai', 'gemini', 'groq', 'openrouter', 'alibaba', 'litellm', 'ollama'];

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
          return { text, tier: groupName, latency: Date.now() - t0, model: provider.name };
        }
      } catch (e) {
        lastError = e;
        // Continue to next provider in same tier
      }
    }
  }

  // All API providers failed → Telegram escalation (Tier 4)
  try {
    const text = await warmAndAsk('@chatgpt_gidbot', msg);
    return { text, tier: 'telegram-chatgpt', latency: Date.now() - t0, model: 'chatgpt_gidbot' };
  } catch (e) {
    lastError = e;
  }

  try {
    const text = await warmAndAsk('@deepseek_gidbot', msg);
    return { text, tier: 'telegram-deepseek', latency: Date.now() - t0, model: 'deepseek_gidbot' };
  } catch (e) {
    lastError = e;
  }

  throw new Error(`All providers exhausted: ${lastError?.message}`);
}

// ─── EXPORTS ─────────────────────────────────────────────────────────────────

module.exports = {
  shadowGenerate,
  chooseTier,
  warmAndAsk,
  splitForForwarding,
  callOpenAI,
  callGemini,
  callGroq,
  callOpenRouter,
  callAlibaba,
  callLiteLLM,
  callOllama,
  TIERS,
  CASCADE_ORDER,
  SMART_ORDER,
};

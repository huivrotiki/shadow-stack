// server/providers/groq.js — Groq Provider
// API: https://api.groq.com/openai/v1/chat/completions
// Model: mixtral-8x7b-32768
// Rate limit: 25 req/min, exponential backoff on 429

import config from '../lib/config.cjs';
import logger from '../lib/logger.cjs';

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = config.GROQ_MODEL || 'mixtral-8x7b-32768';
const RATE_LIMIT_PER_MIN = 25;
const MAX_BACKOFF_MS = 8000;

// Rate limiter state
let requestTimestamps = [];

// Stats
let avgResponseTime = 0;
let successRate = 1.0;
let totalRequests = 0;
let successfulRequests = 0;

function isRateLimited() {
  const now = Date.now();
  const oneMinAgo = now - 60000;
  requestTimestamps = requestTimestamps.filter(t => t > oneMinAgo);
  return requestTimestamps.length >= RATE_LIMIT_PER_MIN;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function queryWithBackoff(prompt, retries = 0) {
  const apiKey = config.GROQ_API_KEY;
  if (!apiKey) return { text: '', model: MODEL, tokens: 0, error: 'GROQ_API_KEY not set' };

  if (isRateLimited()) {
    logger.warn('Groq rate limited (client-side)', { requestsInWindow: requestTimestamps.length });
    return { text: '', model: MODEL, tokens: 0, error: 'RATE_LIMITED_CLIENT' };
  }

  requestTimestamps.push(Date.now());
  const start = Date.now();
  totalRequests++;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4096,
      }),
    });

    if (res.status === 429) {
      const backoff = Math.min(1000 * Math.pow(2, retries), MAX_BACKOFF_MS);
      logger.warn('Groq 429, backing off', { backoff, retries });
      if (retries < 3) {
        await sleep(backoff);
        return queryWithBackoff(prompt, retries + 1);
      }
      updateStats(start, false);
      return { text: '', model: MODEL, tokens: 0, error: 'RATE_LIMITED_429' };
    }

    if (!res.ok) {
      const text = await res.text();
      logger.error('Groq HTTP error', { status: res.status, body: text });
      updateStats(start, false);
      return { text: '', model: MODEL, tokens: 0, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    updateStats(start, true);
    return {
      text: data.choices?.[0]?.message?.content || '',
      model: data.model || MODEL,
      tokens: data.usage?.completion_tokens || 0,
    };
  } catch (e) {
    updateStats(start, false);
    logger.error('Groq query error', { message: e.message });
    return { text: '', model: MODEL, tokens: 0, error: e.message };
  }
}

async function query(prompt) {
  return queryWithBackoff(prompt);
}

async function healthCheck() {
  const apiKey = config.GROQ_API_KEY;
  if (!apiKey) return { online: false, latency: -1 };

  try {
    const start = Date.now();
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      }),
      signal: AbortSignal.timeout(3000),
    });
    const latency = Date.now() - start;
    return { online: res.ok, latency };
  } catch (e) {
    return { online: false, latency: -1 };
  }
}

function updateStats(start, success) {
  const elapsed = Date.now() - start;
  avgResponseTime = (avgResponseTime * totalRequests + elapsed) / (totalRequests + 1);
  if (success) successfulRequests++;
  successRate = successfulRequests / totalRequests;
}

function getStats() {
  return { avgResponseTime: Math.round(avgResponseTime), successRate, totalRequests };
}

export { query, healthCheck, getStats };
export default { name: 'groq', query, healthCheck, getStats };

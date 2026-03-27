// server/providers/ollama.js — Ollama Provider
// Local endpoint: http://localhost:11434
// Default model: qwen2.5-coder:3b

import { execSync } from 'child_process';
import config from '../lib/config.cjs';
import logger from '../lib/logger.cjs';

const OLLAMA_URL = config.OLLAMA_URL || 'http://localhost:11434';
const MODEL = config.OLLAMA_MODEL || 'qwen2.5-coder:3b';
const LOW_RAM_MB = 300;

// Stats
let avgResponseTime = 0;
let successRate = 1.0;
let totalRequests = 0;
let successfulRequests = 0;

async function ensureRunning() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) return true;
  } catch (e) {
    logger.info('Ollama not running, starting...');
    try {
      execSync('ollama serve &', { timeout: 5000 });
    } catch (startErr) {
      logger.warn('Could not start ollama', { error: startErr.message });
    }
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 500));
      try {
        const check = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(2000) });
        if (check.ok) return true;
      } catch (_) { /* retry */ }
    }
  }
  return false;
}

function checkRam() {
  const rss = process.memoryUsage().rss / (1024 * 1024);
  return rss < LOW_RAM_MB;
}

async function query(prompt, options = {}) {
  if (!checkRam()) {
    return { text: '', model: MODEL, tokens: 0, error: 'LOW_RAM' };
  }

  const start = Date.now();
  totalRequests++;

  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model || MODEL,
        prompt,
        stream: false,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      logger.error('Ollama HTTP error', { status: res.status, body: text });
      updateStats(start, false);
      return { text: '', model: MODEL, tokens: 0, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    updateStats(start, true);
    return {
      text: data.response || '',
      model: data.model || MODEL,
      tokens: data.eval_count || 0,
    };
  } catch (e) {
    updateStats(start, false);
    logger.error('Ollama query error', { message: e.message });
    return { text: '', model: MODEL, tokens: 0, error: e.message };
  }
}

async function healthCheck() {
  try {
    const start = Date.now();
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(2000) });
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

export { query, healthCheck, ensureRunning, getStats };
export default { name: 'ollama', query, healthCheck, ensureRunning, getStats };

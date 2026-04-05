import { callOmniChain, callTelegramGPT, callTelegramDeepSeek } from './providers.js';
import { fallbackCascade } from './fallback.js';
import { getCached, setCached } from '../lib/semantic-cache.js';
import { isOpen, recordFailure, recordSuccess } from '../lib/circuit-breaker.js';
import { classifyTask } from './classifier.js';

/**
 * SHADOW STACK: SURVIVAL CASCADE - LEVEL 1
 * Enhanced route function with Exponential Backoff (legacy entry point).
 */
async function callProvider(routeName: string, model: string, message: string): Promise<any> {
  console.log(`[ROUTER] Calling ${routeName} with model ${model}...`);
  return { text: 'Response from ' + model };
}

export async function route(routeName: string, model: string, message: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await callProvider(routeName, model, message);
      return { route: routeName, model, status: 'DONE', response, timestamp: new Date().toISOString() };
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('Max retries exceeded');
}

async function checkRAM(): Promise<{ free_mb: number }> {
  try {
    const res = await fetch('http://localhost:3001/ram');
    return await res.json() as { free_mb: number };
  } catch {
    return { free_mb: 200 };
  }
}

export async function omniRoute(prompt: string): Promise<string> {
  const cached = getCached(prompt);
  if (cached) return cached;

  const { free_mb } = await checkRAM();
  const forceShadow = free_mb < 300;
  const task = classifyTask(prompt);
  console.log(`[OMNI] RAM:${free_mb}MB task:${task} len:${prompt.length} shadow:${forceShadow}`);

  if (!forceShadow && !isOpen('omni-t1')) {
    try {
      const text = await callOmniChain(prompt);
      recordSuccess('omni-t1');
      setCached(prompt, text);
      console.log('[OMNI] ✅ omni-t1');
      return text;
    } catch {
      recordFailure('omni-t1');
      console.warn('[OMNI] ❌ omni-t1 → Telegram Shadow Layer');
    }
  }

  const tgProviders = [
    { name: 'tg-chatgpt', fn: () => callTelegramGPT(prompt) },
    { name: 'tg-deepseek', fn: () => callTelegramDeepSeek(prompt) },
  ];
  for (const p of tgProviders) {
    if (isOpen(p.name)) continue;
    try {
      const result = await p.fn();
      recordSuccess(p.name);
      setCached(prompt, result);
      console.log(`[OMNI] ✅ ${p.name}`);
      return result;
    } catch {
      recordFailure(p.name);
      console.warn(`[OMNI] ❌ ${p.name} → next`);
    }
  }

  console.warn('[OMNI] ⚠️ Escalating to legacy fallbackCascade...');
  const { result } = await fallbackCascade(prompt);
  return result.text;
}

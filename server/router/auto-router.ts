/**
 * SHADOW STACK: SURVIVAL CASCADE - LEVEL 1
 * Implementation of Self-Healing and Exponential Backoff for AI Router.
 */

// Mock provider call - in real scenario, it imports from providers library
async function callProvider(routeName: string, model: string, message: string): Promise<any> {
    // This will be handled by specific provider logic (Ollama, OpenClaw, etc.)
    console.log(`[ROUTER] Calling ${routeName} with model ${model}...`);
    // Placeholder logic
    return { text: "Response from " + model };
}

/**
 * Enhanced route function with Exponential Backoff
 */
export async function route(routeName: string, model: string, message: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await callProvider(routeName, model, message);
      return { 
        route: routeName, 
        model, 
        status: 'DONE', 
        response,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      console.error(`[ROUTER] Attempt ${i + 1} failed for ${routeName}:`, err);
      
      if (i === retries - 1) {
        console.error(`[ROUTER] Max retries reached for ${routeName}. Escalating to Fallback Cascade.`);
        throw err;
      }
      
      // Exponential Backoff: 1s, 2s, 4s...
      const delay = Math.pow(2, i) * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

import { callOmniChain, callTelegramGPT, callTelegramDeepSeek } from './providers';
import { fallbackCascade } from './fallback';
import { getCached, setCached } from '../lib/semantic-cache';
import { isOpen, recordFailure, recordSuccess } from '../lib/circuit-breaker';
import { classifyTask } from './classifier';

async function checkRAM(): Promise<{ free_mb: number }> {
  try {
    const res = await fetch('http://localhost:3001/ram');
    const data = await res.json() as { free_mb: number };
    return data;
  } catch {
    return { free_mb: 200 }; // M1 8GB: safe default
  }
}

export async function omniRoute(prompt: string): Promise<string> {
  const cached = getCached(prompt);
  if (cached) return cached;

  const { free_mb } = await checkRAM();
  const forceShadow = free_mb < 300;
  const task = classifyTask(prompt);
  console.log(`[OMNI] RAM:${free_mb}MB task:${task} len:${prompt.length} shadow:${forceShadow}`);

  // Tier 1 — Gemini → Llama → StepFun
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

  // Tier 2 — Telegram Shadow Layer
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

  // Tier 3 — legacy fallbackCascade
  console.warn('[OMNI] ⚠️ Escalating to legacy fallbackCascade...');
  const { result } = await fallbackCascade(prompt);
  return result.text;
}

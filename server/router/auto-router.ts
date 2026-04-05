import { callWithFallback, callTelegramGPT, callTelegramDeepSeek } from './providers';
import { fallbackCascade } from './fallback';
import { getCached, setCached } from '../lib/semantic-cache';
import { isOpen, recordFailure, recordSuccess } from '../lib/circuit-breaker';
import { checkRAM } from '../lib/ram-guard';
import { classifyTask } from './classifier';

export async function omniRoute(prompt: string): Promise<string> {
  // 1. Semantic cache — zero tokens on repeats
  const cached = getCached(prompt);
  if (cached) return cached;

  // 2. RAM Guard — M1 critical mode
  const { free_mb } = await checkRAM();
  const forceShadow = free_mb < 300;
  const task = classifyTask(prompt);
  console.log(`[OMNI] RAM:${free_mb}MB task:${task} len:${prompt.length} shadow:${forceShadow}`);

  // 3. Tier 1 — inline fallback chain (Gemini → Groq → StepFun)
  if (!forceShadow && !isOpen('omni-t1')) {
    try {
      const text = await callWithFallback(prompt);
      recordSuccess('omni-t1');
      setCached(prompt, text);
      console.log('[OMNI] ✅ omni-t1');
      return text;
    } catch (err) {
      recordFailure('omni-t1');
      console.warn('[OMNI] ❌ omni-t1 → Telegram Shadow Layer');
    }
  }

  // 4. Tier 2 — Telegram Shadow Layer
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

  // 5. Tier 3 — legacy fallbackCascade from fallback.ts
  console.warn('[OMNI] ⚠️ Escalating to legacy fallbackCascade...');
  const { result } = await fallbackCascade(prompt);
  return result.text;
}

/**
 * SHADOW STACK: SURVIVAL CASCADE - LEVEL 2
 * Fallback Cascade and CostGuard (Quota Protection).
 * Provides Zero-Cost Routing and seamless provider switching.
 */

// In-memory usage tracker (CostGuard)
const usage: Record<string, { calls: number; limit: number }> = {
  ollama:      { calls: 0, limit: 99999 },
  openclaw:    { calls: 0, limit: 500 },
  openrouter:  { calls: 0, limit: 200 }
};

/**
 * Check if the provider has reached its 90% quota limit.
 * Blocks the provider before it fails, enabling graceful fallbacks.
 */
export function checkUsage(provider: string): boolean {
  const u = usage[provider];
  if (!u) return false;
  return (u.calls / u.limit) >= 0.90; // Block at 90% limit [9, 10]
}

// Mock provider logic - in real scenario, these import from providers.ts
const ollamaProvider = async (prompt: string) => ({ text: `Ollama response for: ${prompt}` });
const openClawProvider = async (prompt: string) => ({ text: `OpenClaw response for: ${prompt}` });
const openRouterProvider = async (prompt: string) => ({ text: `OpenRouter response for: ${prompt}` });

/**
 * Fallback Cascade - Execution path: Ollama -> OpenClaw -> OpenRouter.
 * Automatically transparently switches providers upon error or limit reached.
 */
export async function fallbackCascade(prompt: string) {
  const cascade = [
    { name: 'ollama',     fn: () => ollamaProvider(prompt) },
    { name: 'openclaw',   fn: () => openClawProvider(prompt) },
    { name: 'openrouter', fn: () => openRouterProvider(prompt) }
  ];

  for (const { name, fn } of cascade) {
    if (checkUsage(name)) {
      console.warn(`[CASCADE] ${name} reached 90% quota limit — skipping...`);
      continue;
    }
    
    try {
      console.log(`[CASCADE] Attempting provider: ${name}`);
      const result = await fn();
      
      // Update CostGuard status
      usage[name].calls++;
      return {
        provider: name,
        status: 'CASCADE_OK',
        result
      };
    } catch (err) {
      console.error(`[CASCADE] Provider ${name} failed during cascade:`, err);
    }
  }
  
  throw new Error('FATAL: All providers in the survival cascade have failed.');
}

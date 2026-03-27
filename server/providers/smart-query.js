// server/providers/smart-query.js — SmartQuery Integration
// Routes query through router engine → provider chain with fallback

import routerEngine from '../lib/router-engine.cjs';
import ollama from './ollama.js';
import groq from './groq.js';

const providers = { ollama, groq };

const PROVIDER_CHAIN = ['ollama', 'groq'];

async function smartQuery(prompt) {
  const route = routerEngine.smartQuery(prompt);
  const ordered = [route.provider, ...PROVIDER_CHAIN.filter(p => p !== route.provider)];

  let lastError = null;

  for (const providerName of ordered) {
    const provider = providers[providerName];
    if (!provider) continue;

    try {
      const result = await provider.query(prompt);
      if (!result.error) {
        return {
          ...result,
          provider: providerName,
          route,
        };
      }
      lastError = result.error;
    } catch (e) {
      lastError = e.message;
    }
  }

  return {
    text: '',
    model: '',
    tokens: 0,
    error: lastError || 'All providers failed',
    provider: null,
    route,
  };
}

export { smartQuery };
export default { smartQuery };

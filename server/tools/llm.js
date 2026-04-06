/**
 * LLM Tool — Unified provider interface for Orchestrator
 * Wraps ollama, groq, and openrouter with fallback chain
 */

import config from '../lib/config.cjs';
import logger from '../lib/logger.cjs';

const providers = new Map();

// Provider registration
export function registerProvider(name, provider) {
  providers.set(name, provider);
}

// Initialize built-in providers
import ollama from '../providers/ollama.js';
import groq from '../providers/groq.js';

registerProvider('ollama', ollama);
registerProvider('groq', groq);

/**
 * Execute LLM query with provider fallback
 * @param {object} input - { prompt, model?, provider? }
 * @returns {object} - { text, model, provider, tokens, latency_ms }
 */
export async function execute(input) {
  const { prompt, model, provider: preferredProvider } = input;

  if (!prompt || typeof prompt !== 'string') {
    throw new Error('LLM tool requires prompt (string)');
  }

  // If specific provider requested, try it first
  const providerOrder = preferredProvider
    ? [preferredProvider, ...Array.from(providers.keys()).filter(p => p !== preferredProvider)]
    : Array.from(providers.keys());

  let lastError = null;

  for (const providerName of providerOrder) {
    const provider = providers.get(providerName);
    if (!provider) continue;

    // Check if provider has required API key
    if (providerName === 'groq' && !config.GROQ_API_KEY) continue;

    const start = Date.now();
    try {
      const result = await provider.query(prompt, { model });
      const latency_ms = Date.now() - start;

      if (result.error) {
        lastError = result.error;
        logger.warn(`LLM provider ${providerName} returned error`, { error: result.error });
        continue; // Try next provider
      }

      return {
        text: result.text,
        model: result.model || model,
        provider: providerName,
        tokens: result.tokens || 0,
        latency_ms,
      };
    } catch (err) {
      lastError = err.message;
      logger.error(`LLM provider ${providerName} failed`, { error: err.message });
    }
  }

  throw new Error(`All LLM providers failed. Last error: ${lastError}`);
}

/**
 * Get health status of all providers
 */
export async function healthCheck() {
  const results = {};

  for (const [name, provider] of providers) {
    if (typeof provider.healthCheck === 'function') {
      results[name] = await provider.healthCheck();
    } else {
      results[name] = { online: false, latency: -1, note: 'no healthCheck method' };
    }
  }

  return results;
}

/**
 * Get stats from all providers
 */
export function getStats() {
  const stats = {};

  for (const [name, provider] of providers) {
    if (typeof provider.getStats === 'function') {
      stats[name] = provider.getStats();
    }
  }

  return stats;
}

export default { execute, healthCheck, getStats, registerProvider };

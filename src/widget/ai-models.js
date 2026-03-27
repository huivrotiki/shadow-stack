/**
 * AI Models Configuration inspired by models.dev
 * Standardized model classes for cost-efficiency.
 *
 * Extracted from shadow-stack-widget-1/lib/ai-models.ts
 * Converted to plain CommonJS (no TypeScript, no @ai-sdk imports).
 */

const AI_MODELS = [
  // --- OpenAI (paid) ---
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    tier: 'cheap',
    description: 'Extremely fast and cost-efficient for smaller tasks.',
    metrics: { costPer1M: 0.15, speed: 'fast' },
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    tier: 'default',
    description: 'High-performance model for complex reasoning and multimodal tasks.',
    metrics: { costPer1M: 5.00, speed: 'moderate' },
  },
  {
    id: 'o1-mini',
    name: 'o1 Mini',
    provider: 'openai',
    tier: 'high-quality',
    description: 'State-of-the-art reasoning for coding and deep logic.',
    metrics: { costPer1M: 3.00, speed: 'slow' },
  },
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'openai',
    tier: 'image',
    description: 'Advanced image generation model.',
    metrics: { costPerImage: 0.04, speed: 'slow' },
  },
  // --- Ollama (local, free) ---
  {
    id: 'qwen2.5-coder:3b',
    name: 'Qwen 2.5 Coder 3B',
    provider: 'ollama',
    tier: 'local-free',
    description: 'Fast local model for short tasks. ~2GB RAM.',
    metrics: { costPer1M: 0, speed: 'fast' },
  },
  {
    id: 'qwen2.5:7b',
    name: 'Qwen 2.5 7B',
    provider: 'ollama',
    tier: 'local-free',
    description: 'Local model for analysis and longer reasoning. ~4GB RAM.',
    metrics: { costPer1M: 0, speed: 'moderate' },
  },
  // --- OpenRouter (cloud, free tier) ---
  {
    id: 'qwen/qwen-2.5-coder-32b-instruct',
    name: 'Qwen 2.5 Coder 32B',
    provider: 'openrouter',
    tier: 'cloud-free',
    description: 'Free cloud model via OpenRouter for code tasks.',
    metrics: { costPer1M: 0, speed: 'moderate' },
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'openrouter',
    tier: 'cloud-free',
    description: 'Free cloud model via OpenRouter for general chat.',
    metrics: { costPer1M: 0, speed: 'moderate' },
  },
];

/**
 * Intelligent Router for Model Selection
 * Based on the task type (chat, code, image, logic).
 *
 * @param {'chat'|'code'|'image'|'logic'} task
 * @returns {string} model id
 */
function routeModelByTask(task) {
  switch (task) {
    case 'code':
      return 'o1-mini';
    case 'image':
      return 'dall-e-3';
    case 'logic':
      return 'gpt-4o';
    case 'chat':
    default:
      return 'gpt-4o-mini';
  }
}

module.exports = { AI_MODELS, routeModelByTask };

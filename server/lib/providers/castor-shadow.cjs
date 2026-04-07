// server/lib/providers/castor-shadow.cjs — Castor Ultimate Shadow Provider
// Auto model selection with full Shadow Ultimate Cascade (17 models)
// Primary → Fallback chain per task type across all providers
// Integrates with LLM Gateway (llm-gateway.cjs)

const CASTOR_ROUTING_TABLE = {
  reasoning: {
    chain: [
      { provider: 'omniroute', model: 'kr/claude-sonnet-4.5', limit: { rpm: 15, rph: 200 } },
      { provider: 'openrouter', model: 'qwen/qwen3.6-plus:free' },
      { provider: 'aimlapi', model: 'aiml-claude-sonnet' },
      { provider: 'openrouter', model: 'nvidia/nemotron-nano-12b:free' },
      { provider: 'openrouter', model: 'arcee-ai/trinity-large:free' },
      { provider: 'copilot', model: 'gpt-5.4' },
      { provider: 'copilot', model: 'claude-sonnet-4.6' },
      { provider: 'ollama', model: 'qwen2.5:7b' },
    ],
  },
  coding: {
    chain: [
      { provider: 'omniroute', model: 'kr/claude-sonnet-4.5', limit: { rpm: 15, rph: 200 } },
      { provider: 'copilot', model: 'gpt-5.3-codex' },
      { provider: 'openrouter', model: 'qwen/qwen3.6-plus:free' },
      { provider: 'aimlapi', model: 'aiml-claude-sonnet' },
      { provider: 'copilot', model: 'claude-sonnet-4.6' },
      { provider: 'copilot', model: 'gpt-5.4-mini' },
      { provider: 'openrouter', model: 'stepfun/step-3.5-flash:free' },
      { provider: 'ollama', model: 'qwen2.5-coder:3b' },
    ],
  },
  fast: {
    chain: [
      { provider: 'omniroute', model: 'kr/claude-haiku-4.5', limit: { rpm: 30, rph: 500 } },
      { provider: 'openrouter', model: 'stepfun/step-3.5-flash:free' },
      { provider: 'copilot', model: 'gpt-5.4-mini' },
      { provider: 'copilot', model: 'claude-haiku-4.5' },
      { provider: 'openrouter', model: 'minimax/minimax-m2.5:free' },
      { provider: 'ollama', model: 'llama3.2:3b' },
    ],
  },
  creative: {
    chain: [
      { provider: 'copilot', model: 'gpt-5.4' },
      { provider: 'openrouter', model: 'qwen/qwen3.6-plus:free' },
      { provider: 'openrouter', model: 'minimax/minimax-m2.5:free' },
      { provider: 'copilot', model: 'gemini-2.5-pro' },
      { provider: 'openrouter', model: 'stepfun/step-3.5-flash:free' },
      { provider: 'ollama', model: 'qwen2.5-coder:3b' },
    ],
  },
  translate: {
    chain: [
      { provider: 'openrouter', model: 'qwen/qwen3.6-plus:free' },
      { provider: 'copilot', model: 'gpt-5.4-mini' },
      { provider: 'openrouter', model: 'minimax/minimax-m2.5:free' },
      { provider: 'copilot', model: 'claude-haiku-4.5' },
      { provider: 'ollama', model: 'qwen2.5:7b' },
    ],
  },
  default: {
    chain: [
      { provider: 'openrouter', model: 'qwen/qwen3.6-plus:free' },
      { provider: 'copilot', model: 'gpt-5.4-mini' },
      { provider: 'openrouter', model: 'stepfun/step-3.5-flash:free' },
      { provider: 'copilot', model: 'claude-sonnet-4.6' },
      { provider: 'openrouter', model: 'nvidia/nemotron-nano-12b:free' },
      { provider: 'openrouter', model: 'arcee-ai/trinity-large:free' },
      { provider: 'openrouter', model: 'minimax/minimax-m2.5:free' },
      { provider: 'copilot', model: 'gpt-5.4' },
      { provider: 'copilot', model: 'gpt-5.3-codex' },
      { provider: 'copilot', model: 'claude-haiku-4.5' },
      { provider: 'copilot', model: 'claude-opus-4.6' },
      { provider: 'copilot', model: 'gemini-2.5-pro' },
      { provider: 'copilot', model: 'grok-code-fast-1' },
      { provider: 'ollama', model: 'qwen2.5-coder:3b' },
      { provider: 'ollama', model: 'qwen2.5:7b' },
      { provider: 'ollama', model: 'llama3.2:3b' },
    ],
  },
};

class CastorShadowProvider {
  constructor(gateway) {
    this.name = 'castor-ultimate-shadow';
    this.gateway = gateway;
  }

  async call(taskType, messages, context = {}) {
    const route = CASTOR_ROUTING_TABLE[taskType] ?? CASTOR_ROUTING_TABLE.default;
    const t0 = Date.now();
    const chain = route.chain;
    const primaryModel = chain[0]?.model || 'unknown';

    // Try each model in chain until success
    for (let i = 0; i < chain.length; i++) {
      const step = chain[i];
      try {
        const result = await this.gateway.ask(messages, {
          model: step.model,
          providerOrder: [step.provider],
          keepLast: 5,
        });
        return {
          ...result,
          provider: step.provider,
          castor_routed: true,
          castor_task_type: taskType,
          castor_primary_model: primaryModel,
          castor_fallback_used: i > 0,
          castor_fallback_index: i,
          castor_chain_length: chain.length,
          castor_latency_ms: Date.now() - t0,
        };
      } catch (err) {
        console.warn(`[Castor] Model ${i + 1}/${chain.length} ${step.provider}/${step.model} failed: ${err.message}`);
      }
    }

    throw new Error(`[Castor] All ${chain.length} models failed for task type: ${taskType}`);
  }

  getRoutingTable() {
    return CASTOR_ROUTING_TABLE;
  }
}

module.exports = { CastorShadowProvider, CASTOR_ROUTING_TABLE };

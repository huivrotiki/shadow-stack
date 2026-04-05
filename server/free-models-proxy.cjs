// server/free-models-proxy.cjs — Free Models Proxy + LLM Gateway
// Full architecture: Commander → Task Router → Gateway → Provider Layer
// Self-healing, auto-fallback, scoring, memory layer
// Port: 20129

const express = require('express');
const app = express();
const PORT = 20129;

app.use(express.json());

// ─── LLM Gateway Integration ─────────────────────────────────────────────────

const { LLMGateway, TaskRouter, ProviderScorer, MemoryLayer } = require('./lib/llm-gateway.cjs');
const { CastorShadowProvider } = require('./lib/providers/castor-shadow.cjs');

// API keys
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
const COPILOT_KEY    = process.env.GITHUB_TOKEN || '';
const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY || '';
const GROQ_KEY       = process.env.GROQ_API_KEY || '';
const MISTRAL_KEY    = process.env.MISTRAL_API_KEY || '';
const ZEN_KEY        = process.env.ZEN_API_KEY || '';
// Vercel AI Gateway: нужен Personal Access Token (vercel.com/account/settings/tokens)
// НЕ project token (vcp_) и НЕ CI token (vck_) — они OIDC-only
const VERCEL_GW_KEY  = process.env.AI_GATEWAY_API_KEY || process.env.AI_SDK_GATEWAY_KEY || '';

// Initialize Gateway with providers
const gateway = new LLMGateway({
  providers: [
    {
      id: 'openrouter',
      name: 'OpenRouter FREE',
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: OPENROUTER_KEY,
      timeout: 30000,
      modelMap: {
        'auto': 'qwen/qwen3.6-plus:free',
        'or-qwen3.6':    'qwen/qwen3.6-plus:free',
        'or-step-flash': 'stepfun/step-3.5-flash:free',
        'or-nemotron':   'nvidia/nemotron-nano-9b-v2:free',
        'or-nemotron120':'nvidia/nemotron-3-super-120b-a12b:free',
        'or-trinity':    'arcee-ai/trinity-large-preview:free',
        'or-minimax':    'minimax/minimax-m2.5:free',
        'or-llama70b':   'meta-llama/llama-3.3-70b-instruct:free',
        'or-llama3b':    'meta-llama/llama-3.2-3b-instruct:free',
        'or-gemma27b':   'google/gemma-3-27b-it:free',
        'or-gemma12b':   'google/gemma-3-12b-it:free',
        'or-qwen3coder': 'qwen/qwen3-coder:free',
        'or-gpt-oss120': 'openai/gpt-oss-120b:free',
        'or-gpt-oss20':  'openai/gpt-oss-20b:free',
        'or-glm4':       'z-ai/glm-4.5-air:free',
        // passthrough
        'qwen/qwen3.6-plus:free': 'qwen/qwen3.6-plus:free',
        'stepfun/step-3.5-flash:free': 'stepfun/step-3.5-flash:free',
        'meta-llama/llama-3.3-70b-instruct:free': 'meta-llama/llama-3.3-70b-instruct:free',
        'google/gemma-3-27b-it:free': 'google/gemma-3-27b-it:free',
      }
    },
    {
      id: 'copilot',
      name: 'GitHub Copilot',
      baseURL: 'https://api.githubcopilot.com',
      apiKey: COPILOT_KEY,
      timeout: 30000,
      modelMap: {
        'auto': 'gpt-5.4-mini',
        'copilot-gpt-5.4': 'gpt-5.4',
        'copilot-gpt-5.4-mini': 'gpt-5.4-mini',
        'copilot-gpt-5.3-codex': 'gpt-5.3-codex',
        'copilot-sonnet-4.6': 'claude-sonnet-4.6',
        'copilot-haiku-4.5': 'claude-haiku-4.5',
        'copilot-opus-4.6': 'claude-opus-4.6',
        'copilot-gemini-2.5-pro': 'gemini-2.5-pro',
        'copilot-grok-code-fast-1': 'grok-code-fast-1',
        // Castor routing table models
        'gpt-5.4': 'gpt-5.4',
        'gpt-5.4-mini': 'gpt-5.4-mini',
        'gpt-5.3-codex': 'gpt-5.3-codex',
        'claude-sonnet-4.6': 'claude-sonnet-4.6',
        'claude-haiku-4.5': 'claude-haiku-4.5',
        'claude-opus-4.6': 'claude-opus-4.6',
        'gemini-2.5-pro': 'gemini-2.5-pro',
        'grok-code-fast-1': 'grok-code-fast-1',
      }
    },
    {
      id: 'ollama',
      name: 'Ollama Local',
      baseURL: 'http://localhost:11434/v1',
      apiKey: 'ollama',
      timeout: 60000,
      modelMap: {
        'auto': 'qwen2.5-coder:3b',
        'ol-qwen2.5-coder':  'qwen2.5-coder:3b',
        'ol-qwen2.5':        'qwen2.5:7b',
        'ol-llama3.2':       'llama3.2:3b',
        'ol-gpt-oss20':      'gpt-oss:20b-cloud',
        'ol-deepseek-v3':    'deepseek-v3.1:671b-cloud',
        'ol-qwen3-coder':    'qwen3-coder:480b-cloud',
        'qwen2.5-coder:3b':  'qwen2.5-coder:3b',
        'qwen2.5:7b':        'qwen2.5:7b',
        'llama3.2:3b':       'llama3.2:3b',
        'gpt-oss:20b-cloud': 'gpt-oss:20b-cloud',
      }
    },
    {
      id: 'omniroute',
      name: 'OmniRoute (KiroAI)',
      baseURL: 'http://localhost:20130/v1',
      apiKey: process.env.OMNIROUTE_KEY || '',
      timeout: 25000,
      modelMap: {
        'omni-sonnet': 'kr/claude-sonnet-4.5',
        'omni-haiku':  'kr/claude-haiku-4.5',
      }
    },
    {
      id: 'vercel',
      name: 'Vercel AI Gateway',
      baseURL: 'https://ai-gateway.vercel.sh/v1',
      apiKey: VERCEL_GW_KEY,
      timeout: 30000,
      modelMap: {
        'vg-sonnet':      'anthropic/claude-sonnet-4.5',
        'vg-haiku':       'anthropic/claude-haiku-4.5',
        'vg-opus':        'anthropic/claude-opus-4.5',
        'vg-gpt4o':       'openai/gpt-4o',
        'vg-gpt4o-mini':  'openai/gpt-4.1-mini',
        'vg-gpt41':       'openai/gpt-4.1',
        'vg-gemini-flash':'google/gemini-2.5-flash',
        'vg-gemini-pro':  'google/gemini-2.5-pro',
        'vg-deepseek-v3': 'deepseek/deepseek-v3.1',
        'vg-deepseek-r1': 'deepseek/deepseek-r1',
        'vg-llama70b':    'meta/llama-3.3-70b-instruct',
        'vg-grok':        'xai/grok-4.1-fast-non-reasoning',
        'vg-qwen3':       'alibaba/qwen3.6-plus',
      }
    },
    {
      id: 'groq',
      name: 'Groq LPU',
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: GROQ_KEY,
      timeout: 10000,
      modelMap: {
        'gr-llama70b':  'llama-3.3-70b-versatile',
        'gr-llama8b':   'llama-3.1-8b-instant',
        'gr-qwen3':     'qwen/qwen3-32b',
        'gr-qwen3-32b': 'qwen/qwen3-32b',
        'gr-kimi-k2':   'moonshotai/kimi-k2-instruct',
        'gr-llama4':    'meta-llama/llama-4-scout-17b-16e-instruct',
        'gr-gpt-oss120':'openai/gpt-oss-120b',
        'gr-gpt-oss20': 'openai/gpt-oss-20b',
        'gr-compound':  'groq/compound',
      }
    },
    {
      id: 'mistral',
      name: 'Mistral AI',
      baseURL: 'https://api.mistral.ai/v1',
      apiKey: MISTRAL_KEY,
      timeout: 30000,
      modelMap: {
        'ms-small':   'mistral-small-latest',
        'ms-medium':  'mistral-medium-latest',
        'ms-large':   'mistral-large-latest',
        'ms-codestral': 'codestral-latest',
      }
    },
    {
      id: 'zen',
      name: 'ZenAI (OpenAI-compat)',
      baseURL: 'https://api.zenaix.com/v1',
      apiKey: ZEN_KEY,
      timeout: 30000,
      modelMap: {
        'zen-gpt4o':   'gpt-4o',
        'zen-gpt4o-mini': 'gpt-4o-mini',
        'zen-o3-mini': 'o3-mini',
      }
    },
    {
      id: 'anthropic',
      name: 'Anthropic Direct',
      baseURL: 'https://api.anthropic.com/v1',
      apiKey: ANTHROPIC_KEY,
      timeout: 30000,
      headers: { 'anthropic-version': '2023-06-01' },
      modelMap: {
        'ant-sonnet': 'claude-sonnet-4-5',
        'ant-haiku':  'claude-haiku-4-5',
      }
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      timeout: 30000,
      modelMap: {
        'ds-v3': 'deepseek-chat',
        'ds-r1': 'deepseek-reasoner',
      }
    },
    {
      id: 'gemini',
      name: 'Google AI Studio',
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
      apiKey: process.env.GEMINI_API_KEY || '',
      timeout: 30000,
      modelMap: {
        'gem-2.5-pro':   'gemini-2.5-pro',
        'gem-2.5-flash': 'gemini-2.5-flash',
      }
    },
    {
      id: 'alibaba',
      name: 'Alibaba Cloud AI',
      baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
      apiKey: process.env.ALIBABA_API_KEY || '',
      timeout: 30000,
      modelMap: {
        'ali-qwen-plus':  'qwen-plus',
        'ali-qwen-max':   'qwen-max',
        'ali-qwen-turbo': 'qwen-turbo',
      }
    },
    {
      id: 'huggingface',
      name: 'HuggingFace Router',
      baseURL: 'https://router.huggingface.co/v1',
      apiKey: process.env.HF_API_KEY || '',
      timeout: 60000,
      modelMap: {
        'hf-qwen72b':  'Qwen/Qwen2.5-72B-Instruct',
        'hf-llama8b':  'meta-llama/Llama-3.1-8B-Instruct',
        'hf-llama70b': 'meta-llama/Llama-3.3-70B-Instruct',
        'hf-qwen3':    'Qwen/Qwen3-8B',
        'hf-deepseek': 'deepseek-ai/DeepSeek-V3',
      }
    },
    {
      id: 'cerebras',
      name: 'Cerebras Fast',
      baseURL: 'https://api.cerebras.ai/v1',
      apiKey: process.env.CEREBRAS_API_KEY || '',
      timeout: 8000,
      modelMap: {
        'cb-llama70b': 'llama-3.3-70b',
        'cb-llama8b':  'llama-3.1-8b',
      }
    },
    {
      id: 'sambanova',
      name: 'SambaNova',
      baseURL: 'https://api.sambanova.ai/v1',
      apiKey: process.env.SAMBANOVA_API_KEY || '',
      timeout: 20000,
      modelMap: {
        'sn-llama70b':  'Meta-Llama-3.3-70B-Instruct',
        'sn-qwen72b':   'Qwen2.5-72B-Instruct',
        'sn-deepseek':  'DeepSeek-R1',
      }
    },
  ]
});

const taskRouter = new TaskRouter();
const scorer = new ProviderScorer();
const memory = new MemoryLayer();
const castor = new CastorShadowProvider(gateway);

// ─── Model Map (for backward compatibility) ──────────────────────────────────

const MODEL_MAP = {
  'auto': { provider: 'auto', model: 'auto', priority: 0, isRouter: true },
  'or-qwen3.6': { provider: 'openrouter', model: 'qwen/qwen3.6-plus:free', priority: 1 },
  'or-nemotron': { provider: 'openrouter', model: 'nvidia/nemotron-nano-12b:free', priority: 1 },
  'or-qwen3.6':    { provider: 'openrouter', model: 'qwen/qwen3.6-plus:free',                    priority: 1 },
  'or-step-flash': { provider: 'openrouter', model: 'stepfun/step-3.5-flash:free',               priority: 1 },
  'or-nemotron':   { provider: 'openrouter', model: 'nvidia/nemotron-nano-9b-v2:free',            priority: 1 },
  'or-nemotron120':{ provider: 'openrouter', model: 'nvidia/nemotron-3-super-120b-a12b:free',     priority: 1 },
  'or-trinity':    { provider: 'openrouter', model: 'arcee-ai/trinity-large-preview:free',        priority: 1 },
  'or-minimax':    { provider: 'openrouter', model: 'minimax/minimax-m2.5:free',                  priority: 1 },
  'or-llama70b':   { provider: 'openrouter', model: 'meta-llama/llama-3.3-70b-instruct:free',     priority: 1 },
  'or-llama3b':    { provider: 'openrouter', model: 'meta-llama/llama-3.2-3b-instruct:free',      priority: 1 },
  'or-gemma27b':   { provider: 'openrouter', model: 'google/gemma-3-27b-it:free',                 priority: 1 },
  'or-gemma12b':   { provider: 'openrouter', model: 'google/gemma-3-12b-it:free',                 priority: 1 },
  'or-qwen3coder': { provider: 'openrouter', model: 'qwen/qwen3-coder:free',                      priority: 1 },
  'or-gpt-oss120': { provider: 'openrouter', model: 'openai/gpt-oss-120b:free',                   priority: 1 },
  'or-gpt-oss20':  { provider: 'openrouter', model: 'openai/gpt-oss-20b:free',                    priority: 1 },
  'or-glm4':       { provider: 'openrouter', model: 'z-ai/glm-4.5-air:free',                      priority: 1 },
  'gr-llama70b':  { provider: 'groq',     model: 'llama-3.3-70b-versatile',                    priority: 1 },
  'gr-llama8b':   { provider: 'groq',     model: 'llama-3.1-8b-instant',                       priority: 1 },
  'gr-qwen3':     { provider: 'groq',     model: 'qwen/qwen3-32b',                             priority: 2 },
  'gr-qwen3-32b': { provider: 'groq',     model: 'qwen/qwen3-32b',                             priority: 1 },
  'gr-kimi-k2':   { provider: 'groq',     model: 'moonshotai/kimi-k2-instruct',                priority: 1 },
  'gr-llama4':    { provider: 'groq',     model: 'meta-llama/llama-4-scout-17b-16e-instruct',  priority: 1 },
  'gr-gpt-oss120':{ provider: 'groq',     model: 'openai/gpt-oss-120b',                        priority: 1 },
  'gr-gpt-oss20': { provider: 'groq',     model: 'openai/gpt-oss-20b',                         priority: 1 },
  'gr-compound':  { provider: 'groq',     model: 'groq/compound',                              priority: 1 },
  'ms-small':     { provider: 'mistral',  model: 'mistral-small-latest',             priority: 1 },
  'ms-medium':    { provider: 'mistral',  model: 'mistral-medium-latest',            priority: 1 },
  'ms-large':     { provider: 'mistral',  model: 'mistral-large-latest',             priority: 1 },
  'ms-codestral': { provider: 'mistral',  model: 'codestral-latest',                 priority: 1 },
  'zen-gpt4o':      { provider: 'zen',    model: 'gpt-4o',                           priority: 1 },
  'zen-gpt4o-mini': { provider: 'zen',    model: 'gpt-4o-mini',                      priority: 1 },
  'ds-v3':        { provider: 'deepseek', model: 'deepseek-chat',                    priority: 2 },
  'ds-r1':        { provider: 'deepseek', model: 'deepseek-reasoner',                priority: 2 },
  'gem-2.5-pro':  { provider: 'gemini',   model: 'gemini-2.5-pro',                   priority: 2 },
  'gem-2.5-flash':{ provider: 'gemini',   model: 'gemini-2.5-flash',                 priority: 2 },
  'hf-qwen72b':   { provider: 'huggingface', model: 'Qwen/Qwen2.5-72B-Instruct',              priority: 3 },
  'hf-llama8b':   { provider: 'huggingface', model: 'meta-llama/Llama-3.1-8B-Instruct',       priority: 3 },
  'hf-llama70b':  { provider: 'huggingface', model: 'meta-llama/Llama-3.3-70B-Instruct',      priority: 3 },
  'hf-qwen3':     { provider: 'huggingface', model: 'Qwen/Qwen3-8B',                          priority: 3 },
  'hf-deepseek':  { provider: 'huggingface', model: 'deepseek-ai/DeepSeek-V3',                priority: 3 },
  'ali-qwen-plus':  { provider: 'alibaba', model: 'qwen-plus',  priority: 3 },
  'ali-qwen-max':   { provider: 'alibaba', model: 'qwen-max',   priority: 3 },
  'ali-qwen-turbo': { provider: 'alibaba', model: 'qwen-turbo', priority: 3 },
  'cb-llama70b':  { provider: 'cerebras', model: 'llama-3.3-70b',                    priority: 2 },
  'sn-llama70b':  { provider: 'sambanova',model: 'Meta-Llama-3.3-70B-Instruct',      priority: 2 },
  'ol-qwen2.5-coder': { provider: 'ollama', model: 'qwen2.5-coder:3b',  priority: 3 },
  'ol-qwen2.5':       { provider: 'ollama', model: 'qwen2.5:7b',        priority: 3 },
  'ol-llama3.2':      { provider: 'ollama', model: 'llama3.2:3b',       priority: 3 },
  'ol-gpt-oss20':     { provider: 'ollama', model: 'gpt-oss:20b-cloud', priority: 2 },
  'ol-deepseek-v3':   { provider: 'ollama', model: 'deepseek-v3.1:671b-cloud', priority: 2 },
  'ol-qwen3-coder':   { provider: 'ollama', model: 'qwen3-coder:480b-cloud',   priority: 2 },
  'omni-sonnet': { provider: 'omniroute', model: 'kr/claude-sonnet-4.5', priority: 1 },
  'omni-haiku':  { provider: 'omniroute', model: 'kr/claude-haiku-4.5',  priority: 1 },
  'copilot-sonnet-4.6': { provider: 'copilot', model: 'claude-sonnet-4.6', priority: 1 },
  'copilot-haiku-4.5':  { provider: 'copilot', model: 'claude-haiku-4.5',  priority: 1 },
  'vg-sonnet':      { provider: 'vercel', model: 'anthropic/claude-sonnet-4.5', priority: 1 },
  'vg-haiku':       { provider: 'vercel', model: 'anthropic/claude-haiku-4.5',  priority: 1 },
  'vg-opus':        { provider: 'vercel', model: 'anthropic/claude-opus-4.5',   priority: 1 },
  'vg-gpt4o':       { provider: 'vercel', model: 'openai/gpt-4o',               priority: 1 },
  'vg-gpt4o-mini':  { provider: 'vercel', model: 'openai/gpt-4.1-mini',         priority: 1 },
  'vg-gpt41':       { provider: 'vercel', model: 'openai/gpt-4.1',              priority: 1 },
  'vg-gemini-flash':{ provider: 'vercel', model: 'google/gemini-2.5-flash',      priority: 1 },
  'vg-gemini-pro':  { provider: 'vercel', model: 'google/gemini-2.5-pro',        priority: 1 },
  'vg-deepseek-v3': { provider: 'vercel', model: 'deepseek/deepseek-v3.1',       priority: 1 },
  'vg-deepseek-r1': { provider: 'vercel', model: 'deepseek/deepseek-r1',         priority: 1 },
  'vg-llama70b':    { provider: 'vercel', model: 'meta/llama-3.3-70b-instruct',  priority: 1 },
  'vg-grok':        { provider: 'vercel', model: 'xai/grok-4.1-fast-non-reasoning', priority: 1 },
  'vg-qwen3':       { provider: 'vercel', model: 'alibaba/qwen3.6-plus',         priority: 1 },
  'ant-sonnet':  { provider: 'anthropic', model: 'claude-sonnet-4-5',    priority: 1 },
  'ant-haiku':   { provider: 'anthropic', model: 'claude-haiku-4-5',     priority: 1 },
};

const CASCADE_CHAIN = [
  // 'copilot-sonnet-4.6', // ❌ PAT not supported — needs OAuth token
  'omni-sonnet',        // Tier 1 — Claude Sonnet 4.5 via KiroAI (free)
  'gr-llama70b',        // Tier 2a — Groq LPU (fast, free)
  'cb-llama70b',        // Tier 2b — Cerebras (needs key)
  'ds-v3',              // Tier 2c — DeepSeek V3 (needs balance)
  'gem-2.5-flash',      // Tier 2d — Gemini 2.5 Flash
  'or-qwen3.6',         // Tier 2e — Qwen3.6 via OpenRouter (free)
  'sn-llama70b',        // Tier 3a — SambaNova (needs key)
  'hf-qwen72b',         // Tier 3b — HuggingFace Qwen72B
  'hf-llama70b',        // Tier 3c — HuggingFace Llama 70B
  'ol-qwen2.5-coder',   // Tier 4 — local fallback
];

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'free-models-proxy',
    port: PORT,
    models: Object.keys(MODEL_MAP).length,
    cascade: CASCADE_CHAIN,
    uptime: Math.round(process.uptime()) + 's',
  });
});

// Metrics endpoint — provider stats + daily limits
app.get('/metrics', (req, res) => {
  const stats = scorer.getStats ? scorer.getStats() : [];
  res.json({
    providers: stats,
    cascade: CASCADE_CHAIN,
    uptime: Math.round(process.uptime()) + 's',
    memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
  });
});

// Models list
app.get('/v1/models', (req, res) => {
  const models = Object.keys(MODEL_MAP).map(id => ({
    id,
    object: 'model',
    created: Date.now(),
    owned_by: 'free-models-proxy',
  }));
  res.json({ object: 'list', data: models });
});

// Chat completions — Gateway-powered
app.post('/v1/chat/completions', async (req, res) => {
  const { model, messages, stream = false } = req.body;

  // If model = "auto" — use full gateway with task routing + self-healing
  if (model === 'auto') {
    return handleGatewayRoute(req, res, messages, stream);
  }

  // Direct model call (backward compatibility)
  if (!model || !MODEL_MAP[model]) {
    return res.status(400).json({ error: `Model ${model} not found. Available: ${Object.keys(MODEL_MAP).join(', ')}` });
  }

  const config = MODEL_MAP[model];

  try {
    const result = await gateway.ask(messages, { model, keepLast: 5, providerOrder: [config.provider] });
    const text = result.text || result.choices?.[0]?.message?.content || '';
    const usage = result.usage;
    const actualModel = result.model || model;

    if (stream) {
      return writeSSE(res, { requestedModel: model, actualModel, text, usage, extra: { provider: result.provider } });
    }

    res.json({
      id: `gw-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model, // echo requested id so AI SDK schema matches
      choices: [{
        index: 0,
        message: { role: 'assistant', content: text },
        finish_reason: 'stop',
      }],
      usage,
      x_provider: result.provider,
      x_model: actualModel,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, x_provider: config.provider });
  }
});

// Gateway auto route — full architecture
async function handleGatewayRoute(req, res, messages, stream) {
  try {
    const result = await gateway.ask(messages, { model: 'auto', keepLast: 5 });
    const text = result.text || '';
    const usage = result.usage;
    const requestedModel = req.body.model || 'auto';
    const actualModel = result.model;

    if (stream) {
      return writeSSE(res, {
        requestedModel,
        actualModel,
        text,
        usage,
        extra: {
          provider: result.provider,
          auto_route: true,
          route_category: result.taskType,
          latency_ms: result.latency,
          total_time_ms: result.totalTime,
          attempts: result.attempts,
        },
      });
    }

    res.json({
      id: `gw-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: requestedModel, // echo requested id (was result.model — broke AI SDK schema)
      choices: [{
        index: 0,
        message: { role: 'assistant', content: text },
        finish_reason: 'stop',
      }],
      usage,
      x_provider: result.provider,
      x_model: actualModel,
      x_auto_route: true,
      x_route_category: result.taskType,
      x_latency_ms: result.latency,
      x_total_time_ms: result.totalTime,
      x_attempts: result.attempts,
    });
  } catch (err) {
    res.status(503).json({ error: err.message, x_auto_route: true });
  }
}

// SSE writer for AI SDK / openai-compatible clients.
// They always call doStream() and parse text/event-stream, so any model used
// from opencode's shadow provider must support this code path.
function writeSSE(res, { requestedModel, actualModel, text, usage, extra = {} }) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const id = `gw-${Date.now()}`;
  const created = Math.floor(Date.now() / 1000);

  // chunk 1 — role + full content (we do not truly stream tokens yet)
  res.write('data: ' + JSON.stringify({
    id,
    object: 'chat.completion.chunk',
    created,
    model: requestedModel,
    choices: [{ index: 0, delta: { role: 'assistant', content: text }, finish_reason: null }],
    x_model: actualModel,
    ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [`x_${k}`, v])),
  }) + '\n\n');

  // chunk 2 — finish + usage
  res.write('data: ' + JSON.stringify({
    id,
    object: 'chat.completion.chunk',
    created,
    model: requestedModel,
    choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
    usage,
  }) + '\n\n');

  res.write('data: [DONE]\n\n');
  res.end();
}

// ─── Gateway Management Endpoints ─────────────────────────────────────────────

// Provider stats + scoring
app.get('/gateway/stats', (req, res) => {
  res.json({
    ok: true,
    providers: gateway.getStats(),
    taskRouter: {
      types: ['reasoning', 'coding', 'fast', 'creative', 'translate', 'chat'],
    },
  });
});

// Memory layer
app.get('/gateway/memory', (req, res) => {
  const project = req.query.project || 'default';
  const limit = parseInt(req.query.limit) || 5;
  res.json({
    ok: true,
    project,
    memory: gateway.getMemory(project, limit),
  });
});

// Add decision to memory
app.post('/gateway/memory', (req, res) => {
  const { project, decision } = req.body;
  if (!project || !decision) {
    return res.status(400).json({ error: 'project and decision required' });
  }
  memory.addDecision(project, decision);
  res.json({ ok: true, project, decision });
});

// Task classification test
app.post('/gateway/classify', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  const task = taskRouter.classify(text);
  const providerOrder = taskRouter.getProviderOrder(task.type, scorer);
  res.json({
    ok: true,
    task,
    providerOrder,
    scores: scorer.getRankedProviders(['copilot', 'groq', 'cerebras', 'deepseek', 'gemini', 'openrouter', 'sambanova', 'huggingface', 'ollama']),
  });
});

// ─── Castor Ultimate Shadow Provider Endpoint ─────────────────────────────────

app.post('/gateway/castor', async (req, res) => {
  const { instruction, task_type, context = {}, messages } = req.body;
  
  // Build messages from instruction if not provided
  const msgs = messages || [{ role: 'user', content: instruction }];
  if (!instruction && !messages) {
    return res.status(400).json({ error: 'instruction or messages required' });
  }
  
  try {
    const taskType = task_type || taskRouter.classify(JSON.stringify(msgs)).type;
    const result = await castor.call(taskType, msgs, context);
    
    // Ralph Loop scoring
    const successRate = result.text ? 1 : 0;
    const latency = result.castor_latency_ms || result.latency || 30000;
    const speedScore = latency < 5000 ? 1.0 : latency < 15000 ? 0.7 : latency < 30000 ? 0.4 : 0.1;
    const score = (successRate * 0.6) + (speedScore * 0.3) - (result.castor_fallback_used ? 0.1 : 0);
    
    // Memory write
    memory.addConversation(msgs, result.text);
    
    res.json({
      task_id: `castor-${Date.now()}`,
      status: result.castor_fallback_used ? 'partial' : 'success',
      output: {
        text: result.text,
      },
      score: Math.round(score * 100) / 100,
      model_used: result.model,
      castor_meta: {
        task_type: result.castor_task_type,
        primary_model: result.castor_primary_model,
        fallback_used: result.castor_fallback_used,
        latency_ms: result.castor_latency_ms,
      },
      retry_suggested: score < 0.8,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, castor_meta: { task_type: task_type || 'unknown' } });
  }
});

// Castor routing table info
app.get('/gateway/castor', (req, res) => {
  res.json({
    ok: true,
    provider: castor.name,
    routing: castor.getRoutingTable(),
  });
});

app.listen(PORT, () => {
  console.log(`[free-models-proxy] Running on http://localhost:${PORT}`);
  console.log(`[free-models-proxy] Available models: ${Object.keys(MODEL_MAP).length}`);
  console.log(`[free-models-proxy] Cascade chain: ${CASCADE_CHAIN.join(' -> ')}`);
});

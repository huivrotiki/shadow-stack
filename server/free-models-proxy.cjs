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
const COPILOT_KEY = process.env.GITHUB_TOKEN || '';

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
        'or-qwen3.6': 'qwen/qwen3.6-plus:free',
        'or-step-flash': 'stepfun/step-3.5-flash:free',
        'or-nemotron': 'nvidia/nemotron-nano-12b:free',
        'or-trinity': 'arcee-ai/trinity-large:free',
        'or-minimax': 'minimax/minimax-m2.5:free',
        // Castor routing table models
        'qwen/qwen3.6-plus:free': 'qwen/qwen3.6-plus:free',
        'stepfun/step-3.5-flash:free': 'stepfun/step-3.5-flash:free',
        'nvidia/nemotron-nano-12b:free': 'nvidia/nemotron-nano-12b:free',
        'arcee-ai/trinity-large:free': 'arcee-ai/trinity-large:free',
        'minimax/minimax-m2.5:free': 'minimax/minimax-m2.5:free',
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
        'ol-qwen2.5-coder': 'qwen2.5-coder:3b',
        'ol-qwen2.5': 'qwen2.5:7b',
        'ol-llama3.2': 'llama3.2:3b',
        // Castor routing table models
        'qwen2.5-coder:3b': 'qwen2.5-coder:3b',
        'qwen2.5:7b': 'qwen2.5:7b',
        'llama3.2:3b': 'llama3.2:3b',
      }
    },
    {
      id: 'omniroute',
      name: 'OmniRoute (KiroAI)',
      baseURL: 'http://localhost:20130/v1',
      apiKey: process.env.OMNIROUTE_KEY || '',
      timeout: 15000,
      modelMap: {
        'omni-sonnet': 'kr/claude-sonnet-4.5',
        'omni-haiku':  'kr/claude-haiku-4.5',
      }
    },
    {
      id: 'groq',
      name: 'Groq LPU',
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: process.env.GROQ_API_KEY || '',
      timeout: 10000,
      modelMap: {
        'gr-llama70b':  'llama-3.3-70b-versatile',
        'gr-kimi-k2':   'moonshotai/kimi-k2-instruct',
        'gr-qwen3-32b': 'qwen-qwen3-32b',
        'gr-deepseek':  'deepseek-r1-distill-llama-70b',
        'gr-cerebras':  'llama-3.3-70b-specdec',
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
      id: 'huggingface',
      name: 'HuggingFace Inference',
      baseURL: 'https://api-inference.huggingface.co/v1',
      apiKey: process.env.HF_API_KEY || '',
      timeout: 60000,
      modelMap: {
        'hf-qwen72b':  'Qwen/Qwen2.5-72B-Instruct',
        'hf-llama8b':  'meta-llama/Meta-Llama-3.1-8B-Instruct',
        'hf-mistral':  'mistralai/Mistral-7B-Instruct-v0.3',
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
  'or-trinity': { provider: 'openrouter', model: 'arcee-ai/trinity-large:free', priority: 1 },
  'or-minimax': { provider: 'openrouter', model: 'minimax/minimax-m2.5:free', priority: 1 },
  'or-step-flash': { provider: 'openrouter', model: 'stepfun/step-3.5-flash:free', priority: 1 },
  'copilot-gpt-5.4': { provider: 'copilot', model: 'gpt-5.4', priority: 2 },
  'copilot-gpt-5.4-mini': { provider: 'copilot', model: 'gpt-5.4-mini', priority: 2 },
  'copilot-gpt-5.3-codex': { provider: 'copilot', model: 'gpt-5.3-codex', priority: 2 },
  'copilot-sonnet-4.6': { provider: 'copilot', model: 'claude-sonnet-4.6', priority: 2 },
  'copilot-haiku-4.5': { provider: 'copilot', model: 'claude-haiku-4.5', priority: 2 },
  'copilot-opus-4.6': { provider: 'copilot', model: 'claude-opus-4.6', priority: 2 },
  'copilot-gemini-2.5-pro': { provider: 'copilot', model: 'gemini-2.5-pro', priority: 2 },
  'copilot-grok-code-fast-1': { provider: 'copilot', model: 'grok-code-fast-1', priority: 2 },
  'gr-llama70b':  { provider: 'groq',        model: 'llama-3.3-70b-versatile',              priority: 2 },
  'gr-kimi-k2':   { provider: 'groq',        model: 'moonshotai/kimi-k2-instruct',           priority: 2 },
  'gr-qwen3-32b': { provider: 'groq',        model: 'qwen-qwen3-32b',                        priority: 2 },
  'gr-deepseek':  { provider: 'groq',        model: 'deepseek-r1-distill-llama-70b',         priority: 2 },
  'ds-v3':        { provider: 'deepseek',    model: 'deepseek-chat',                         priority: 2 },
  'ds-r1':        { provider: 'deepseek',    model: 'deepseek-reasoner',                     priority: 2 },
  'gem-2.5-pro':  { provider: 'gemini',      model: 'gemini-2.5-pro',                        priority: 2 },
  'gem-2.5-flash':{ provider: 'gemini',      model: 'gemini-2.5-flash',                      priority: 2 },
  'hf-qwen72b':   { provider: 'huggingface', model: 'Qwen/Qwen2.5-72B-Instruct',             priority: 3 },
  'hf-llama8b':   { provider: 'huggingface', model: 'meta-llama/Meta-Llama-3.1-8B-Instruct', priority: 3 },
  'hf-mistral':   { provider: 'huggingface', model: 'mistralai/Mistral-7B-Instruct-v0.3',    priority: 3 },
  'cb-llama70b':  { provider: 'cerebras',    model: 'llama-3.3-70b',                         priority: 2 },
  'cb-llama8b':   { provider: 'cerebras',    model: 'llama-3.1-8b',                          priority: 2 },
  'sn-llama70b':  { provider: 'sambanova',   model: 'Meta-Llama-3.3-70B-Instruct',           priority: 2 },
  'sn-qwen72b':   { provider: 'sambanova',   model: 'Qwen2.5-72B-Instruct',                  priority: 2 },
  'sn-deepseek':  { provider: 'sambanova',   model: 'DeepSeek-R1',                           priority: 2 },
  'ol-qwen2.5-coder': { provider: 'ollama', model: 'qwen2.5-coder:3b', priority: 3 },
  'ol-qwen2.5': { provider: 'ollama', model: 'qwen2.5:7b', priority: 3 },
  'ol-llama3.2': { provider: 'ollama', model: 'llama3.2:3b', priority: 3 },
  'omni-sonnet': { provider: 'omniroute', model: 'kr/claude-sonnet-4.5', priority: 1 },
  'omni-haiku':  { provider: 'omniroute', model: 'kr/claude-haiku-4.5',  priority: 1 },
};

const CASCADE_CHAIN = [
  'omni-sonnet',          // Tier 1 — Claude Sonnet 4.5 бесплатно через OmniRoute :20130
  'gr-llama70b',          // Tier 2a — Groq (быстрый)
  'cb-llama70b',          // Tier 2b — Cerebras (сверхбыстрый)
  'ds-v3',                // Tier 2c — DeepSeek V3
  'gem-2.5-flash',        // Tier 2d — Gemini flash
  'or-qwen3.6',           // Tier 2e — OpenRouter
  'sn-llama70b',          // Tier 3a — SambaNova
  'hf-qwen72b',           // Tier 3b — HuggingFace (медленный)
  'ol-qwen2.5-coder',     // Tier 4 — только локально RAM>500
];

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'free-models-proxy',
    port: PORT,
    models: Object.keys(MODEL_MAP),
    cascade: CASCADE_CHAIN,
    architecture: 'Commander → Task Router → Gateway → Provider Layer',
    providers: ['omniroute', 'groq', 'cerebras', 'deepseek', 'gemini', 'openrouter', 'sambanova', 'huggingface', 'ollama'],
    selfHealing: true,
    memory: true,
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

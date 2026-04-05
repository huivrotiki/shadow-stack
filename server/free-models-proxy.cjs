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
      }
    },
  ]
});

const taskRouter = new TaskRouter();
const scorer = new ProviderScorer();
const memory = new MemoryLayer();

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
  'ol-qwen2.5-coder': { provider: 'ollama', model: 'qwen2.5-coder:3b', priority: 3 },
  'ol-qwen2.5': { provider: 'ollama', model: 'qwen2.5:7b', priority: 3 },
  'ol-llama3.2': { provider: 'ollama', model: 'llama3.2:3b', priority: 3 },
};

const CASCADE_CHAIN = ['or-qwen3.6', 'copilot-gpt-5.4-mini', 'or-step-flash', 'copilot-gpt-5.3-codex', 'ol-qwen2.5-coder', 'ol-llama3.2'];

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'free-models-proxy',
    port: PORT,
    models: Object.keys(MODEL_MAP),
    cascade: CASCADE_CHAIN,
    architecture: 'Commander → Task Router → Gateway → Provider Layer',
    providers: ['openrouter', 'copilot', 'ollama'],
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
    const result = await gateway.ask(messages, { model, keepLast: 5 });
    res.json({
      ...result,
      x_provider: result.provider,
      x_model: result.model,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, x_provider: config.provider });
  }
});

// Gateway auto route — full architecture
async function handleGatewayRoute(req, res, messages, stream) {
  try {
    const result = await gateway.ask(messages, { model: 'auto', keepLast: 5 });
    
    // Add gateway metadata
    res.json({
      id: `gw-${Date.now()}`,
      object: 'chat.completion',
      created: Date.now(),
      model: result.model,
      choices: [{
        index: 0,
        message: { role: 'assistant', content: result.text },
        finish_reason: 'stop',
      }],
      usage: result.usage,
      x_provider: result.provider,
      x_model: result.model,
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
    scores: scorer.getRankedProviders(['openrouter', 'copilot', 'ollama']),
  });
});

app.listen(PORT, () => {
  console.log(`[free-models-proxy] Running on http://localhost:${PORT}`);
  console.log(`[free-models-proxy] Available models: ${Object.keys(MODEL_MAP).length}`);
  console.log(`[free-models-proxy] Cascade chain: ${CASCADE_CHAIN.join(' -> ')}`);
});

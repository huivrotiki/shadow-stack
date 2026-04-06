// server/free-models-proxy.cjs — Free Models Proxy + LLM Gateway
// Full architecture: Commander → Task Router → Gateway → Provider Layer
// Self-healing, auto-fallback, scoring, memory layer
// Port: 20130

const express = require('express');
const app = express();
const PORT = 20130;

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
// OpenCode Zen — премиум gateway с Claude Opus 4.6, Sonnet 4.6, GPT 5.4 Pro, Gemini 3.1 Pro
const ZEN_KEY        = process.env.OPENCODE_ZEN_KEY || process.env.ZEN_API_KEY || '';
const OPENAI_KEY     = process.env.OPENAI_API_KEY || '';
// NVIDIA NIM — 5000 free credits, no card required (build.nvidia.com)
const NVIDIA_KEY     = process.env.NVIDIA_API_KEY || '';
// Together AI — $5 free credit on signup (api.together.xyz)
const TOGETHER_KEY   = process.env.TOGETHER_API_KEY || '';
// Fireworks AI — $1 daily credit (fireworks.ai)
const FIREWORKS_KEY  = process.env.FIREWORKS_API_KEY || '';
// Cloudflare Workers AI — 10K neurons/day free (needs CF_ACCOUNT_ID in URL)
const CF_TOKEN       = process.env.CF_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN || '';
const CF_ACCOUNT_ID  = process.env.CF_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || '';
// Cohere — Command R+ trial (api.cohere.com/compatibility/v1 = OpenAI-compat)
const COHERE_KEY     = process.env.COHERE_API_KEY || '';
// AI/ML API — unified gateway (api.aimlapi.com)
const AIMLAPI_KEY    = process.env.AIMLAPI_KEY || process.env.AIML_API_KEY || '';
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
      name: 'OpenCode Zen',
      baseURL: 'https://opencode.ai/zen/v1',
      apiKey: ZEN_KEY,
      timeout: 30000,
      modelMap: {
        // Anthropic via OpenCode Zen
        'zen-opus':       'claude-opus-4-6',
        'zen-sonnet':     'claude-sonnet-4-6',
        'zen-sonnet-4-5': 'claude-sonnet-4-5',
        'zen-haiku':      'claude-haiku-4-5',
        // OpenAI via OpenCode Zen
        'zen-gpt5':       'gpt-5.4',
        'zen-gpt5-pro':   'gpt-5.4-pro',
        'zen-gpt5-mini':  'gpt-5.4-mini',
        'zen-gpt5-nano':  'gpt-5.4-nano',
        'zen-codex':      'gpt-5.3-codex',
        'zen-codex-spark':'gpt-5.3-codex-spark',
        // Google via OpenCode Zen
        'zen-gemini-pro':   'gemini-3.1-pro',
        'zen-gemini-flash': 'gemini-3-flash',
      }
    },
    {
      id: 'nvidia',
      name: 'NVIDIA NIM',
      baseURL: 'https://integrate.api.nvidia.com/v1',
      apiKey: NVIDIA_KEY,
      timeout: 30000,
      modelMap: {
        'nv-deepseek-r1':  'deepseek-ai/deepseek-r1',
        'nv-deepseek-v3':  'deepseek-ai/deepseek-v3.1',
        'nv-llama70b':     'meta/llama-3.3-70b-instruct',
        'nv-llama405b':    'meta/llama-3.1-405b-instruct',
        'nv-nemotron':     'nvidia/llama-3.1-nemotron-70b-instruct',
        'nv-qwen-coder':   'qwen/qwen2.5-coder-32b-instruct',
      }
    },
    {
      id: 'together',
      name: 'Together AI',
      baseURL: 'https://api.together.xyz/v1',
      apiKey: TOGETHER_KEY,
      timeout: 30000,
      modelMap: {
        'tg-llama70b':    'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        'tg-llama405b':   'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
        'tg-qwen-coder':  'Qwen/Qwen2.5-Coder-32B-Instruct',
        'tg-deepseek-v3': 'deepseek-ai/DeepSeek-V3',
        'tg-deepseek-r1': 'deepseek-ai/DeepSeek-R1',
        'tg-mixtral':     'mistralai/Mixtral-8x22B-Instruct-v0.1',
      }
    },
    {
      id: 'fireworks',
      name: 'Fireworks AI',
      baseURL: 'https://api.fireworks.ai/inference/v1',
      apiKey: FIREWORKS_KEY,
      timeout: 30000,
      modelMap: {
        'fw-llama70b':     'accounts/fireworks/models/llama-v3p3-70b-instruct',
        'fw-llama405b':    'accounts/fireworks/models/llama-v3p1-405b-instruct',
        'fw-deepseek-v3':  'accounts/fireworks/models/deepseek-v3',
        'fw-deepseek-r1':  'accounts/fireworks/models/deepseek-r1',
        'fw-qwen-coder':   'accounts/fireworks/models/qwen2p5-coder-32b-instruct',
      }
    },
    {
      id: 'cloudflare',
      name: 'Cloudflare Workers AI',
      baseURL: CF_ACCOUNT_ID ? `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/v1` : '',
      apiKey: CF_TOKEN,
      timeout: 20000,
      modelMap: {
        'cf-llama70b':    '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
        'cf-llama8b':     '@cf/meta/llama-3.1-8b-instruct',
        'cf-deepseek':    '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
        'cf-qwen-coder':  '@cf/qwen/qwen2.5-coder-32b-instruct',
        'cf-mistral':     '@cf/mistralai/mistral-small-3.1-24b-instruct',
      }
    },
    {
      id: 'cohere',
      name: 'Cohere',
      baseURL: 'https://api.cohere.com/compatibility/v1',
      apiKey: COHERE_KEY,
      timeout: 30000,
      modelMap: {
        'co-command-r-plus': 'command-r-plus-08-2024',
        'co-command-r':      'command-r-08-2024',
        'co-command-a':      'command-a-03-2025',
      }
    },
    {
      id: 'aimlapi',
      name: 'AI/ML API',
      baseURL: 'https://api.aimlapi.com/v1',
      apiKey: AIMLAPI_KEY,
      timeout: 30000,
      modelMap: {
        'aiml-gpt4o':       'gpt-4o',
        'aiml-claude-sonnet':'claude-3-5-sonnet-20241022',
        'aiml-llama405b':   'meta-llama/Llama-3.1-405B-Instruct-Turbo',
        'aiml-deepseek-v3': 'deepseek-chat',
      }
    },
    {
      id: 'openai',
      name: 'OpenAI Direct',
      baseURL: 'https://api.openai.com/v1',
      apiKey: OPENAI_KEY,
      timeout: 30000,
      modelMap: {
        'oa-gpt5':       'gpt-5.4',
        'oa-gpt5-mini':  'gpt-5.4-mini',
        'oa-gpt4o':      'gpt-4o',
        'oa-gpt4o-mini': 'gpt-4o-mini',
        'oa-o3-mini':    'o3-mini',
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
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
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
        'cb-llama70b': 'llama3.1-8b',
        'cb-llama8b':  'llama3.1-8b',
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
  // OpenCode Zen — premium gateway (Claude Opus/Sonnet, GPT 5.4 Pro, Gemini 3.1)
  'zen-opus':         { provider: 'zen', model: 'claude-opus-4-6',    priority: 0 },
  'zen-sonnet':       { provider: 'zen', model: 'claude-sonnet-4-6',  priority: 0 },
  'zen-sonnet-4-5':   { provider: 'zen', model: 'claude-sonnet-4-5',  priority: 0 },
  'zen-haiku':        { provider: 'zen', model: 'claude-haiku-4-5',   priority: 0 },
  'zen-gpt5':         { provider: 'zen', model: 'gpt-5.4',            priority: 0 },
  'zen-gpt5-pro':     { provider: 'zen', model: 'gpt-5.4-pro',        priority: 0 },
  'zen-gpt5-mini':    { provider: 'zen', model: 'gpt-5.4-mini',       priority: 0 },
  'zen-gpt5-nano':    { provider: 'zen', model: 'gpt-5.4-nano',       priority: 0 },
  'zen-codex':        { provider: 'zen', model: 'gpt-5.3-codex',      priority: 0 },
  'zen-codex-spark':  { provider: 'zen', model: 'gpt-5.3-codex-spark',priority: 0 },
  'zen-gemini-pro':   { provider: 'zen', model: 'gemini-3.1-pro',     priority: 0 },
  'zen-gemini-flash': { provider: 'zen', model: 'gemini-3-flash',     priority: 0 },
  // Together AI — $5 signup credit
  'tg-llama70b':    { provider: 'together', model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',       priority: 1 },
  'tg-llama405b':   { provider: 'together', model: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', priority: 1 },
  'tg-qwen-coder':  { provider: 'together', model: 'Qwen/Qwen2.5-Coder-32B-Instruct',               priority: 1 },
  'tg-deepseek-v3': { provider: 'together', model: 'deepseek-ai/DeepSeek-V3',                       priority: 1 },
  'tg-deepseek-r1': { provider: 'together', model: 'deepseek-ai/DeepSeek-R1',                       priority: 1 },
  'tg-mixtral':     { provider: 'together', model: 'mistralai/Mixtral-8x22B-Instruct-v0.1',         priority: 1 },
  // Fireworks AI — $1 daily credit
  'fw-llama70b':    { provider: 'fireworks', model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',      priority: 1 },
  'fw-llama405b':   { provider: 'fireworks', model: 'accounts/fireworks/models/llama-v3p1-405b-instruct',     priority: 1 },
  'fw-deepseek-v3': { provider: 'fireworks', model: 'accounts/fireworks/models/deepseek-v3',                  priority: 1 },
  'fw-deepseek-r1': { provider: 'fireworks', model: 'accounts/fireworks/models/deepseek-r1',                  priority: 1 },
  'fw-qwen-coder':  { provider: 'fireworks', model: 'accounts/fireworks/models/qwen2p5-coder-32b-instruct',   priority: 1 },
  // Cloudflare Workers AI — 10K neurons/day
  'cf-llama70b':   { provider: 'cloudflare', model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',            priority: 2 },
  'cf-llama8b':    { provider: 'cloudflare', model: '@cf/meta/llama-3.1-8b-instruct',                     priority: 2 },
  'cf-deepseek':   { provider: 'cloudflare', model: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',       priority: 2 },
  'cf-qwen-coder': { provider: 'cloudflare', model: '@cf/qwen/qwen2.5-coder-32b-instruct',                priority: 2 },
  'cf-mistral':    { provider: 'cloudflare', model: '@cf/mistralai/mistral-small-3.1-24b-instruct',       priority: 2 },
  // Cohere — Command R+ trial
  'co-command-r-plus': { provider: 'cohere', model: 'command-r-plus-08-2024', priority: 1 },
  'co-command-r':      { provider: 'cohere', model: 'command-r-08-2024',      priority: 1 },
  'co-command-a':      { provider: 'cohere', model: 'command-a-03-2025',      priority: 1 },
  // AI/ML API — unified gateway
  'aiml-gpt4o':        { provider: 'aimlapi', model: 'gpt-4o',                                    priority: 1 },
  'aiml-claude-sonnet':{ provider: 'aimlapi', model: 'claude-3-5-sonnet-20241022',                priority: 1 },
  'aiml-llama405b':    { provider: 'aimlapi', model: 'meta-llama/Llama-3.1-405B-Instruct-Turbo', priority: 1 },
  'aiml-deepseek-v3':  { provider: 'aimlapi', model: 'deepseek-chat',                             priority: 1 },
  // NVIDIA NIM — 5000 free credits
  'nv-deepseek-r1': { provider: 'nvidia', model: 'deepseek-ai/deepseek-r1',                 priority: 0 },
  'nv-deepseek-v3': { provider: 'nvidia', model: 'deepseek-ai/deepseek-v3.1',               priority: 0 },
  'nv-llama70b':    { provider: 'nvidia', model: 'meta/llama-3.3-70b-instruct',             priority: 0 },
  'nv-llama405b':   { provider: 'nvidia', model: 'meta/llama-3.1-405b-instruct',            priority: 0 },
  'nv-nemotron':    { provider: 'nvidia', model: 'nvidia/llama-3.1-nemotron-70b-instruct',  priority: 0 },
  'nv-qwen-coder':  { provider: 'nvidia', model: 'qwen/qwen2.5-coder-32b-instruct',         priority: 0 },
  // OpenAI Direct
  'oa-gpt5':       { provider: 'openai', model: 'gpt-5.4',       priority: 0 },
  'oa-gpt5-mini':  { provider: 'openai', model: 'gpt-5.4-mini',  priority: 0 },
  'oa-gpt4o':      { provider: 'openai', model: 'gpt-4o',        priority: 0 },
  'oa-gpt4o-mini': { provider: 'openai', model: 'gpt-4o-mini',   priority: 0 },
  'oa-o3-mini':    { provider: 'openai', model: 'o3-mini',       priority: 0 },
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
  'omni-sonnet',        // Tier 1  — Claude Sonnet 4.5 via KiroAI (free)
  'gr-llama70b',        // Tier 2a — Groq LPU (fast, free)
  'gr-qwen3-32b',       // Tier 2b — Groq Qwen3 32B (fast, free)
  'cb-llama70b',        // Tier 2c — Cerebras llama3.1-8b (fast)
  'gem-2.5-flash',      // Tier 2d — Gemini 2.5 Flash (free tier)
  'ms-small',           // Tier 2e — Mistral Small (free tier, 302ms)
  'or-nemotron',        // Tier 2f — NVIDIA Nemotron via OpenRouter (696ms, free)
  'sn-llama70b',        // Tier 2g — SambaNova Llama 70B (fast, free)
  'or-step-flash',      // Tier 2g — StepFun Flash via OpenRouter (free)
  'hf-llama8b',         // Tier 3a — HuggingFace Llama 8B
  'nv-llama70b',        // Tier 3b — NVIDIA NIM Llama 70B (free)
  'fw-llama70b',        // Tier 3c — Fireworks Llama 70B
  'co-command-r',       // Tier 3d — Cohere Command R (free tier)
  'hf-qwen72b',         // Tier 3e — HuggingFace Qwen72B
  'hf-llama70b',        // Tier 3c — HuggingFace Llama 70B
  'ol-qwen2.5-coder',   // Tier 4  — local fallback
  // 'ds-v3',           // ❌ DeepSeek V3 — insufficient balance
  // 'sn-llama70b',     // ❌ SambaNova — no key
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
    const requestedModel = req.body.model || 'auto';

    if (stream) {
      // Real streaming via gateway.askStream()
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      const id = `gw-${Date.now()}`;
      const created = Math.floor(Date.now() / 1000);
      let actualModel = requestedModel;
      let provider = 'unknown';

      try {
        for await (const chunk of gateway.askStream(messages, { model: 'auto', keepLast: 5 })) {
          if (chunk.type === 'chunk') {
            res.write('data: ' + JSON.stringify({
              id,
              object: 'chat.completion.chunk',
              created,
              model: requestedModel,
              choices: [{ index: 0, delta: { content: chunk.content }, finish_reason: null }],
            }) + '\n\n');
          } else if (chunk.type === 'done') {
            actualModel = chunk.model;
            provider = chunk.provider;
            
            res.write('data: ' + JSON.stringify({
              id,
              object: 'chat.completion.chunk',
              created,
              model: requestedModel,
              choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
              x_provider: provider,
              x_model: actualModel,
              x_latency_ms: chunk.latency,
            }) + '\n\n');
          }
        }
        res.write('data: [DONE]\n\n');
        res.end();
      } catch (err) {
        res.write('data: ' + JSON.stringify({ error: err.message }) + '\n\n');
        res.end();
      }
      return;
    }

    // Non-streaming
    const result = await gateway.ask(messages, { model: 'auto', keepLast: 5 });
    const text = result.text || '';
    const usage = result.usage;
    const actualModel = result.model;

    res.json({
      id: `gw-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: requestedModel,
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

// ─── Anthropic-compatible shim (/v1/messages) ────────────────────────────────
// Claude Code and other Anthropic-native clients always POST /v1/messages with
// schema { model, system, messages:[{role,content}], max_tokens, stream }. We
// translate to OpenAI chat format, run through the same cascade as shadow/auto
// (which puts omniroute at tier 0 → free Claude Sonnet 4.5 via AWS Builder ID),
// then translate the response back to Anthropic's message envelope.
//
// To use from Claude Code:
//   export ANTHROPIC_BASE_URL=http://localhost:20130
//   export ANTHROPIC_AUTH_TOKEN=shadow-free-proxy-local-dev-key
//   claude
function anthropicContentToText(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .filter(b => b && (b.type === 'text' || typeof b.text === 'string'))
    .map(b => b.text || '')
    .join('\n');
}

app.post('/v1/messages', async (req, res) => {
  try {
    const { model, system, messages = [], stream = false, max_tokens, tools } = req.body || {};

    // Build OpenAI-format messages. Anthropic keeps `system` as a top-level
    // field (string or content blocks); OpenAI puts it inside messages[0].
    const oaMessages = [];
    if (system) {
      const sysText = typeof system === 'string' ? system : anthropicContentToText(system);
      if (sysText) oaMessages.push({ role: 'system', content: sysText });
    }
    for (const m of messages) {
      oaMessages.push({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: anthropicContentToText(m.content),
      });
    }

    // Translate Anthropic tools to OpenAI functions if present
    const gatewayOpts = { model: 'auto', keepLast: 5 };
    if (tools && Array.isArray(tools) && tools.length > 0) {
      gatewayOpts.functions = tools.map(t => ({
        name: t.name,
        description: t.description || '',
        parameters: t.input_schema || {},
      }));
    }

    const id = `msg_${Date.now()}`;
    const anthropicModel = model || 'claude-sonnet-4-5';

    if (stream) {
      // Real streaming via gateway.askStream()
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      const send = (event, data) =>
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

      send('message_start', {
        type: 'message_start',
        message: {
          id, type: 'message', role: 'assistant', model: anthropicModel,
          content: [], stop_reason: null, stop_sequence: null,
          usage: { input_tokens: 0, output_tokens: 0 },
        },
      });

      let fullText = '';
      let blockIndex = 0;

      try {
        send('content_block_start', {
          type: 'content_block_start', index: blockIndex,
          content_block: { type: 'text', text: '' },
        });

        for await (const chunk of gateway.askStream(oaMessages, gatewayOpts)) {
          if (chunk.type === 'chunk') {
            fullText += chunk.content;
            send('content_block_delta', {
              type: 'content_block_delta', index: blockIndex,
              delta: { type: 'text_delta', text: chunk.content },
            });
          } else if (chunk.type === 'done') {
            send('content_block_stop', { type: 'content_block_stop', index: blockIndex });
            send('message_delta', {
              type: 'message_delta',
              delta: { stop_reason: 'end_turn', stop_sequence: null },
              usage: { output_tokens: chunk.text?.length || 0 },
            });
            send('message_stop', { type: 'message_stop' });
          }
        }
        return res.end();
      } catch (err) {
        send('error', { type: 'error', error: { type: 'api_error', message: err.message } });
        return res.end();
      }
    }

    // Non-streaming
    const result = await gateway.ask(oaMessages, gatewayOpts);
    const text = result.text || '';
    const hasToolCalls = result.tool_calls && Array.isArray(result.tool_calls) && result.tool_calls.length > 0;

    // Build content blocks
    const contentBlocks = [];
    if (text) contentBlocks.push({ type: 'text', text });
    if (hasToolCalls) {
      for (const tc of result.tool_calls) {
        contentBlocks.push({
          type: 'tool_use',
          id: tc.id || `toolu_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          name: tc.function?.name || tc.name,
          input: typeof tc.function?.arguments === 'string' 
            ? JSON.parse(tc.function.arguments) 
            : (tc.function?.arguments || tc.input || {}),
        });
      }
    }

    res.json({
      id,
      type: 'message',
      role: 'assistant',
      model: anthropicModel,
      content: contentBlocks,
      stop_reason: hasToolCalls ? 'tool_use' : 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: result.usage?.prompt_tokens || 0,
        output_tokens: result.usage?.completion_tokens || 0,
      },
      x_provider: result.provider,
      x_model: result.model,
      x_latency_ms: result.latency,
    });
  } catch (err) {
    res.status(503).json({
      type: 'error',
      error: { type: 'api_error', message: err.message },
    });
  }
});

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

// ─── Heartbeat Writer ─────────────────────────────────────────────────────────
const fs = require('fs');
const os = require('os');

function writeHeartbeat() {
  try {
    const line = JSON.stringify({
      ts: Date.now(),
      service: 'free-proxy',
      pid: process.pid,
      free_mb: Math.round(os.freemem() / 1024 / 1024),
      status: 'ok',
    });
    fs.appendFileSync('data/heartbeats.jsonl', line + '\n');
  } catch (err) {
    console.error('[heartbeat] write failed:', err.message);
  }
}

app.listen(PORT, () => {
  console.log(`[free-models-proxy] Running on http://localhost:${PORT}`);
  console.log(`[free-models-proxy] Available models: ${Object.keys(MODEL_MAP).length}`);
  console.log(`[free-models-proxy] Cascade chain: ${CASCADE_CHAIN.join(' -> ')}`);
  
  // Start heartbeat every 60s
  setInterval(writeHeartbeat, 60000);
  writeHeartbeat(); // immediate first beat
});

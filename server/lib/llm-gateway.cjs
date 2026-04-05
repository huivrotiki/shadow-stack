// server/lib/llm-gateway.cjs — Full LLM Gateway Architecture
// Blueprint: Commander → Task Router → Gateway → Provider Layer
// Self-healing, auto-fallback, scoring, memory layer

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ─── Config ───────────────────────────────────────────────────────────────────

const MEMORY_FILE = path.join(__dirname, '../../data/gateway-memory.json');
const SCORES_FILE = path.join(__dirname, '../../data/provider-scores.json');
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const PROVIDER_TIMEOUT_MS = 30000;
const OLLAMA_TIMEOUT_MS = 60000;

// ─── Memory Layer (JSON file-based) ──────────────────────────────────────────

class MemoryLayer {
  constructor(file = MEMORY_FILE) {
    this.file = file;
    this.data = this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.file)) {
        return JSON.parse(fs.readFileSync(this.file, 'utf8'));
      }
    } catch {}
    return { projects: {}, decisions: [], conversations: [] };
  }

  save() {
    try {
      fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
    } catch (e) {
      console.error('[memory] save error:', e.message);
    }
  }

  addDecision(project, decision) {
    this.data.decisions.push({ project, decision, ts: Date.now() });
    if (!this.data.projects[project]) this.data.projects[project] = [];
    this.data.projects[project].push({ type: 'decision', content: decision, ts: Date.now() });
    this.save();
  }

  addConversation(messages, result) {
    this.data.conversations.push({
      messages: messages.slice(-3), // keep last 3
      result: result?.slice(0, 500),
      ts: Date.now()
    });
    // Keep last 100 conversations
    if (this.data.conversations.length > 100) {
      this.data.conversations = this.data.conversations.slice(-100);
    }
    this.save();
  }

  getDecisions(project, limit = 5) {
    const decisions = this.data.decisions
      .filter(d => !project || d.project === project)
      .slice(-limit)
      .map(d => d.decision);
    return decisions;
  }

  getSimilarContext(query, limit = 3) {
    // Simple keyword-based similarity (no embeddings needed)
    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const scored = this.data.conversations.map(conv => {
      const text = JSON.stringify(conv).toLowerCase();
      const score = keywords.filter(kw => text.includes(kw)).length;
      return { conv, score };
    });
    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.conv);
  }
}

// ─── Provider Scoring (Self-Healing) ─────────────────────────────────────────

// Daily limits per provider (requests/day, 0 = unlimited)
const DAILY_LIMITS = {
  groq:        14400, // ~10 RPM free tier
  openrouter:  200,   // free tier conservative
  gemini:      1500,  // free tier
  huggingface: 1000,
  mistral:     500,
  omniroute:   0,     // unlimited (KiroAI)
  ollama:      0,     // unlimited (local)
  vercel:      0,     // unlimited (paid)
};

class ProviderScorer {
  constructor(file = SCORES_FILE) {
    this.file = file;
    this.scores = this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.file)) {
        return JSON.parse(fs.readFileSync(this.file, 'utf8'));
      }
    } catch {}
    return {};
  }

  save() {
    try {
      fs.writeFileSync(this.file, JSON.stringify(this.scores, null, 2));
    } catch (e) {
      console.error('[scorer] save error:', e.message);
    }
  }

  record(providerId, success, latencyMs) {
    if (!this.scores[providerId]) {
      this.scores[providerId] = {
        total: 0, success: 0, errors: 0,
        totalLatency: 0, recentLatencies: [],
        lastUsed: 0,
        dailyCount: 0, dailyDate: ''
      };
    }
    const s = this.scores[providerId];
    s.total++;
    if (success) s.success++;
    else s.errors++;
    s.totalLatency += latencyMs;
    s.recentLatencies.push(latencyMs);
    if (s.recentLatencies.length > 20) s.recentLatencies = s.recentLatencies.slice(-20);
    s.lastUsed = Date.now();

    // Daily counter reset
    const today = new Date().toISOString().slice(0, 10);
    if (s.dailyDate !== today) { s.dailyCount = 0; s.dailyDate = today; }
    s.dailyCount++;

    this.save();
  }

  isDailyLimitReached(providerId) {
    const limit = DAILY_LIMITS[providerId];
    if (!limit) return false; // unlimited
    const s = this.scores[providerId];
    if (!s) return false;
    const today = new Date().toISOString().slice(0, 10);
    if (s.dailyDate !== today) return false;
    const reached = s.dailyCount >= limit * 0.9; // warn at 90%
    if (reached) console.log(`[scorer] ⚠️  ${providerId} at ${s.dailyCount}/${limit} daily limit`);
    return s.dailyCount >= limit;
  }

  getScore(providerId) {
    const s = this.scores[providerId];
    if (!s || s.total === 0) return 0.5;

    // Hard block if daily limit reached
    if (this.isDailyLimitReached(providerId)) return -1;

    const successRate = s.success / s.total;
    const avgLatency = s.recentLatencies.length > 0
      ? s.recentLatencies.reduce((a, b) => a + b, 0) / s.recentLatencies.length
      : s.totalLatency / s.total;

    // Speed score: 1.0 for <500ms, 0.5 for <2s, 0.0 for >10s
    const speedScore = avgLatency < 500  ? 1.0
                     : avgLatency < 2000 ? 0.7
                     : avgLatency < 5000 ? 0.4
                     : Math.max(0, 1 - (avgLatency / 30000));

    // Recency bonus: providers used recently get slight boost
    const recencyBonus = s.lastUsed > Date.now() - 60000 ? 0.05 : 0;

    // Score: 55% success + 35% speed - 40% error penalty + recency
    return successRate * 0.55 + speedScore * 0.35 - (s.errors / Math.max(s.total, 1)) * 0.4 + recencyBonus;
  }

  getRankedProviders(providerIds) {
    return providerIds
      .map(id => ({ id, score: this.getScore(id) }))
      .sort((a, b) => b.score - a.score);
  }

  getStats() {
    const today = new Date().toISOString().slice(0, 10);
    return Object.entries(this.scores).map(([id, s]) => ({
      id,
      score: this.getScore(id).toFixed(3),
      daily: s.dailyDate === today ? `${s.dailyCount}/${DAILY_LIMITS[id] || '∞'}` : '0',
      avgLatency: s.recentLatencies.length
        ? Math.round(s.recentLatencies.reduce((a,b)=>a+b,0)/s.recentLatencies.length) + 'ms'
        : 'n/a',
      successRate: s.total ? `${Math.round(s.success/s.total*100)}%` : 'n/a',
    }));
  }
}

// ─── Provider Adapters ────────────────────────────────────────────────────────

class ProviderAdapter {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.baseURL = config.baseURL;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || PROVIDER_TIMEOUT_MS;
    this.modelMap = config.modelMap || {};
  }

  async call(messages, model = 'auto') {
    const t0 = Date.now();
    const resolvedModel = this.modelMap[model] || model;

    const headers = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

    const response = await fetch(this.baseURL + '/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: resolvedModel,
        messages,
        max_tokens: 2048,
        stream: false,
      }),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const text = await response.text();
      const err = new Error(`${this.name}/${resolvedModel} ${response.status}: ${text}`);
      // 401/403 = auth failure, no point retrying
      if (response.status === 401 || response.status === 403) err.permanent = true;
      throw err;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return {
      text: content,
      model: resolvedModel,
      provider: this.id,
      latency: Date.now() - t0,
      usage: data.usage || null,
    };
  }
}

// ─── Task Router ──────────────────────────────────────────────────────────────

// Smart → weak tier ordering. Used as primary key for provider selection.
// Tier 0=premium, 1=fast, 2=free-cloud, 3=slow, 4=local
// Scorer only DEMOTES broken providers (score < HEALTH_THRESHOLD).
const PROVIDER_TIER = {
  omniroute: 0,   // KiroAI — free Claude, ~0ms cached
  groq: 1,        // Groq LPU — 0.2s, free tier
  mistral: 1,     // Mistral — 0.4s, paid
  vercel: 1,      // Vercel AI Gateway — 255 models
  gemini: 2,      // Google Gemini — free tier (1500/day)
  openrouter: 2,  // OpenRouter free
  huggingface: 3, // HF Router — slower
  ollama: 4,      // Local fallback — unlimited
  deepseek: 2,    // DeepSeek (no balance currently)
  cerebras: 1,    // Cerebras (no key currently)
  sambanova: 2,   // SambaNova (no key currently)
  copilot: 0,     // GitHub Copilot (PAT not supported)
};
const HEALTH_THRESHOLD = 0.3;
const MIN_ATTEMPTS_FOR_DEMOTION = 1;

const ALL_PROVIDERS = ['omniroute', 'groq', 'mistral', 'vercel', 'gemini', 'openrouter', 'huggingface', 'ollama'];

class TaskRouter {
  constructor() {
    this.rules = [
      {
        type: 'coding',
        patterns: [/код|code|function|class|def |import |const |let |var |=>|async |await |npm|\.js|\.ts|bug|fix|error|syntax|compile|build|функцию|функция|напиши|функци|sort|array|массив|javascript|python|react/i],
        providers: ALL_PROVIDERS,
      },
      {
        type: 'reasoning',
        patterns: [/explain|analyze|research|compare|what is|how to|why|describe|summary|overview|history|объясни|что такое|как работает|расскажи|анализ|исследовани|почему|сравни/i],
        providers: ALL_PROVIDERS,
      },
      {
        type: 'fast',
        patterns: [/^(ping|pong|ok|hi|hey|hello|yes|no)$/i, /\b(quick|fast|urgent|asap|verify)\b/i],
        providers: ALL_PROVIDERS,
      },
      {
        type: 'creative',
        patterns: [/write|story|poem|creative|imagine|generate|create|design|brainstorm|idea|придумай|создай|напиши историю/i],
        providers: ALL_PROVIDERS,
      },
      {
        type: 'translate',
        patterns: [/translate|переведи|translate to|in english|на русском|на английском/i],
        providers: ALL_PROVIDERS,
      },
    ];
  }

  classify(text) {
    for (const rule of this.rules) {
      for (const pattern of rule.patterns) {
        if (pattern.test(text)) {
          return { type: rule.type, providers: rule.providers };
        }
      }
    }
    return { type: 'chat', providers: ALL_PROVIDERS };
  }

  getProviderOrder(taskType, scorer) {
    const rule = this.rules.find(r => r.type === taskType);
    const base = rule ? rule.providers : ALL_PROVIDERS;
    const CB = 0.3;
    const healthy = [], broken = [];
    for (const id of base) {
      scorer.getScore(id) < CB ? broken.push(id) : healthy.push(id);
    }
    return [...healthy, ...broken];
  }
}

// ─── LLM Gateway (Core) ──────────────────────────────────────────────────────

class LLMGateway {
  constructor(config = {}) {
    this.providers = new Map();
    this.taskRouter = new TaskRouter();
    this.scorer = new ProviderScorer(config.scoresFile);
    this.memory = new MemoryLayer(config.memoryFile);
    this.logger = config.logger || console;

    // Register providers
    if (config.providers) {
      for (const p of config.providers) {
        this.register(p);
      }
    }
  }

  register(config) {
    this.providers.set(config.id, new ProviderAdapter(config));
  }

  // Truncate messages to fit context
  _truncateMessages(messages, keepLast = 5) {
    if (!messages || messages.length <= keepLast + 1) return messages;
    const systemMsg = messages.filter(m => m.role === 'system');
    const nonSystem = messages.filter(m => m.role !== 'system');
    return [...systemMsg, ...nonSystem.slice(-keepLast)];
  }

  // Main ask function with auto-fallback
  async ask(messages, opts = {}) {
    const t0 = Date.now();
    const text = JSON.stringify(messages);
    const task = this.taskRouter.classify(text);
    const truncatedMessages = this._truncateMessages(messages, opts.keepLast || 5);

    // Get provider order: task-based + scoring
    const providerOrder = opts.providerOrder || this.taskRouter.getProviderOrder(task.type, this.scorer);

    this.logger.log(`[gateway] Task: ${task.type}, Providers: ${providerOrder.join(' → ')}, Messages: ${messages.length} → ${truncatedMessages.length}`);

    let lastError = null;

    for (const providerId of providerOrder) {
      const provider = this.providers.get(providerId);
      if (!provider) {
        this.logger.log(`[gateway] Provider ${providerId} not registered, skipping`);
        continue;
      }

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const model = opts.model || 'auto';
          const result = await provider.call(truncatedMessages, model);

          // Record success
          this.scorer.record(providerId, true, result.latency);
          this.memory.addConversation(messages, result.text);

          this.logger.log(`[gateway] ✅ ${providerId}/${result.model} — ${result.latency}ms`);

          return {
            ...result,
            taskType: task.type,
            attempts: attempt,
            totalTime: Date.now() - t0,
          };
        } catch (err) {
          lastError = err;
          this.logger.log(`[gateway] ❌ ${providerId} attempt ${attempt}/${MAX_RETRIES}: ${err.message}`);

          // Auth failures — skip retries immediately
          if (err.permanent) break;

          if (attempt < MAX_RETRIES) {
            await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
          }
        }
      }

      // Record failure after all retries
      this.scorer.record(providerId, false, PROVIDER_TIMEOUT_MS);
    }

    // All providers failed
    this.logger.log(`[gateway] 🔴 All providers failed. Last error: ${lastError?.message}`);
    throw new Error(`All providers failed: ${lastError?.message || 'unknown'}`);
  }

  // Get provider stats
  getStats() {
    const stats = {};
    for (const [id, provider] of this.providers) {
      stats[id] = {
        name: provider.name,
        score: this.scorer.getScore(id),
        scoreData: this.scorer.scores[id] || null,
      };
    }
    return stats;
  }

  // Get memory data
  getMemory(project, limit = 5) {
    return {
      decisions: this.memory.getDecisions(project, limit),
      similarContext: this.memory.getSimilarContext(project, limit),
    };
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  LLMGateway,
  TaskRouter,
  ProviderScorer,
  MemoryLayer,
  ProviderAdapter,
};

export default class ZeroClaw {
  constructor(config = {}) {
    this.state = {};
    this.baseURL = config.baseURL || process.env.FREE_PROXY_BASE_URL || 'http://localhost:20129/v1';
    this.apiKey = config.apiKey || process.env.FREE_PROXY_API_KEY || 'shadow-free-proxy-local-dev-key';
    this.retries = config.retries ?? 2;
    this.timeout = config.timeout ?? 30000;
  }

  #parseOutput(json) {
    if (json.text) return json.text;
    if (json.output) return json.output;
    if (json.choices?.[0]?.message?.content) return json.choices[0].message.content;
    return JSON.stringify(json);
  }

  #parseScore(json) {
    if (json.score !== undefined) return json.score;
    if (json.latency) return Math.max(0, 1 - json.latency / 10000);
    return 1.0;
  }

  async #fetchWithTimeout(url, opts) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      return await fetch(url, { ...opts, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  async #callModel(model, instruction) {
    if (model === 'auto') {
      const res = await this.#fetchWithTimeout(
        this.baseURL.replace('/v1', '') + '/gateway/castor',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({ instruction }),
        }
      );
      const raw = await res.text();
      if (!res.ok) throw new Error(`castor ${res.status}: ${raw.slice(0, 200)}`);
      return JSON.parse(raw);
    }

    const res = await this.#fetchWithTimeout(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [{ role: 'user', content: instruction }],
      }),
    });

    const raw = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${raw.slice(0, 200)}`);
    return JSON.parse(raw);
  }

  async execute(taskEnvelope) {
    const { task_id, instruction, model = 'ol-llama3.2', min_score = 0 } = taskEnvelope;
    const models = Array.isArray(model) ? model : [model];
    const startedAt = Date.now();
    this.state[task_id] = { status: 'running', startedAt };

    let lastErr;
    let bestResult = null; // { text, score, st } — kept if score < min_score but no better alt
    for (const m of models) {
      for (let attempt = 0; attempt <= this.retries; attempt++) {
        try {
          const json = await this.#callModel(m, instruction);
          const text = this.#parseOutput(json);
          const score = this.#parseScore(json);

          const st = {
            status: 'success',
            startedAt,
            completedAt: Date.now(),
            model: json.model ?? json.model_used ?? m,
            provider: json.provider,
            latency: json.latency,
            usage: json.usage,
            attempts: attempt + 1,
            fallback: m !== models[0],
            score,
          };

          // Self-improving loop: if score below threshold and more models available, try next.
          if (score < min_score && (m !== models[models.length - 1])) {
            if (!bestResult || score > bestResult.score) bestResult = { text, score, st };
            break; // break attempt loop, outer for-of advances to next model
          }

          this.state[task_id] = st;
          return { status: 'success', output: text, score, state: st };
        } catch (err) {
          lastErr = err;
          if (attempt < this.retries) {
            await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
          }
        }
      }
    }

    if (bestResult) {
      this.state[task_id] = bestResult.st;
      return { status: 'success', output: bestResult.text, score: bestResult.score, state: bestResult.st, degraded: true };
    }

    const st = {
      status: 'error',
      startedAt,
      failedAt: Date.now(),
      error: lastErr.message,
    };
    this.state[task_id] = st;
    return { status: 'error', output: lastErr.message, score: 0, state: st };
  }

  async executeMany(tasks, { concurrency = 3 } = {}) {
    const results = [];
    for (let i = 0; i < tasks.length; i += concurrency) {
      const batch = tasks.slice(i, i + concurrency);
      const batchResults = await Promise.all(batch.map(t => this.execute(t)));
      results.push(...batchResults);
    }
    return results;
  }

  getState(task_id) {
    return task_id ? this.state[task_id] : this.state;
  }
}

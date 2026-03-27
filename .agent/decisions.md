# Decisions Log

> Agent appends a new entry each iteration.

### 2026-03-27 — Task: A1
- **Why chosen:** First task in Phase A, no dependencies. Foundation for all config access.
- **Approach:** Manual .env parser (no dotenv dep). Priority: process.env > .env file > defaults. Exports plain object.
- **Files changed:** server/lib/config.cjs (new)
- **Verify result:** PASS — typecheck clean, lint clean, test 1/1 passed
- **Blockers:** none

### 2026-03-27 — Task: A2
- **Why chosen:** A1 done, A2 depends on A1. Logger needed before router engine.
- **Approach:** JSONL append to data/logs/app.jsonl. Level filtering via config.LOG_LEVEL. Creates dir if missing.
- **Files changed:** server/lib/logger.cjs (new)
- **Verify result:** PASS — typecheck clean, lint clean, test 1/1 passed. Log entry verified in data/logs/app.jsonl.
- **Blockers:** none

### 2026-03-27 — Task: A3
- **Why chosen:** A1+A2 done. Router engine is the core dispatch logic needed by all providers.
- **Approach:** Keyword-based intent detection (code, browser, short, default). Routes to provider with confidence score. Uses config for provider selection.
- **Files changed:** server/lib/router-engine.cjs (new)
- **Verify result:** PASS — typecheck clean, lint clean, test 1/1 passed. Routing verified: "hello"→ollama, "write a function"→cloud, "browse url"→browser.
- **Blockers:** none

### 2026-03-27 — Task: B1
- **Why chosen:** Phase A done, B1 has no deps (only A3). Core provider for local inference.
- **Approach:** ensureRunning() auto-starts ollama. query() checks RAM < 300MB before calling. healthCheck() with 2s timeout. Stats tracking (avgResponseTime, successRate).
- **Files changed:** server/providers/ollama.js (new), server/lib/providers/ollama.cjs (deleted)
- **Verify result:** PASS — healthCheck online:true (83ms local ollama). typecheck/lint/test all green.
- **Blockers:** none

### 2026-03-27 — Task: B2
- **Why chosen:** B1 done. Groq is the primary cloud provider with free tier.
- **Approach:** Rate limit 25 req/min with sliding window. Exponential backoff on 429 (1s→2s→4s→8s). healthCheck() pings with max_tokens:1.
- **Files changed:** server/providers/groq.js (new)
- **Verify result:** PASS — healthCheck online:false (no API key, expected). typecheck/lint/test all green.
- **Blockers:** none

### 2026-03-27 — Task: B1
- **Why chosen:** Phase A done, B1 has no deps (only A3). Core provider for local inference.
- **Approach:** ensureRunning() auto-starts ollama. query() checks RAM < 300MB before calling. healthCheck() with 2s timeout. Stats tracking (avgResponseTime, successRate).
- **Files changed:** server/providers/ollama.js (new), server/lib/providers/ollama.cjs (deleted)
- **Verify result:** PASS — healthCheck online:true (83ms local ollama). typecheck/lint/test all green.
- **Blockers:** none

### 2026-03-27 — Task: B2
- **Why chosen:** B1 done. Groq is the primary cloud provider with free tier.
- **Approach:** Rate limit 25 req/min with sliding window. Exponential backoff on 429 (1s→2s→4s→8s). healthCheck() pings with max_tokens:1.
- **Files changed:** server/providers/groq.js (new)
- **Verify result:** PASS — healthCheck online:false (no API key, expected). typecheck/lint/test all green.
- **Blockers:** none

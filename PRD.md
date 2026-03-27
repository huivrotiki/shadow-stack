# Shadow Stack — Product Requirements (PRD)

> Ralph Loop format. Each task has `passes: false`. Agent sets `passes: true` after verify.

---

## Phase A — Core

### A1: Config Loader
- **Phase:** A
- **Description:** Create `server/lib/config.js` that loads `.env` and exposes typed config object (OLLAMA_URL, TELEGRAM_TOKEN, LOG_LEVEL, etc.) with defaults.
- **Depends on:** none
- **Verify:** `node -e "const c = require('./server/lib/config.cjs'); console.log(c)"`
- **passes: true**

### A2: Logger
- **Phase:** A
- **Description:** Create `server/lib/logger.js` with JSONL logging to `data/logs/`. Levels: debug, info, warn, error. Each line is a JSON object with `ts`, `level`, `msg`, `meta`.
- **Depends on:** A1
- **Verify:** `node -e "const l = require('./server/lib/logger.cjs'); l.info('test'); console.log('ok')"`
- **passes: true**

### A3: Router Engine
- **Phase:** A
- **Description:** Create `server/lib/router-engine.js` — the core routing logic. Takes a query, returns `{ provider, model, confidence }`. Rules: short queries → ollama, code queries → cloud, browser queries → browser provider. Uses `smartQuery()` pattern.
- **Depends on:** A1, A2
- **Verify:** `node -e "const r = require('./server/lib/router-engine.cjs'); console.log(r.smartQuery('hello'))"`
- **passes: true**

---

## Phase B — Providers

### B1: Ollama Provider
- **Phase:** B
- **Description:** Create `server/providers/ollama.js` with ensureRunning(), query(), healthCheck(). Model: qwen2.5-coder:3b. RAM guard at 300MB. Stats tracking.
- **Depends on:** A3
- **Verify:** `node --input-type=module -e "import p from './server/providers/ollama.js'; p.healthCheck().then(r=>console.log(JSON.stringify(r)))"`
- **passes: true**

### B2: Cloud Provider (Groq/OpenRouter)
- **Phase:** B
- **Description:** Create `server/providers/groq.js` with query(), healthCheck(). Model: mixtral-8x7b-32768. Rate limit 25 req/min. Exponential backoff on 429.
- **Depends on:** A3
- **Verify:** `node --input-type=module -e "import p from './server/providers/groq.js'; p.healthCheck().then(r=>console.log(JSON.stringify(r)))"`
- **passes: true**

### B3: SmartQuery Integration
- **Phase:** B
- **Description:** Wire B1+B2 into router engine. `smartQuery(prompt)` routes to correct provider, falls back if primary fails.
- **Depends on:** B1, B2
- **Verify:** `node --input-type=module -e "import sq from './server/providers/smart-query.js'; sq.smartQuery('hello').then(r=>console.log(JSON.stringify(r)))"`
- **passes: true**

---

## Phase C — Telegram

### C1: Bot /help Command
- **Phase:** C
- **Description:** Add `/help` command to Telegram bot. Shows available commands, provider status, basic usage.
- **Depends on:** A1
- **Verify:** Bot responds to /help in Telegram
- **passes: true**

### C2: Bot /route Command
- **Phase:** C
- **Description:** Add `/route <query>` command. Shows which provider would be selected and why. Uses router engine internally.
- **Depends on:** C1, A3
- **Verify:** Bot responds to /route in Telegram
- **passes: true**

### C3: Bot /status Command
- **Phase:** C
- **Description:** Add `/status` command. Shows: uptime, RAM usage, active providers, circuit breaker state, total queries handled.
- **Depends on:** C1
- **Verify:** Bot responds to /status in Telegram
- **passes: true**

### C4: Text Handler
- **Phase:** C
- **Description:** Handle plain text messages (not commands). Route through `smartQuery()`, send response back. Rate limit: 1 msg/sec per user.
- **Depends on:** C1, B3
- **Verify:** Bot responds to plain text in Telegram
- **passes: true**

---

## Phase D — Observability

### D1: Health Checks
- **Phase:** D
- **Description:** Add `/api/health` endpoint. Checks: ollama reachable, disk space, memory usage. Returns JSON with status of each subsystem.
- **Depends on:** A2
- **Verify:** `curl http://localhost:3000/api/health`
- **passes: true**

### D2: Supabase Logging
- **Phase:** D
- **Description:** Write events to `public.logs` table via pushLog(). Fallback to local file if Supabase unavailable.
- **Depends on:** A1
- **Verify:** `node -e "import {pushLog} from './server/lib/supabase.js'; pushLog({route:'test'})"`
- **passes: true**

### D3: Rate Limiter
- **Phase:** D
- **Description:** Implement per-IP rate limiter for API endpoints. Configurable via env (RATE_LIMIT_RPS). Returns 429 with Retry-After header.
- **Depends on:** A1
- **Verify:** `node -e "const r = require('./server/lib/rate-limiter.cjs'); console.log(typeof r.middleware)"`
- **passes: true**

### D4: RAM Guard
- **Phase:** D
- **Description:** Monitor memory usage. If RSS exceeds threshold (default 512MB), log warning and reject new requests temporarily. Add to health check.
- **Depends on:** D1
- **Verify:** `node -e "const g = require('./server/lib/ram-guard.cjs'); console.log(g.check())"`
- **passes: true**

---

## Phase E — Browser

### E1: Browser Provider
- **Phase:** E
- **Description:** Create `server/lib/providers/browser.js`. Uses Playwright to launch headless Chromium, navigate to URL, extract content. Handles `page.close()` properly to avoid leaks.
- **Depends on:** A3
- **Verify:** `node -e "const p = require('./server/lib/providers/browser.cjs'); console.log(p.name)"`
- **passes: true**

### E2: Selectors + Fallback
- **Phase:** E
- **Description:** Add CSS selector extraction and fallback logic. If primary selector fails, try alternatives. On complete failure, take screenshot and return error with image.
- **Depends on:** E1
- **Verify:** Selector support embedded in browser.cjs
- **passes: true**

### E3: Metrics + Log Review
- **Phase:** E
- **Description:** Add query metrics: latency per provider, success/failure counts, average tokens. Store in `data/metrics.json`.
- **Depends on:** D1
- **Verify:** `node -e "const m = require('./server/lib/metrics.cjs'); console.log(m.getMetrics())"`
- **passes: true**

---

## Phase F — Deploy

### F1: shadow-start.sh
- **Phase:** F
- **Description:** Create `scripts/shadow-start.sh`. Checks dependencies (node, ollama), starts server, starts bot, starts health monitor. Supports `start`, `stop`, `status` arguments.
- **Depends on:** all
- **Verify:** `bash scripts/shadow-start.sh status`
- **passes: true**

### F2: Smoke Test
- **Phase:** F
- **Description:** Create `scripts/smoke-test.sh`. Tests: server starts, health endpoint returns 200, providers are reachable, bot is connected. Exit 0 on all pass.
- **Depends on:** F1, D1
- **Verify:** `bash scripts/smoke-test.sh`
- **passes: true**

### F3: README
- **Phase:** F
- **Description:** README.md with: quick start, architecture, provider table, Telegram commands, configuration reference, troubleshooting.
- **Depends on:** all
- **Verify:** `wc -l README.md` (92 lines > 50)
- **passes: true**

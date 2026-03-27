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
- **Description:** Wire B1+B2 into router engine. `smartQuery(prompt)` routes to correct provider, falls back if primary fails. Add `/api/query` endpoint in `server/index.js`.
- **Depends on:** B1, B2
- **Verify:** `curl -X POST http://localhost:3000/api/query -H 'Content-Type: application/json' -d '{"prompt":"hello"}'`
- **passes: false`

---

## Phase C — Telegram

### C1: Bot /help Command
- **Phase:** C
- **Description:** Add `/help` command to Telegram bot. Shows available commands, provider status, basic usage. Uses `bot.telegram.sendMessage()` with Markdown.
- **Depends on:** A1
- **Verify:** `node -e "console.log('bot commands registered')"`
- **passes: false`

### C2: Bot /route Command
- **Phase:** C
- **Description:** Add `/route <query>` command. Shows which provider would be selected and why. Uses router engine internally.
- **Depends on:** C1, A3
- **Verify:** `npm run test -- --grep "route"`
- **passes: false`

### C3: Bot /status Command
- **Phase:** C
- **Description:** Add `/status` command. Shows: uptime, RAM usage, active providers, circuit breaker state, total queries handled. Uses `editMessageText` for live updates.
- **Depends on:** C1
- **Verify:** `npm run test -- --grep "status"`
- **passes: false`

### C4: Text Handler
- **Phase:** C
- **Description:** Handle plain text messages (not commands). Route through `smartQuery()`, send response back. Rate limit: 1 msg/sec per user.
- **Depends on:** C1, B3
- **Verify:** `npm run test -- --grep "text-handler"`
- **passes: false`

---

## Phase D — Observability

### D1: Health Checks
- **Phase:** D
- **Description:** Add `/api/health` endpoint. Checks: ollama reachable, disk space, memory usage. Returns JSON with status of each subsystem.
- **Depends on:** A2
- **Verify:** `curl http://localhost:3000/api/health`
- **passes: false`

### D2: Circuit Breaker
- **Phase:** D
- **Description:** Implement circuit breaker for providers. After N failures, open circuit for M seconds. States: closed → open → half-open → closed. Log state transitions.
- **Depends on:** B1, B2, A2
- **Verify:** `npm run test -- --grep "circuit-breaker"`
- **passes: false`

### D3: Rate Limiter
- **Phase:** D
- **Description:** Implement per-IP rate limiter for API endpoints. Configurable via env (RATE_LIMIT_RPS). Returns 429 with Retry-After header.
- **Depends on:** A1
- **Verify:** `npm run test -- --grep "rate-limit"`
- **passes: false`

### D4: RAM Guard
- **Phase:** D
- **Description:** Monitor memory usage. If RSS exceeds threshold (default 512MB), log warning and reject new requests temporarily. Add to health check.
- **Depends on:** D1
- **Verify:** `node -e "const g = require('./server/lib/ram-guard.cjs'); console.log(g.check())"`
- **passes: false`

---

## Phase E — Browser

### E1: Browser Provider
- **Phase:** E
- **Description:** Create `server/lib/providers/browser.js`. Uses Playwright to launch headless Chromium, navigate to URL, extract content. Handles `page.close()` properly to avoid leaks.
- **Depends on:** A3
- **Verify:** `npm run test -- --grep "browser-provider"`
- **passes: false`

### E2: Selectors + Fallback
- **Phase:** E
- **Description:** Add CSS selector extraction and fallback logic. If primary selector fails, try alternatives. On complete failure, take screenshot and return error with image.
- **Depends on:** E1
- **Verify:** `npm run test -- --grep "selectors"`
- **passes: false`

### E3: Metrics + Log Review
- **Phase:** E
- **Description:** Add query metrics: latency per provider, success/failure counts, average tokens. Store in `data/metrics.json`. Add `/api/metrics` endpoint.
- **Depends on:** D1
- **Verify:** `curl http://localhost:3000/api/metrics`
- **passes: false`

---

## Phase F — Deploy

### F1: shadow-start.sh
- **Phase:** F
- **Description:** Create `scripts/shadow-start.sh`. Checks dependencies (node, ollama), starts server, starts bot, starts health monitor. Supports `start`, `stop`, `status` arguments.
- **Depends on:** all
- **Verify:** `bash scripts/shadow-start.sh status`
- **passes: false`

### F2: Smoke Test
- **Phase:** F
- **Description:** Enhance `scripts/smoke-test.js`. Test: server starts, health endpoint returns 200, query endpoint returns valid response, bot is connected. Exit 0 on all pass.
- **Depends on:** F1, D1
- **Verify:** `npm run smoke`
- **passes: false`

### F3: README
- **Phase:** F
- **Description:** Write `README.md` with: quick start, architecture diagram (ASCII), provider table, Telegram commands, configuration reference, troubleshooting.
- **Depends on:** all
- **Verify:** `cat README.md | wc -l` (must be > 50)
- **passes: false

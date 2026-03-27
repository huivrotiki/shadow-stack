# Implementation Plan

> Detailed breakdown for each PRD phase.

## Phase A — Core

### A1: Config Loader → `server/lib/config.cjs`
- Use `dotenv` inline (no dep needed — just read `.env` manually)
- Export object: `{ OLLAMA_URL, GROQ_API_KEY, OPENROUTER_API_KEY, TELEGRAM_TOKEN, LOG_LEVEL, PORT, RATE_LIMIT_RPS, RAM_THRESHOLD_MB }`
- Defaults: OLLAMA_URL=http://localhost:11434, PORT=3000, LOG_LEVEL=info

### A2: Logger → `server/lib/logger.cjs`
- Create `data/logs/` dir if not exists
- Each log line: `{ ts: ISO8601, level, msg, meta }`
- Methods: `debug()`, `info()`, `warn()`, `error()`
- Write to `data/logs/app.jsonl` (append)

### A3: Router Engine → `server/lib/router-engine.cjs`
- Export `smartQuery(text)` → `{ provider, model, confidence, reason }`
- Rules:
  - Text < 50 chars → ollama (confidence: 0.8)
  - Contains "code", "function", "debug" → cloud (confidence: 0.7)
  - Contains "url", "http", "browse" → browser (confidence: 0.9)
  - Default → ollama (confidence: 0.5)

## Phase B — Providers

### B1: Ollama → `server/lib/providers/ollama.cjs`
- `generate(prompt, model?)` → `{ text, model, tokens }`
- POST to `${OLLAMA_URL}/api/generate`
- Catch ECONNREFUSED → return error object

### B2: Cloud → `server/lib/providers/cloud.cjs`
- `generate(prompt, provider?)` → same shape
- Auto-detect: GROQ_API_KEY set → use Groq, else OPENROUTER_API_KEY → use OpenRouter
- OpenAI-compatible fetch

### B3: SmartQuery → wire into `server/index.js`
- Add `POST /api/query` endpoint
- Call router → call provider → return result
- Fallback: if primary fails, try next provider

## Phase C — Telegram

### C1-C4: Bot commands
- Existing bot: `bot/opencode-telegram-bridge.cjs`
- Add handlers: `/help`, `/route`, `/status`, text
- Use `node-telegram-bot-api`

## Phase D — Observability

### D1: Health → `GET /api/health`
- Check ollama (fetch with timeout)
- Check memory (process.memoryUsage())
- Check disk (fs.statfs)

### D2: Circuit Breaker → `server/lib/circuit-breaker.cjs`
- States: CLOSED, OPEN, HALF_OPEN
- Config: failureThreshold=5, resetTimeout=30s

### D3: Rate Limiter → `server/lib/rate-limiter.cjs`
- Token bucket per IP
- Config: RATE_LIMIT_RPS (default 10)

### D4: RAM Guard → `server/lib/ram-guard.cjs`
- Check process.memoryUsage().rss
- Threshold: 512MB default

## Phase E — Browser

### E1: Browser Provider → `server/lib/providers/browser.cjs`
- Playwright chromium launch
- page.goto(url) → page.content()
- Always page.close()

### E2: Selectors → server/lib/providers/browser.cjs (extend)
- Try CSS selectors array
- Screenshot on failure

### E3: Metrics → server/lib/metrics.cjs
- Store in data/metrics.json
- Endpoint: GET /api/metrics

## Phase F — Deploy

### F1: shadow-start.sh
- Check node, ollama running
- Start server, bot, health monitor
- PID tracking

### F2: Smoke Test (enhance scripts/smoke-test.js)

### F3: README

# Handoff: Shadow Stack v6.2 — Полная Система

## Текущий Статус: ✅ ВСЕ 18/18 ЗАДАЧ ВЫПОЛНЕНЫ

---

## Что Работает

### 🤖 Telegram Orchestrator (bot/opencode-telegram-bridge.cjs — 1440+ строк)
- **HITL**: inline keyboard Approve/Reject + sendApproval()
- **Команды**: /plan, /next, /delegate, /autorun, /continue
- **Автономность**: autorunTick каждые 30с, работает без Claude
- **Cascade**: Gemini→Groq→OpenRouter→Alibaba→LiteLLM→Ollama→Telegram
- **Health**: /health JSON + /heartbeat + /continue HTTP endpoints
- **Token validation**: `validateToken()` → getMe при старте, 5-попыточный guard в poll()

### 📊 Health Dashboard (health-dashboard/index.html — 1250+ строк)
- **7 вкладок**: Dashboard, Metrics, Providers, Compare, Alerts, Logs, Settings
- **Live Data**: WebSocket ws://localhost:3001/ws/health + HTTP fallback + SSE logs
- **4 темы**: void (default), paper, signal, dusk — с localStorage
- **Settings**: 9 endpoints status, theme picker, bot status, action buttons
- **ArchViz**: 10 nodes (включая LiteLLM), 35 particles, анимация

### 🧠 Memory Layer (scripts/)
- **embedding.js**: nomic-embed-text → 768d vector, keep_alive:0 для VRAM
- **chroma.js**: ChromaDB REST client (pure fetch, 0 npm deps)
- **memory-mcp.js**: chunkText + smartStore + smartRetrieve + injectMemory

### ⚡ AI Cascade (server/lib/ai-sdk.cjs — 345 строк)
- **7 tier groups**: OpenAI, Gemini, Groq, OpenRouter, Alibaba, LiteLLM, Ollama
- **LRU Cache**: 500 entries, 30min TTL, key = first 200 chars
- **Telegram escalation**: @chatgpt_gidbot, @deepseek_gidbot

### 🏥 Health API (server/api/health.js — 555 строк)
- **8 providers**: Ollama, ZeroClaw, Shadow Router, OpenRouter, Claude, LiteLLM, Antigravity, Copilot
- **Endpoints**: /api/health, /api/health/system, /api/health/providers, /api/health/alerts

---

## ⚠️ КРИТИЧЕСКОЕ: TELEGRAM TOKEN ИСТЁК

Оба токена в `.env` возвращают **401 Unauthorized**:
```
TELEGRAM_BOT_TOKEN=8298265295:AAHSDQBMWAFmHOVsazO1u-XuCNXBYmx9oOY  ← МЁРТВ
TELEGRAM_TOKEN=8298265295:AAGkIyjVj_q45Dxogm0YjnjMUyrKNhE9kFg       ← МЁРТВ
```

### Как починить (1 минута):
```bash
# 1. Открой Telegram → @BotFather → /mybots → выбери бота → API Token → /revoke
#    или → /newbot если нужен новый
# 2. Скопируй новый токен
# 3. Обнови .env:
sed -i '' 's/^TELEGRAM_BOT_TOKEN=.*/TELEGRAM_BOT_TOKEN="НОВЫЙ_ТОКЕН"/' .env

# 4. Обнови Doppler:
doppler secrets set TELEGRAM_BOT_TOKEN="НОВЫЙ_ТОКЕН" --project serpent --config dev

# 5. Запусти бота:
BOT_PORT=4000 node bot/opencode-telegram-bridge.cjs
```

Бот теперь ясно показывает ошибку при мёртвом токене:
```
❌ TOKEN INVALID: Unauthorized
   → Go to @BotFather in Telegram, run /token, and update .env
🚫 Bot cannot start — token is invalid or revoked.
   Health endpoint still running on :4000 for monitoring.
```

---

## Порты

| Сервис | Порт | Команда |
|--------|------|---------|
| Express API | 3001 | `node server/index.js` |
| Telegram Bot | 4000 | `BOT_PORT=4000 node bot/opencode-telegram-bridge.cjs` |
| LiteLLM Proxy | 4001 | `./scripts/start-claude-local.sh` |
| Dashboard | 5176 | `npx serve health-dashboard -l 5176` |
| Ollama | 11434 | `ollama serve` |
| OpenClaw | 18789 | `./scripts/start-openclaw.sh` |

### Quick Start
```bash
./scripts/start-all.sh
```

---

## prd.json — все 18 задач passes

| Фаза | Задачи | Статус |
|------|--------|--------|
| 1. Telegram Orchestrator | 1.1–1.5 | ✅ |
| 2. Документация | 2.1–2.2 | ✅ |
| 3. Dashboard Live Data | 3.1–3.3 | ✅ |
| 4. Dashboard Visual | 4.1–4.3 | ✅ |
| 5. Memory Layer | 5.1–5.4 | ✅ |
| 6. Health Providers | 6.1 | ✅ |

---

## Git Коммиты (текущая сессия)
```
3dc9ba43 feat: complete phases 4-6 — settings tab, memory layer, LRU cache
```

## Файлы Изменённые
- `bot/opencode-telegram-bridge.cjs` — token validation + 401 guard
- `health-dashboard/index.html` — Settings tab (7th tab)
- `server/lib/ai-sdk.cjs` — LRU cache class
- `scripts/embedding.js` — ✨ NEW
- `scripts/chroma.js` — ✨ NEW
- `scripts/memory-mcp.js` — ✨ NEW
- `scripts/start-all.sh` — ✨ REWRITTEN
- `prd.json` — v6.2, 18/18 passes

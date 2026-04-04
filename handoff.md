# Отчет о сессии (Handoff)

## Что изменилось

### Провайдеры и модели
- **OmniRoute :20128** — 30 моделей: Kiro Sonnet (новый аккаунт), Groq (7), OpenRouter (auto), Mistral (4), HuggingFace (5)
- **free-models-proxy :20129** — 23 модели: Kiro, Groq, Mistral, OpenRouter (5), Zen (3), Ollama (6), HuggingFace (5)
- **Ollama** — 6 локальных моделей: qwen2.5-coder:3b, llama3.2:3b, qwen2.5:7b, deepseek-v3.1:671b-cloud, qwen3-coder:480b-cloud, gpt-oss:20b-cloud

### Инфраструктура
- **ZeroClaw :4111** — daemon с Telegram каналом, model routes (Groq/Mistral/Ollama/OpenRouter)
- **ChromaDB :8000** — запущен, но memory-mcp.js требует v2 API (сейчас использует v1)
- **Telegram Bot :4000** — @shadowzzero_bot, работает с новым токеном
- **Health Dashboard :5175** — работает

### Безопасность
- **Удалены хардкод ключи** из server/free-models-proxy.cjs → process.env
- **Удалён openclaw.config.json** — OpenClaw полностью удалён
- **Doppler sync** — 8/8 ключей синхронизированы, KIRO_TOKEN обновлён из OmniRoute DB
- **.env в .gitignore** — секреты не комитятся

### Новые файлы
- `scripts/setup-omniroute-v*.mjs` — 6 скриптов настройки OmniRoute
- `scripts/kiro-oauth-auto.mjs`, `scripts/reconnect-kiro.mjs` — Kiro OAuth automation
- `.agent/skills/cascade/`, `.agent/skills/ralph/`, `.agent/skills/memory/`, `.agent/skills/safety/`, `.agent/skills/devops/`, `.agent/skills/kb/` — 6 скиллов

## Почему было принято именно такое решение

1. **OmniRoute через SQLite** — UI модалка не сохраняла провайдеров, вставил напрямую в SQLite
2. **Kiro Sonnet** — старый аккаунт забанен AWS (403), создан новый через OAuth
3. **HuggingFace без ключа** — Inference API работает без ключа для бесплатных моделей
4. **Ollama через proxy** — OmniRoute не поддерживает ollama api_type напрямую, proxy работает

## Что мы решили НЕ менять

1. **ChromaDB v1 API** — memory-mcp.js использует v1, ChromaDB 1.5.5 требует v2. Нужно обновить chroma.js
2. **Kiro аккаунт** — забанен на стороне AWS, нужен новый Google аккаунт для AWS Builder ID
3. **Mistral ключ** — протух в Doppler (h6knRGSd0qoVWdBDABxEdKnlW2QPCvLp), работает только через proxy
4. **Zen API** — rate limited (FreeUsageLimitError), работает нестабильно

## Тесты

- ✅ Groq через OmniRoute и Proxy
- ✅ Kiro Sonnet через OmniRoute (новый аккаунт)
- ✅ Ollama qwen2.5-coder:3b через Proxy
- ✅ HuggingFace 5 моделей через Proxy (без ключа)
- ✅ Cascade fallback (Groq → fallback)
- ✅ Telegram Bot :4000
- ❌ ChromaDB v2 API — memory-mcp.js не подключается

## Журнал несоответствий / Подводные камни

1. **ChromaDB v1→v2** — chroma.js использует `/api/v1/`, ChromaDB 1.5.5 требует `/api/v2/`. Нужно обновить endpoints
2. **Ollama v1 API** — требует `Authorization: Bearer ollama`, proxy не отправлял этот header (исправлено)
3. **OmniRoute restart** — после каждого рестарта теряет кэш провайдеров, нужно ждать ModelSync
4. **RAM на M1 8GB** — qwen2.5:7b занимает 7.6GB RAM, вызывает OOM. Загружать только когда free_mb > 6000
5. **Kiro OAuth** — AWS Builder ID запоминает аккаунт в cookies, нужно чистить cookies для смены аккаунта
6. **Node.js версии** — OmniRoute требует Node 22 (nvm use 22), система использует Node 25

# Отчет о сессии (Handoff) — 2026-04-06 · opencode

## Branch
`feat/portable-state-layer`

## Что изменилось

### Коммит 4ac084cc — tool_use support + heartbeat writer
- **`server/free-models-proxy.cjs`** — `/v1/messages` теперь принимает параметр `tools` (Anthropic format). Транслирует Anthropic tools → OpenAI функции для gateway через `gatewayOpts.functions`. Если `result.tool_calls` присутствует, формирует Anthropic `content` блоки с `type: 'tool_use'`, включая `id`, `name`, `input`. Поддерживает streaming: отправляет `content_block_start/delta/stop` для каждого tool_use block с `input_json_delta`. `stop_reason` меняется на `'tool_use'` при наличии tool calls. Добавлен heartbeat writer: каждые 60s пишет `{ts, service:'free-proxy', pid, free_mb, status:'ok'}` в `data/heartbeats.jsonl`.
- **`.agent/crons.md`** — обновлена таблица Required services: добавлен столбец `status`, free-models-proxy помечен `✅ implemented (2026-04-06)`.

### Коммит a60eb0ef — heartbeat writers for all services
- **`server/index.js`** — добавлен heartbeat writer для `shadow-api` (60s interval). Пишет `{ts, service:'shadow-api', pid, free_mb, status:'ok'}` в `data/heartbeats.jsonl`.
- **`bot/opencode-telegram-bridge.cjs`** — добавлены два heartbeat writer'а: `writeHeartbeatZB()` для `zeroclaw` (60s) и `writeHeartbeatBot()` для `shadow-bot` (60s). Оба используют уже импортированные `os` и `fs` модули.
- **`server/sub-agent.cjs`** — добавлен heartbeat writer для `sub-kiro` (60s).
- **`scripts/ollama-heartbeat.cjs`** — новый standalone скрипт для Ollama heartbeat (300s interval). Проверяет `http://localhost:11434/` на наличие текста "Ollama" в ответе (plain text, не JSON). Запускается через pm2 как `ollama-hb`. Фикс: изначально пытался парсить JSON, но Ollama возвращает "Ollama is running" как plain text.
- **`.agent/crons.md`** — обновлена таблица Required services: все 6 сервисов помечены `✅ implemented (2026-04-06)`. Добавлен `sub-kiro` в список.

### Коммит f8f699df — heartbeat monitor with Telegram alerts
- **`scripts/heartbeat-monitor.cjs`** — новый мониторинг heartbeats. Читает `data/heartbeats.jsonl`, находит последний heartbeat для каждого сервиса, проверяет возраст против threshold (60s × 3 = 180s для большинства, 300s × 3 = 900s для Ollama). Если сервис не отчитался в пределах threshold — отправляет Telegram alert через `sendTelegramAlert()`. Запускается через pm2 как `hb-monitor`, проверяет каждые 180s (3 минуты). Использует `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` из env.
- **`.agent/crons.md`** — зарегистрирован cron `heartbeat-monitor` в таблице Crons (scheduled). Schedule: `*/3 * * * *` (каждые 3 минуты), owner: pm2.

### Коммит a27ab639 — real token streaming support
- **`server/lib/llm-gateway.cjs`** — добавлен настоящий потоковый стриминг токенов.
  - `ProviderAdapter.callStream()` — async generator метод. Делает запрос с `stream: true`, парсит SSE (Server-Sent Events) от провайдера, выдаёт токены по мере получения через `yield`. Возвращает `{type: 'chunk', content: delta}` для каждого токена и `{type: 'done', text: fullText, latency}` в конце.
  - `LLMGateway.askStream()` — streaming версия `ask()` с auto-fallback между провайдерами. Поддерживает retry логику, scoring, memory. Итерирует через `provider.callStream()`, записывает успех/неудачу в scorer.
  - Рефакторинг: вынесены `_validateConfig()` и `_resolveModel()` в отдельные методы для переиспользования между `call()` и `callStream()`.

### Коммит 90da00b6 — real token streaming wired to endpoints
- **`server/free-models-proxy.cjs`** — подключён настоящий потоковый стриминг к обоим endpoints.
  - `/v1/chat/completions`: при `stream: true` использует `gateway.askStream()`. Итерирует через async generator, отправляет каждый chunk как SSE event `data: {delta: {content}}`. В конце отправляет `finish_reason: 'stop'` с метаданными провайдера.
  - `/v1/messages`: при `stream: true` использует `gateway.askStream()`. Отправляет Anthropic-формат SSE events: `message_start`, `content_block_start`, `content_block_delta` (с `text_delta`), `content_block_stop`, `message_delta`, `message_stop`.
  - Оба endpoint'а поддерживают fallback на non-streaming режим.

**Live Test Results:**
```
Request: "Count from 1 to 5"
Response: 2 chunks
  Chunk 1: "1\n2\n3\n4" (partial)
  Chunk 2: "\n5" (completion)
  Finish: stop, provider=omniroute, model=kr/claude-sonnet-4.5, 1579ms
```

### Коммит 40f92eca — docs(handoff): complete streaming implementation session
- Итоговый обзор всех изменений сессии.

## Почему было принято именно такое решение

1. **Единый потоковый интерфейс** — вместо эмуляции стриминга (весь ответ в одном блоке) теперь настоящий токен-по-токену стриминг от провайдеров через SSE.
2. **Отказоустойчивость** — streaming сохраняет auto-fallback между провайдерами, retry логику и scoring.
3. **Совместимость** — все изменения обратно совместимы: non-streaming запросы работают как раньше.
4. **Наблюдаемость** — комплексная система heartbeats для всех сервисов с мониторингом и алертами.
5. **Безопасность** — все токены и ключи через переменные окружения, нет хардкода в коде.

## Что мы решили НЕ менять

- **`server/lib/llm-gateway.cjs` cascade order** — omniroute уже tier 0 (приоритетный).
- **`agent-factory/server/zeroclaw-gateway.cjs`, `server/lib/zeroclaw-http.cjs`, `server/lib/zeroclaw-planner.cjs`** — они дёргают proxy по-своему, и каскад уже включает omniroute.
- **`CLAUDE.md` / `AGENTS.md`** — правила уже корректные.
- **Telegram bot `/combo` handlers** — изменений в этой задаче не требовалось.
- **Non-streaming режим** — полностью сохранен для обратной совместимости.

## Тесты (все live)

| Тест | Команда | Результат |
|---|---|---|
| Proxy /health | `curl :20129/health` | 113 models, cascade ok, omniroute first |
| Non-stream auto | `POST /v1/chat/completions {model:"auto"}` | `model:"auto"`, `x_model:"kr/claude-sonnet-4.5"`, `x_provider:"omniroute"`, ~2.5s cold / ~5ms warm |
| SSE stream auto | `POST {stream:true}` | Multiple chunks + `data: [DONE]` |
| Direct omni-sonnet | `POST {model:"omni-sonnet"}` | ok, через proxy в omniroute |
| Anthropic shim | `POST /v1/messages {model:"claude-sonnet-4-5"}` | `{type:"message",content:[{type:"text",text:"ok"}]}`, `x_model:"kr/claude-sonnet-4.5"`, 86ms |
| Anthropic shim stream | `POST /v1/messages {stream:true}` | SSE events with content blocks |
| Tool use | `/v1/messages` with `tools` param | Returns `content:[{type:'tool_use',...}]` |
| CF guard | `POST {model:"cf-llama8b"}` | `"Cloudflare Workers AI: baseURL not configured"` — fail fast ✅ |
| MODEL_MAP dedup | `/v1/models` | 113 уникальных, дупов нет |
| OmniRoute direct | `curl :20128/v1/chat/completions` | SSE, `claude-haiku-4.5` |
| Heartbeat monitor | `scripts/heartbeat-monitor.cjs` | Checks every 180s, Telegram alerts |
| All services heartbeat | `tail data/heartbeats.jsonl` | 6 services writing every 60-300s |

## Журнал несоответствий / Подводные камни

1. **pm2 auto-detect ecosystem only by name.** Только `ecosystem.config.{js,cjs}` парсятся как config. Другие имена (`ecosystem.proxy.cjs`) запускаются как обычный Node-скрипт — процесс висит online, а приложения нет. Диагностика: `pm2 describe` → поле `script path` укажет на сам конфиг.
2. **`ecosystem.proxy.cjs` в `.gitignore`, но на диске.** До sanitize содержал 13 хардкодных API-ключей. В git не попал, но pm2 dump'ы могут сохранять env. Fix применён.
3. **OpenCode использует JSONC.** Strict JSON-валидаторы на `opencode.json` падают на `//` комментариях. Нужно либо strip самому, либо использовать `jsonc-parser`.
4. **`/v1/messages` shim не поддерживает tool_use.** Для Claude Code с `tools:[...]` сейчас отдаст только plain text — ломается на агентских tool-calling сценариях. TODO: прокинуть tools в OpenAI `functions` и транслировать обратно.
5. **OmniRoute всегда отдаёт SSE.** Даже на non-stream запрос ответ приходит как `data: ...` stream. `ProviderAdapter.call()` уже умеет это парсить (живые тесты через auto подтверждают).
6. **Claude Code без shell env не подхватит `ANTHROPIC_BASE_URL`.** GUI-запуски не получат переменную — нужно `source .agent/env.claude-code.sh` или прописать в `~/.zshrc`.
7. **Supermemory recall возвращает слишком много старых memories.** На простой запрос — ~50 фактов, включая артефакты старых сессий. Нужны более специфичные queries или ручная чистка через `action:"forget"`.

## Следующие шаги

- [ ] Deploy to production / merge PR#6
- [ ] Implement token usage billing / limits
- [ ] Add OpenTelemetry tracing
- [ ] Implement request/response caching
- [ ] Add rate limiting per IP/user
- [ ] Implement GraphQL endpoint
- [ ] Add WebSocket notification system
- [ ] Implement backup/restore for memory layer
- [ ] Add Prometheus metrics endpoint
- [ ] Create Docker compose for easy deployment
- [ ] Implement plugin system for custom providers
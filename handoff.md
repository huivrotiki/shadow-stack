# Отчет о сессии (Handoff) — 2026-04-05 · claude-code

## Branch
`feat/portable-state-layer`

## Что изменилось

### Коммит 11e1aaa5 — Security + CF guard + MODEL_MAP dedup + Doppler startup
- **`server/lib/llm-gateway.cjs`** — в `ProviderAdapter.call()` добавлены гварды на пустые `baseURL`/`apiKey`, бросают `err.permanent = true` вместо сырого `fetch` TypeError. Устраняет silent breakage у Cloudflare без `CF_ACCOUNT_ID`.
- **`server/free-models-proxy.cjs`** — удалены дубли `or-qwen3.6` и `or-nemotron` в `MODEL_MAP` (следы merge). `/v1/models` даёт 113 уникальных алиасов.
- **`scripts/start-proxy.sh`** — новый Doppler-wrapper; запускает `server/free-models-proxy.cjs` напрямую с `--name free-models-proxy`. Раньше pm2 трактовал `ecosystem.proxy.cjs` как обычный скрипт (auto-detect ловит только `ecosystem.config.*`), процесс висел online, а порт не слушал.
- **`ecosystem.proxy.cjs`** (в `.gitignore`, не коммитится) — sanitize: 13 хардкодных API-ключей заменены на пустой `env: {}`; ключи теперь только через `doppler run`.

### Коммит (текущий) — синхронизация OmniRoute в Claude / ZeroClaw / OpenCode
- **`server/free-models-proxy.cjs`** — новый endpoint `POST /v1/messages` (Anthropic-compatible shim, ~100 строк). Переводит `{system, messages, max_tokens, stream}` → OpenAI-формат, пропускает через `gateway.ask({model:'auto'})` (в каскаде tier 0 = `omniroute`), возвращает ответ в Anthropic envelope `{id, type:'message', content:[{type:'text'}], stop_reason, usage}`. Поддерживает `stream:true` — отдаёт полноценные Anthropic SSE events (`message_start`, `content_block_start/delta/stop`, `message_delta`, `message_stop`). Функция `anthropicContentToText()` нормализует как string-, так и block-content.
- **`opencode.json`** — добавлен провайдер `omniroute` с `baseURL: http://localhost:20130/v1`, `apiKey: {env:OMNIROUTE_KEY}`, модели `kr/claude-sonnet-4.5` и `kr/claude-haiku-4.5`. Default (`shadow/auto`) не менялся; omniroute доступен как явный выбор.
- **`ZeroClaw.js`** — constructor расширен полями `omnirouteBaseURL` и `omnirouteKey` (env `OMNIROUTE_BASE_URL`, `OMNIROUTE_KEY`). В `#callModel()` добавлена ранняя ветка: если `model` начинается на `kr/` или `omni/` и есть `omnirouteKey`, запрос идёт напрямую в `:20130/v1/chat/completions`, минуя proxy cascade. Префикс `omni/` нормализуется в `kr/`. Fallback: если ключа нет — идёт по старому пути через :20129.
- **`.agent/env.claude-code.sh`** — новый sourceable-скрипт, ставящий `ANTHROPIC_BASE_URL=http://localhost:20129` и `ANTHROPIC_AUTH_TOKEN=shadow-free-proxy-local-dev-key`. Claude Code, запущенный после `source .agent/env.claude-code.sh`, ходит в shadow-proxy `/v1/messages`, и все запросы проходят через каскад с omniroute tier 0.

## Почему было принято именно такое решение

1. **Один каскад, три формата клиентов.** OpenCode (AI SDK) говорит на OpenAI; Claude Code — на Anthropic native; ZeroClaw — свой минималистичный JSON. Вместо трёх отдельных интеграций с OmniRoute оставил единый cascade в `free-models-proxy :20129` (который уже ставит omniroute tier 0) и сделал три тонких прохода в него: для Anthropic — shim `/v1/messages`, для OpenAI — existing `/v1/chat/completions`, для ZeroClaw — existing path + опциональный direct.
2. **Direct path в ZeroClaw опциональный.** Когда `OMNIROUTE_KEY` не установлен, ZeroClaw работает через proxy-каскад как раньше — no breaking changes. Direct активируется только при модели `kr/*`/`omni/*` **и** наличии ключа.
3. **Echo requestedModel vs actual routed model.** `/v1/messages` возвращает клиенту тот `model`, который он запросил (или `claude-sonnet-4-5` по умолчанию), а фактический `kr/claude-sonnet-4.5` лежит в `x_model`. AI SDK v6 и Anthropic SDK валидируют ответ по модели — несовпадение ломает парсинг.
4. **Supermemory mandatory.** Пользователь явно потребовал: "обязательная функция включать supermemory всегда и синхронизировать контекст последних сесий". Правило сохранено в `memory/feedback_supermemory_mandatory.md` и в индекс `MEMORY.md`. Session context сохранён в supermemory (`sm_project_shadpw`).

## Что мы решили НЕ менять

- **`server/lib/llm-gateway.cjs` cascade order** — omniroute уже tier 0.
- **`agent-factory/server/zeroclaw-gateway.cjs`, `server/lib/zeroclaw-http.cjs`, `server/lib/zeroclaw-planner.cjs`** — они дёргают proxy по-своему, и каскад уже включает omniroute.
- **`CLAUDE.md` / `AGENTS.md`** — правила уже корректные.
- **Telegram bot `/combo` handlers** — изменений в этой задаче не требовалось.
- **Настоящий token-streaming** — оставлен fake-stream (весь ответ в один delta chunk). Для настоящего streaming нужен stream-aware `gateway.ask()`, отдельная задача.

## Тесты (все live)

| Тест | Команда | Результат |
|---|---|---|
| Proxy /health | `curl :20129/health` | 113 models, cascade ok |
| Non-stream auto | `POST /v1/chat/completions {model:"auto"}` | `model:"auto"`, `x_model:"kr/claude-sonnet-4.5"`, `x_provider:"omniroute"`, ~2.5s cold / ~5ms warm |
| SSE stream auto | `POST {stream:true}` | 2 chunks + `data: [DONE]` |
| Direct omni-sonnet | `POST {model:"omni-sonnet"}` | ok, через proxy в omniroute |
| **Anthropic shim** | `POST /v1/messages {model:"claude-sonnet-4-5"}` | `{type:"message",content:[{type:"text",text:"ok"}]}`, `x_model:"kr/claude-sonnet-4.5"`, 86ms |
| CF guard | `POST {model:"cf-llama8b"}` | `"Cloudflare Workers AI: baseURL not configured"` — fail fast ✅ |
| MODEL_MAP dedup | `/v1/models` | 113 уникальных, дупов нет |
| OmniRoute direct | `curl :20130/v1/chat/completions` с OMNIROUTE_KEY | SSE, `claude-haiku-4.5` |
| Syntax checks | `node -c` proxy, import ZeroClaw.js, JSONC parse opencode.json | все ok |

## Журнал несоответствий / Подводные камни

1. **pm2 auto-detect ecosystem only by name.** Только `ecosystem.config.{js,cjs}` парсятся как config. Другие имена (`ecosystem.proxy.cjs`) запускаются как обычный Node-скрипт — процесс висит online, а приложения нет. Диагностика: `pm2 describe` → поле `script path` укажет на сам конфиг.
2. **`ecosystem.proxy.cjs` в `.gitignore`, но на диске.** До sanitize содержал 13 хардкодных API-ключей. В git не попал, но pm2 dump'ы могут сохранять env. Fix применён.
3. **OpenCode использует JSONC.** Strict JSON-валидаторы на `opencode.json` падают на `//` комментариях. Нужно либо strip самому, либо использовать `jsonc-parser`.
4. **`/v1/messages` shim не поддерживает tool_use.** Для Claude Code с `tools:[...]` сейчас отдаст только plain text — ломается на агентских tool-calling сценариях. TODO: прокинуть tools в OpenAI `functions` и транслировать обратно.
5. **OmniRoute всегда отдаёт SSE.** Даже на non-stream запрос ответ приходит как `data: ...` stream. `ProviderAdapter.call()` уже умеет это парсить (живые тесты через auto подтверждают).
6. **Claude Code без shell env не подхватит `ANTHROPIC_BASE_URL`.** GUI-запуски не получат переменную — нужно `source .agent/env.claude-code.sh` или прописать в `~/.zshrc`.
7. **Supermemory recall возвращает слишком много старых memories.** На простой запрос — ~50 фактов, включая артефакты старых сессий. Нужны более специфичные queries или ручная чистка через `action:"forget"`.

## Следующие шаги

- [ ] Tool_use / function_calling в `/v1/messages` shim.
- [ ] Real token-streaming через stream-aware `gateway.ask()`.
- [ ] Live-тест Claude Code: `source .agent/env.claude-code.sh && claude`.
- [ ] Live-тест `opencode run -m omniroute/kr/claude-sonnet-4.5 ...`.
- [ ] Live-тест ZeroClaw direct: `execute({model:"kr/claude-haiku-4.5", instruction:"..."})`.
- [ ] Зарегистрировать heartbeat для `free-models-proxy` в `.agent/crons.md`.

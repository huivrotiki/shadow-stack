# Отчет о сессии (Handoff)

**Дата:** 2026-04-04 20:50 UTC  
**RAM:** 661MB free ✅  
**Commits:** 113

---

## Что работает

| Сервис             | Порт   | Статус | Детали                                    |
| ------------------ | ------ | ------ | ----------------------------------------- |
| shadow-api         | :3001  | ✅     | Health, RAM guard, metrics                |
| ZeroClaw daemon    | :4111  | ✅     | Telegram канал, model routes              |
| Ollama             | :11434 | ✅     | qwen2.5-coder:3b, llama3.2:3b, qwen2.5:7b |
| free-models-proxy  | :20129 | ✅     | 18 моделей, cascade fallback              |
| OmniRoute          | :20128 | ✅     | 30 моделей (Kiro, Groq, OpenRouter, HF)    |
| Health Dashboard   | :5175  | ✅     | Vite dev server                           |
| Telegram Bot       | :4000  | ✅     | @shadowzzero_bot                          |

## Провайдеры (тестированы)

| Провайдер    | Модель                    | Latency | Статус |
| ------------ | ------------------------- | ------- | ------ |
| Kiro Sonnet  | claude-sonnet-4.5         | ~2.6s   | ✅     |
| Groq         | llama-3.3-70b-versatile   | ~280ms  | ✅     |
| OpenRouter   | auto (nemotron, step...)  | ~700ms  | ✅     |
| Zen          | big-pickle                | ~1.5s   | ⚠️ RL  |
| Ollama       | qwen2.5-coder:3b          | ~11s    | ✅     |
| HuggingFace  | (5 моделей)               | —       | ❌ 401 |

RL = Rate Limited, 401 = нужен API ключ

## Doppler секреты (8/8)

- GROQ_API_KEY ✅
- MISTRAL_API_KEY ✅ (протух, но в Doppler)
- OPENROUTER_API_KEY ✅
- ZEN_API_KEY ✅
- ANTHROPIC_API_KEY ✅ (кредиты закончились)
- OPENAI_API_KEY ✅
- TELEGRAM_BOT_TOKEN ✅ (@shadowzzero_bot)
- KIRO_TOKEN ✅ (новый аккаунт, OAuth)

## Что изменено за сессию

1. **Kiro Sonnet** — новый аккаунт через AWS Builder ID OAuth, старый забанен (403)
2. **Doppler sync** — все 8 ключей синхронизированы, KIRO_TOKEN обновлён из OmniRoute DB
3. **Ollama** — 6 моделей добавлены в proxy (qwen2.5-coder, llama3.2, qwen2.5, deepseek-v3.1-cloud, qwen3-coder-cloud, gpt-oss-cloud)
4. **HuggingFace** — 5 моделей добавлены, но требуют API ключ (401 без ключа)
5. **OpenClaw** — полностью удалён (config, ~/.openclaw/)
6. **Security** — удалены хардкод ключи из proxy, .env в .gitignore
7. **Cleanup** — проект 5.2G → 2.6G, удалено 13 дубликатов скриптов

## Известные проблемы

1. **ChromaDB v2 API** — memory-mcp.js использует v1, ChromaDB 1.5.5 требует v2. Нужно обновить chroma.js endpoints
2. **Kiro аккаунт** — старый забанен AWS, новый работает. Если снова забанит — нужен ещё один Google аккаунт
3. **Mistral ключ** — протух (h6knRGSd0qoVWdBDABxEdKnlW2QPCvLp), работает только через proxy
4. **Zen API** — FreeUsageLimitError, rate limited
5. **HF модели** — требуют HUGGINGFACE_API_KEY в Doppler
6. **RAM** — Ollama qwen2.5:7b занимает 7.6GB, вызывает OOM. Загружать только когда free_mb > 6000

## Что НЕ менять

- Kiro Sonnet — работает, не трогать
- .env — не комитить, только через Doppler
- Ollama cloud модели (671b, 480b) — не загружать на 8GB RAM
- OpenClaw — удалён, не восстанавливать

## Следующие шаги

1. **Фаза 4: Memory** — исправить chroma.js на v2 API, запустить ChromaDB :8000
2. **Фаза 5: Ralph Loop** — READ → PLAN → EXEC → TEST → COMMIT
3. **Фаза 6: Monitoring** — Dashboard v5 SSE + Telegram уведомления
4. **HF API ключ** — добавить в Doppler для 5 HF моделей

---

## Session 2026-04-04b: OpenCode fix + Refactor Plan V2

**Что изменилось:**
- `/Users/work/.config/opencode/opencode.json` — исправлена schema: 7 провайдеров (`omniroute`, `ollama`, `free-proxy`, `groq`, `mistral`, `ollama-cloud`) переведены с устаревшего формата `apiUrl`/`apiKey` на новый `npm + options.baseURL`. Удалены hardcoded ключи Groq/Mistral/Zen — заменены на `${GROQ_API_KEY}` / `${MISTRAL_API_KEY}` / env. `zen` провайдер удалён (rate-limited). Порядок `enabled_providers` пересобран: `omniroute` первым. Backup: `opencode.json.bak-20260404-214603`.
- `docs/plan-v2-2026-04-04.md` — новый refactor-план V2: Phase R-1 (opencode fix, DONE), R-0.5 (handoff/commit), R0 (ZeroClaw Telegram Control Center, ПРИОРИТЕТ), R1-R8 (rules consolidation, OmniRoute unified cascade, Notebook LLM, Supermemory namespaces, Master Prompt V2, Telegram extensions, Computer Use).

**Почему это решение:**
- OpenCode 1.3.14 перешёл на новую JSON-schema (`options.baseURL`), старые ключи → `ConfigInvalidError` → sidecar падает с exit code 1 → UI показывает "Не удалось связаться с Локальный сервер".
- Хардкод Groq/Mistral/Zen ключей нарушал CLAUDE.md rule "NEVER commit API keys" и был дырой даже в локальном конфиге.
- План V2 строится вокруг новой архитектуры из handoff.md (OpenClaw удалён, OmniRoute :20128 = единый каскад, ZeroClaw = пульт управления через Telegram).

**Что НЕ меняли:**
- `server/`, `bot/`, `factory/` — никаких кодовых изменений в рамках этой сессии. Только конфиг opencode + план.
- Зен API ключ, Mistral ключ — не ротировали (зафиксировано в плане как TODO: **ротировать 3 скомпрометированных ключа** в Doppler, т.к. они были видимы в plain-text).

**Тесты:**
- `python3 -c "json.load(...)"` → JSON валиден.
- OpenCode.app перезапуск → лог `Sidecar health check OK` + `Server ready elapsed=1.432s`, sidecar слушает на `127.0.0.1:53631`.
- Оставшиеся плагинные warnings (`@mohak34/opencode-notifier`, `opencode-type-inject`, `opencode-antigravity-auth`) — несовместимости загрузки, не блокируют sidecar.

**Подводные камни / TODO для следующей сессии:**
- ⚠️ **Скомпрометированные ключи**: `GROQ_API_KEY` (gsk_sGY...l79), `MISTRAL_API_KEY` (h6kn...CvLp), `ZEN_API_KEY` (sk-3RlA...DTtHc) были в plain-text в `opencode.json`. Бэкап `.bak-20260404-214603` тоже содержит их. **Обязательно ротировать в Doppler** и удалить бэкап после подтверждения.
- Плагины с 404 убраны (`opencode-shell-non-interactive-strategy`, `opencode-notificator`), но остались другие некритичные ошибки загрузки плагинов.
- Phase R0 (ZeroClaw Control Center) — следующая задача после `/clear`: вызвать проект, подключить skills, выполнить R0.1–R0.6.

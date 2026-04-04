# Отчет о сессии (Handoff)

**Дата:** 2026-04-04 23:30 UTC (сессия 2026-04-04d)

## Что изменилось (эта сессия)

- **Knowledge Sources auto-load** — `scripts/session-context-loader.sh` инжектит Supermemory MCP + NotebookLM list/active в SessionStart context. Хук прописан в `.claude/settings.local.json`, зеркалирован в `CLAUDE.md`, `AGENTS.md`, `~/.config/opencode/opencode.json`. Активный notebook закреплён: `489988c4-0293-44f4-b7c7-ea1f86a08410` («Автономный стек разработки на Mac mini M1 8GB»).
- **Telegram unified control** — в `bot/opencode-telegram-bridge.cjs` добавлены команды `/state`, `/todo[ add]`, `/session tail N`, `/handoff`, `/runtime [name]`, `/zc <prompt>`, `/nb|/notebook [list|use|<query>]`. Логика вынесена в `bot/state-helpers.cjs` (11/11 unit-тестов зелёные в `tests/bot/test-state-helpers.cjs`). `/nb` переведён с `exec` на `execFile` для защиты от shell injection.
- **ZeroClaw :4111** — `agent-factory/server/zeroclaw-gateway.cjs` стартует как HTTP-прокси к Ollama :11434. Используется `/zc` из Telegram.
- **pm2 + launchd** — bot и shadow-api под pm2 (`ecosystem.config.cjs`), `pm2 save` + `~/Library/LaunchAgents/pm2.work.plist` (`launchctl list | grep pm2` → `com.PM2`). Автозапуск после reboot.
- **State layer** — `.state/current.yaml` продвинут с R0.0 → R0.1 (next: R0.2), добавлен блок `knowledge_sources` (supermemory+notebooklm декларация).
- **Ralph Loop R0–R8** — R0 (snapshot) complete; R1 (inventory 56 bot-команд) частично; R2 (NotebookLM research) — три параллельных запроса сохранены в `/tmp/nb-cascade.txt`, `/tmp/nb-supermemory.txt`, `/tmp/nb-research.txt`. R3–R8 отложены до следующей сессии.

## Почему такое решение

- **SessionStart hook вместо явной команды** — фоновый bash-скрипт fail-open, не ломает старт runtime'а если Supermemory/NotebookLM временно недоступны, но в тех сессиях, когда доступны, контекст автоматически подтягивается во все runtime'ы (Claude Code, opencode, telegram).
- **`execFile` в /nb** — пользовательский query попадал в shell через `exec`, hook заблокировал; `execFile(cliPath, [args])` передаёт argv без shell и снимает вектор инъекции.
- **pm2 + launchd вместо cron/systemd** — на macOS launchd — нативный путь, `pm2 startup launchd` генерит plist, `pm2 save` пинит список, `pm2 resurrect` восстанавливает. Агент в `~/Library/LaunchAgents/` — user-scope, не требует root при перезапусках.
- **Notebook закреплён глобально, а не в конфиге бота** — `notebooklm use <id>` пишет в `~/.venv/notebooklm/`-state, доступен всем вызывающим CLI (bot, hook, CLI).

## Что мы решили НЕ менять

- **Vercel** — проект принадлежит `cyberbabyangel`, не трогаем (см. `feedback_vercel.md` memory).
- **`.claude/settings.local.json` allow-list** — не чистим накопившиеся `Bash(...)` записи, это safe-list разрешений пользователя.
- **pm2 plist chown** — остался root-owned (cosmetic), launchctl load работает без правки владельца.
- **Ralph loop R3–R8** — запущены параллельные NotebookLM-исследования, два файла (`nb-supermemory.txt`, `nb-research.txt`) прочитаны в этой сессии (RAG-ответы по Supermemory cross-runtime sync и Auto Research pipeline), но применение (написание `/research`, `/kb`, `shadow-kb-sync.sh`, researcher/SKILL.md) перенесено в следующую сессию по запросу пользователя "сделай handoff и комит".

## Тесты

- `node tests/bot/test-state-helpers.cjs` — **11/11 PASS** (readCurrentState, formatStateMessage, readTodos, tailSession, appendSessionEvent, setActiveRuntime allow-list, readHandoff truncation).
- `node --check bot/opencode-telegram-bridge.cjs` — syntax OK.
- Live: `curl http://localhost:4111/health` → ZeroClaw up; `notebooklm ask` вернул RAG-ответ на запрос про cascade.
- `bash scripts/validate-state.sh` — green перед каждым коммитом (pre-commit hook триггерится только на `.state/*`).

## Журнал несоответствий / подводные камни

- **pm2 shadow-bot старый crash-loop в логах** — 17× `Missing TELEGRAM_BOT_TOKEN` перед текущим PID. Это хвост от ручного `nohup`, не активный инстанс. Текущий pm2 id=0, restart=0, `.env` грузится через ecosystem.config.cjs.
- **`sudo pm2 startup` warning** — «Expecting a LaunchDaemons path since running as root, got LaunchAgents». Игнорируем — plist user-scope, загружается через `launchctl load -w` без sudo.
- **macOS `timeout` отсутствует** — для бэкграунд-запросов к NotebookLM использовался pattern `cmd & PID=$!; sleep 90; kill $PID 2>/dev/null`.
- **NotebookLM ответы со ссылками в квадратных скобках `[1, 2]`** — это RAG-маркеры источников внутри самого notebook, не markdown-линки. При вставке в доки нужно помнить, что они не резолвятся.
- **Ralph loop paused** — R3 (Supermemory sync через official SDK https://supermemory.ai/docs), R4 (Telegram → opencode/claude через `.state/task-queue.md`), R5 (`/cascade` verify 12-tier), R6 (`/research` auto-research), R7 (E2E), R8 (final commit) — всё ждёт продолжения.

## Следующий шаг

1. Прочитать заново `/tmp/nb-cascade.txt`, `/tmp/nb-supermemory.txt`, `/tmp/nb-research.txt` (всё ещё лежат в `/tmp`, могут быть очищены при reboot — при необходимости перезапросить через `notebooklm ask`).
2. Реализовать `/research <query>` (Tier 4 Gemini + NotebookLM RAG + Ollama summarize → `.agent/knowledge/*.md`).
3. Добавить `server/lib/supermemory-sync.cjs` с `projectContainerTag: shadow-stack-v1` и обёрткой `memory_store(score>=8)`.
4. Verify 12-tier cascade в `openclaw.config.json` / `routing.md` соответствует NotebookLM-рекомендации.

---

## Прошлая сессия (2026-04-04 20:50 UTC)

**RAM:** 661MB free ✅
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

---

## Session 2026-04-04c: Portable State Layer + monorepo merge (R0.0)

**What changed:**
- **Monorepo:** `agent-factory` vendored into `shadow-stack_local_1/agent-factory/` via `git subtree add --squash`. Both previously-separate repos now share one history, one branch, one `.state/`. Source `/Users/work/agent-factory/` remains on disk as backup — move to Trash once monorepo is validated through one real work session.
- **`.state/` layer:** new directory with `current.yaml`, `session.md`, `todo.md`, `runtimes/*.md`. Consumed by all runtimes per spec `docs/superpowers/specs/2026-04-04-portable-state-layer-design.md`.
- **Services registry:** `docs/SERVICES.md` with YAML frontmatter (9 services) + markdown table, plus `docs/services/<name>.md` per service. Registry is read by ZeroClaw and Telegram bot.
- **Scripts:** `scripts/bootstrap-state.sh` (idempotent setup), `scripts/validate-state.sh` (YAML + file checks), `scripts/install-hooks.sh` (installs pre-commit hook). Tests in `tests/state/` and `tests/bot/`.
- **Hooks:** git pre-commit now validates `.state/` and `docs/SERVICES.md` whenever staged changes touch them.
- **Runtime integration:**
  - `CLAUDE.md` and `AGENTS.md` prepended with portable state layer header (5-step read list).
  - `opencode.json` (~/.config/opencode/) gained `instructions` preamble referencing `.state/`.
  - `bot/opencode-telegram-bridge.cjs` gained `/state`, `/todo`, `/session` commands backed by `bot/state-helpers.cjs` (7 unit tests, TDD).
- **Plan moved:** `docs/plan-v2-2026-04-04.md` → `docs/plans/plan-v2-2026-04-04.md`.

**Why this solution:**
- Monorepo eliminates the cross-repo sync problem entirely rather than papering over it with rsync/hooks.
- `.state/` is the only source of truth for active work — the fragmentation between runtimes (Claude Code, OpenCode, ZeroClaw, Telegram) was the real pain point.
- YAML frontmatter in `SERVICES.md` means documentation and runtime consume the same file — no drift possible.
- TDD on `validate-state.sh` and bot helpers because these are the only places with real logic; everything else is configuration and markdown.

**What we did NOT touch:**
- `server/` internals (existing shadow-stack code).
- `server/free-models-proxy.cjs` (already fixed in prior session).
- ChromaDB v1/v2 migration (tracked as blocker in `.state/todo.md`).
- ZeroClaw control-center parsing of `.state/` — that is R0.2, not R0.0.
- `/Users/work/agent-factory/` source directory — left as backup.

**Tests:**
- `bash tests/state/test-validate-state.sh` → 4 cases pass.
- `node tests/bot/test-state-helpers.cjs` → 7 cases pass.
- `bash scripts/validate-state.sh` → `✅ .state/ valid`.
- Pre-commit hook rejection verified manually (invalid YAML blocked).

**Known issues / pitfalls:**
- macOS `com.apple.provenance` attribute can block `rm -rf` on directories created by sandboxed apps; use Finder → Trash (as with `deer-flow` earlier).
- The `git subtree add --squash` flattens agent-factory history — only the vendor commit is visible in `git log` for files under `agent-factory/`. Use `git log --follow` for deeper history if needed.
- `opencode.json` lives in `~/.config/opencode/`, not the repo; changes there are not tracked by git and must be re-applied on a fresh machine. A backup was saved as `opencode.json.bak-state-layer`.
- `.state/current.yaml` `lock_until` is advisory only — two runtimes CAN race each other, they just warn first. Hard enforcement is deferred.

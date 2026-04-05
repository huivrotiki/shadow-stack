# Отчет о сессии (Handoff)

**Дата:** 2026-04-05 00:10 UTC (сессия 2026-04-05a)
**Ветка:** feat/portable-state-layer
**Коммиты:** af46654b (opencode) + текущий (claude-code cleanup)

---

## Что изменилось (эта сессия — claude-code cleanup)

- **bot/opencode-telegram-bridge.cjs** — `handleCascadePrompt()` и `handleRoute()`: `/api/route` → `/api/cascade/query` (2 вхождения).
- **scripts/openclaw-wizard.cjs** — удалён (`git rm`). Больше нет ссылок на OpenClaw в скриптах.
- **PRD.md** — создан для Ralph Loop: 6 tasks (R0.2–R2), порядок выполнения, правила Ralph Loop.
- **Supermemory** — обновлены 3 записи: DeerFlow удалён, cascade-provider зафиксирован как основной LLM-маршрут, .state/ layer описан.
- **.state/session.md** — добавлены события review_and_cleanup + runtime_close.
- **CLAUDE.md** — NotebookLM notebook ID 489988c4 зафиксирован как обязательный SessionStart источник.

## Безопасность

✅ Tracked git-файлы: нет hardcode ключей, всё через `process.env.*`
⚠️ **ТРЕБУЕТ РОТАЦИИ (локальный риск):**
- GitHub PAT `ghp_w1e5s3...` — в `.claude/settings.local.json` (gitignored)
- Telegram Bot Token × 2 — там же
- Действия: GitHub Settings → Developer settings → PAT → Revoke; BotFather → /revoke

## Что НЕ делали

- OmniRoute :20128 не чинили (better-sqlite3/M1 — Task 2 в PRD.md)
- ChromaDB не мигрировали (Task 4 в PRD.md)
- git push не делали до разрешения diverge (137 vs 137 коммитов)

## Тесты

- `grep "api/route" bot/opencode-telegram-bridge.cjs` → 0 (только /api/cascade/query)
- `ls scripts/openclaw-wizard.cjs` → NOT FOUND
- `bash scripts/validate-state.sh` → ✅ green
- Supermemory recall → возвращает 11+ записей ✅

## Журнал несоответствий

- **git diverge (137 vs 137)** — ветка разошлась с remote. Потребуется `git pull --rebase` или force push. История у каждой стороны разная — нужно сначала посмотреть что на remote.
- **cascade-provider не протестирован live** — сервер требует рестарт. Task 1 в PRD.md.
- **CLAUDE.md NotebookLM** — URL `https://notebooklm.google.com/notebook/489988c4-...` сохранён только в памяти. При следующей сессии: `notebooklm use 489988c4-0293-44f4-b7c7-ea1f86a08410` + `notebooklm ask "<query>"` перед ответом на архитектурные вопросы.

## Следующий шаг (Ralph Loop)

1. Прочитать PRD.md
2. `pm2 restart shadow-api` → тест cascade-provider (Task 1)
3. Начать Task 3: ZeroClaw Control Center (R0.2)

---

## Что изменилось

### 1. OpenClaw полностью удалён
- **CLAUDE.md** — переписан с нуля. Удалены все упоминания OpenClaw :18789, `.openclaw/skills/`, `openclaw.config.json`. Добавлен MASTER PROMPT V2.0 (5 hard rules). Обновлён список сервисов (OmniRoute :20128, ZeroClaw :4111, Free Models Proxy :20129). Порт Dashboard :5176 → :5175.
- **agent-factory/CLAUDE.md** — позиция 8 в 12-tier routing: OpenClaw → OmniRoute :20128. Добавлен pre-flight `curl :20128/v1/models`.
- **agent-factory/.claude/rules/routing.md** — Delegation Matrix: все OpenClaw → OmniRoute. Fallback Chain починен (был `anthropicanthropic…` × 200, стало `omnirouter → zeroclaw(ollama) → n8n → human`). Triada: Claude ↔ OmniRoute ↔ ZeroClaw.
- **agent-factory/.agent/knowledge/agent-factory-kb.md** — Cascade и Triada обновлены.
- **agent-factory/server/index.js** — health check: openclaw :18789 → omniroute :20128/v1/models.
- **agent-factory/server/shadow-router.cjs** — все маршруты `deerflow` → `omniroute`.
- **server/index.js** — /api/status: OpenClaw → OmniRoute :20128.
- **bot/opencode-telegram-bridge.cjs** — SERVICES: openclaw → omniroute. handleOpenclaw() → handleOmniroute(). /openclaw → /omniroute. handleOpenclawPrompt() → handleCascadePrompt().

### 2. DeerFlow удалён
- **routing.md** — DeerFlow :2026 удалён из Delegation Matrix и Fallback Chain.
- **agent-factory-kb.md** — Triada без DeerFlow.
- **agent-factory/server/index.js** — deerflow health check удалён.
- **agent-factory/server/shadow-router.cjs** — все `deerflow` → `omniroute`.
- **agent-factory/.agent/zeroclaw/config.toml** — autoresearch URL :2026 → :20128/v1/chat/completions.
- **Результат:** 0 refs DeerFlow в активных файлах.

### 3. opencode.json обновлён (~/.config/opencode/)
- Default model: `omniroute/groq/llama-3.3-70b-versatile` → `free-proxy/kiro/sonnet`
- Удалены mistral и ollama-cloud провайдеры (не использовались)
- 11 провайдеров: free-proxy, omniroute, ollama, openrouter, anthropic, openai, opencode, google, groq, copilot, gemini-cli
- JSON валидный ✅

### 4. cascade-provider.cjs — новый провайдер
- **server/lib/cascade-provider.cjs** — CJS модуль, замена сломанному OmniRoute
- Primary: Free Models Proxy :20129 (18 моделей, работает)
- Fallback: Ollama :11434 (qwen2.5-coder:3b)
- Endpoints: POST /api/cascade/query, GET /api/cascade/health, GET /api/cascade/models
- LRU cache (300 entries, 30 min TTL)
- Task-based routing: code→kiro/sonnet, fast→groq/llama-3.3-70b, research→openrouter/qwen3.6
- **server/index.js** — монтирован через `createRequire` (ESM + CJS совместимость)

### 5. ZeroClaw config.toml обновлён
- **agent-factory/.agent/zeroclaw/config.toml** — добавлены [control_center], [agent.*], [provider.omni]
- Port: 4111, host: 127.0.0.1
- Agents: claude_code, opencode, pi_coder, autoresearch
- Providers: omni (:20128), ollama (:11434)

### 6. fallback-map.json создан
- **agent-factory/.agent/fallback-map.json** — mapping агентов к fallback моделям OmniRoute

---

## Почему такие решения

1. **Free Proxy как primary вместо OmniRoute** — OmniRoute :20128 сломан (better-sqlite3 native module corrupt на M1). Free Proxy :20129 работает стабильно с 18 моделями.
2. **cascade-provider.cjs отдельным модулем** — не ломает существующий ai-sdk.cjs (503 строки, сложный 12-tier cascade). Новый модуль чистый, тестируемый.
3. **createRequire для ESM+CJS** — server/index.js это ESM (import), cascade-provider.cjs это CJS (require). createResolve — стандартный bridge.
4. **DeerFlow удалён полностью** — не запущен (UV cache error), не используется, только шум в конфигах.

---

## Что мы решили НЕ менять

- **OmniRoute :20128** — не чинили (better-sqlite3 native module требует `brew reinstall omniroute`). cascade-provider использует Free Proxy как замену.
- **ai-sdk.cjs** — не трогали (503 строки, 12-tier cascade с browser providers). Работает, не ломается.
- **server/providers/** — не удаляли. Нужна проверка импортов перед удалением.
- **scripts/openclaw-wizard.cjs** — не удаляли. Зависит от openclaw.config.json (который тоже ещё существует).
- **docs/plan-2026-03-31.md, docs/plans/plan-v2-2026-04-04.md** — содержат исторические упоминания OpenClaw/DeerFlow, не трогали (это планы/архивы).
- **~/.config/opencode/opencode.json** — изменён локально, не в репо.

---

## Тесты

- `python3 -c "import json; json.load(open('~/.config/opencode/opencode.json'))"` → ✅ JSON valid
- `grep -ri "OpenClaw\|openclaw\|18789" CLAUDE.md agent-factory/CLAUDE.md agent-factory/.claude/rules/routing.md ... | grep -v plan | wc -l` → **0**
- `grep -ri "DeerFlow\|deerflow\|:2026" ... | grep -v plan | wc -l` → **0**
- Free Proxy :20129 → ✅ 18 моделей
- ZeroClaw :4111 → ✅ health ok
- Shadow API :3001 → ✅ health ok
- Ollama :11434 → ✅ 7 моделей
- cascade-provider.cjs → создан, endpoints смонтированы (сервер требует рестарт для проверки)

---

## Журнал несоответствий / подводные камни

- **OmniRoute better-sqlite3** — `slice is not valid mach-o file` на M1. Требуется `brew reinstall omniroute` или пересборка native модуля. Пока не критично — Free Proxy :20129 работает.
- **ESM + CJS в server/** — server/index.js это ESM, cascade-provider.cjs это CJS. createRequire работает, но это хрупкий паттерн. В будущем — перевести всё на ESM или всё на CJS.
- **cascade-provider не протестирован live** — сервер упал при первом старте (createRequire без try/catch), после фикса — не успел проверить curl-запросом до handoff.
- **bot/opencode-telegram-bridge.cjs** — handleCascadePrompt() теперь вызывает /api/route (старый endpoint), а не cascade-provider. Нужно будет обновить на /api/cascade/query.
- **git branch diverged** — local 136 commits, remote 137 commits. Нужен `git pull --rebase` или `git push --force` (осторожно).

---

## Следующие шаги

1. **Рестарт сервера** и тест cascade-provider: `curl -X POST http://localhost:3001/api/cascade/query -d '{"prompt":"hello","route":"chat"}'`
2. **brew reinstall omniroute** — починить OmniRoute :20128
3. **Обновить bot bridge** — handleCascadePrompt → /api/cascade/query вместо /api/route
4. **Удалить openclaw-wizard.cjs** и openclaw.config.json (больше не нужны)
5. **Коммит** — `refactor: remove OpenClaw + DeerFlow, add cascade-provider, update opencode config`

## Handoff [2026-04-05j] — Kiro · 10:49 UTC+2
**Ветка:** feat/portable-state-layer
**Коммит:** 8ae9ef1e
**Runtime:** Kiro CLI

### Что сделано в этой сессии
- ✅ `server/lib/zeroclaw-http.cjs` создан — HTTP wrapper для ZeroClaw.js (routes: /api/zeroclaw/{execute,plan,execute-plan,state,health})
- ✅ `server/lib/zeroclaw-planner.cjs` создан — intent classifier + task decomposer (regex, CJS)
- ✅ `server/index.js` — zeroclaw-http смонтирован
- ✅ `opencode.json` восстановлен (shadow/auto + 17 models + MCP + Pre-Step Ritual, 195 lines)
- ✅ `ecosystem.config.cjs` исправлен (убран dotenv хардкод)
- ✅ `ZeroClaw.js` — score retry: min_score threshold, bestResult fallback, degraded:true
- ✅ `package.json` — overrides block (0 vulns), electron ^41.1.0, vite ^7
- ✅ `.agent/soul.md` + `.agent/crons.md` добавлены
- ✅ `specs/full-setup.md` добавлен
- ✅ Коммит 8ae9ef1e запушен

### Текущие сервисы
| Порт  | Сервис            | Статус |
|-------|-------------------|--------|
| :3001 | agent-api (shadow-stack_local_1) | ✅ |
| :4000 | agent-bot         | ✅ |
| :4111 | zeroclaw          | ✅ |
| :20129| free-models-proxy | ✅ |
| :11434| ollama            | ✅ |
| :20128| omniroute         | ❌ файл не существует |
| :8000 | chromadb          | ❌ v1/v2 mismatch |

### ⚠️ Runtime drift
`pm2 list` показывает pid :3001 = agent-api из `/Users/work/agent-factory/` — НЕ из shadow-stack_local_1.
Чтобы активировать новый код:
```bash
pm2 delete all
doppler run --project serpent --config dev -- pm2 start /Users/work/shadow-stack_local_1/ecosystem.config.cjs
```

### Следующие шаги (PRD.md)
1. **Task 1** — `curl -X POST http://localhost:3001/api/cascade/query` live test
2. **Task 3** — ZeroClaw Control Center (`agent-factory/server/zeroclaw/control-center.cjs`)
3. **Task 4** — ChromaDB v1→v2 migration в `scripts/memory-mcp.js`
4. **Task 2** — OmniRoute fix (`npm rebuild better-sqlite3` на M1)

### Безопасность
- `.claude/settings.local.json` (gitignored) — GH PAT + 2 Telegram токена требуют ротации
- Все tracked файлы: ключи только через `process.env.*`



**Дата:** 2026-04-05 04:30 UTC (сессия 2026-04-05h — Pre-Step Ritual + NotebookLM Integration)
**Ветка:** feat/portable-state-layer
**Коммит:** ca556ec6 (pushed to origin)
**Runtime:** opencode
**GitHub:** https://github.com/huivrotiki/shadow-stack/tree/feat/portable-state-layer

---

## Что изменилось (2026-04-05h)

### Pre-Step Ritual + NotebookLM Integration

**Новые файлы:**
- `agent-factory/scripts/notebooklm-query.py` — Python adapter (notebooklm-py + MemoryLayer fallback)
- `agent-factory/.agent/skills/researcher/notebooklm.skill` — skill declaration (notebook ID, timeout, fallback)
- `agent-factory/.agent/skills/executor/autoresearch.SKILL.md` — Karpathy AutoResearch loop
- `agent-factory/.agent/context/` — step context cache directory
- `agent-factory/factory/logs/log.json` — execution log
- `agent-factory/factory/logs/autoloop.json` — AutoResearch iteration log
- `agent-factory/factory/research/` — research output directory
- `agent-factory/.venv/` — Python venv with notebooklm-py installed

**Обновлённые файлы:**
- `agent-factory/.agent/skills/_base/TEMPLATE.md` — added Pre-Step Ritual (0-A→0-D)
- `agent-factory/.agent/skills/executor/SKILL.md` — Ralph Loop + Pre-Step integration
- `agent-factory/.agent/skills/researcher/SKILL.md` — mandatory pre-step rule
- `agent-factory/CLAUDE.md` — Pre-Step Ritual section (0-A→0-D before RALPH)

### Pre-Step Ritual Flow (before EVERY step)
```
0-A: NotebookLM query → .agent/context/step-{id}-nlm.json
0-B: Skill loading → _base + {role}
0-C: Context assembly → NotebookLM + skills + memory + git
0-D: Pre-step log → factory/logs/log.json
```

### Коммиты (всего 9 ahead of origin → pushed)
- `ea0d424c` feat(agent-factory): add notebooklm venv + query fallback scaffold
- `ca556ec6` feat(agent-factory): wire pre-step ritual into executor and skills

### Тесты
- ✅ notebooklm-py import OK (venv installed)
- ✅ Fallback to MemoryLayer works (no auth → graceful degradation)
- ✅ All directories + log templates created
- ✅ Skills updated with Pre-Step Ritual
- ✅ CLAUDE.md updated with mandatory ritual

### Ссылка на ветку
https://github.com/huivrotiki/shadow-stack/tree/feat/portable-state-layer

### Следующие шаги
1. **Manual:** `notebooklm login` (first-time Google auth, requires browser)
2. **Optional:** `pip install "notebooklm-py[browser]"` + `playwright install chromium`
3. **Next phase:** Wire Pre-Step Ritual into Executor runtime (direct execFile call)

---

## Что изменилось (2026-04-05g)

### Castor Ultimate Shadow Provider — 17 моделей, 5 task types

- **server/lib/providers/castor-shadow.cjs** (NEW):
  - CastorShadowProvider — full chain fallback per task type
  - 5 task types: reasoning (6), coding (6), fast (5), creative (6), translate (5)
  - Default chain: 16 моделей (все доступные)
  - Все 17 моделей Shadow Ultimate Cascade включены

- **server/free-models-proxy.cjs**:
  - Интеграция Castor + /gateway/castor endpoint
  - Все modelMap расширены для Castor routing
  - Ralph Loop scoring + memory write

- **server/lib/llm-gateway.cjs**:
  - Fixed task router: coding pattern before fast pattern
  - Fixed: "sortArray на JS" теперь правильно классифицируется как coding

## Тесты
- ✅ ping → fast → step-3.5-flash:free (0.81 score)
- ✅ sortArray на JS → coding → qwen3.6-plus:free (0.62 score, fallback)
- ⏳ creative → timeout (Copilot slow)

## Коммиты
- `a168aa11` feat(castor): Shadow Ultimate Cascade — 17 models across 5 task types
- `aecd7095` feat(gateway): full LLM Gateway architecture
- `cda32bb9` fix(cascade): message truncation + compaction strategy
- `eb8c66bd` docs: handoff 2026-04-05f
- `0d05c908` feat(cascade): cloud-only auto-routing with 17 working models
- `3ed4d970` fix(cascade): R0.3 Ralph Loop — FREE_PROXY_API_KEY in Doppler

## Ссылка на ветку
https://github.com/huivrotiki/shadow-stack/tree/feat/portable-state-layer

---

## Что изменилось (2026-04-05f)

### R0.3 — Fix shadow-ultimate-cascade init
- **Doppler:** добавлен `FREE_PROXY_API_KEY` (serpent/dev)
- **Глобальный opencode.json:** `${FREE_PROXY_API_KEY}` → `{env:FREE_PROXY_API_KEY}` (shadow-ultimate-cascade + free-proxy)
- **Коммит:** `3ed4d970`

### R0.4 — Cloud-only auto-routing (17 working models)
- **server/free-models-proxy.cjs:**
  - Убраны мёртвые модели без ключей (Zen, Groq, Gemini, HuggingFace, Mistral)
  - Оставлены только работающие: OpenRouter FREE (5) + Copilot (8) + Ollama (3)
  - Добавлена модель `auto` — умный роутинг по 5 категориям:
    - **code** → copilot-gpt-5.3-codex / or-qwen3.6 / ol-qwen2.5-coder
    - **fast** → copilot-gpt-5.4-mini / or-step-flash / or-qwen3.6
    - **research** → or-qwen3.6 / copilot-gpt-5.4-mini / ol-qwen2.5-coder
    - **creative** → copilot-gpt-5.4 / or-qwen3.6 / or-step-flash
    - **translate** → or-qwen3.6 / copilot-gpt-5.4-mini / ol-qwen2.5-coder
  - Adaptive timeout: 60s для Ollama, 30s для cloud
  - AUTO_FALLBACK_CHAIN: 5 моделей (только работающие)
- **opencode.json (локальный + глобальный):**
  - Default model: `shadow-ultimate-cascade/auto`
  - 17 моделей вместо 32 (убраны мёртвые)
- **Коммит:** `0d05c908`

### GITHUB_TOKEN обновлён
- Новый токен: `ghp_aEagy6j...` добавлен в Doppler (serpent/dev)
- ⚠️ Старый токен `ghp_w1e5s3...` требует отзыва в GitHub Settings

## Тесты — все ✅
- `ping` → fast → or-step-flash (3.3s) ✅
- `sortArray на JS` → code → or-qwen3.6 (15.8s) ✅
- cascade auto query → "pong!" ✅
- free-proxy: 17 models, auto=True ✅
- Global opencode.json: valid JSON ✅

## Что НЕ делали
- **OmniRoute :20128** — не чинили
- **ChromaDB** — не мигрировали
- **ZEN_API_KEY, GROQ_API_KEY, GEMINI_API_KEY, HUGGINGFACE_API_KEY** — не добавлены в Doppler
- **Ротация старого GITHUB_TOKEN** — пользователь должен отозвать вручную

## Подводные камни
- Ollama cloud модели (deepseek-v3.1:671b-cloud, qwen3-coder:480b-cloud, gpt-oss:20b-cloud) — не работают (0MB, placeholder)
- ZEN_API_KEY = placeholder "ТВОЙ_КЛЮЧ" в Doppler — Zen модели не работают
- Без GROQ_API_KEY, GEMINI_API_KEY — соответствующие модели недоступны
- Auto-routing использует только модели с валидными ключами (OpenRouter + Copilot + Ollama local)

## Следующие шаги
1. **[USER]** Перезапустить opencode — подхватит `shadow-ultimate-cascade/auto`
2. **[USER]** Ротация старого GITHUB_TOKEN в GitHub Settings
3. **[USER]** Добавить ZEN_API_KEY, GROQ_API_KEY, GEMINI_API_KEY в Doppler (опционально)
4. **`git push`** — 8 commits ahead of origin
5. **Phase R0.2** — ZeroClaw Control Center (следующая задача из plan-v2)

---

## Что изменилось (2026-04-05e)

### MCP серверы + Tools + Permissions + Plugin
- **Глобальный `~/.config/opencode/opencode.json`:**
  - Добавлен блок `mcp`: supermemory, context7, gh_grep (remote MCP)
  - Добавлен блок `tools`: все 12 built-in tools включены
  - Добавлен блок `permission`: bash=ask, edit/write=allow, skill=*, остальные=allow
  - Добавлен блок `skills.paths`: /Users/work/AI-Workspace/02-Skills

- **Локальный плагин `~/.config/opencode/plugins/shadow-context-loader.js`:**
  - `session.created` — лог инициализации
  - `file.edited` — лог изменений .md/.js/.cjs/.jsx файлов
  - `experimental.session.compacting` — инъекция Shadow Stack контекста при компрессии
    (сервисы, каскад 31 модель, RAM guard, Doppler secrets)

## Тесты
- opencode.json: ✅ валидный JSON
- cascade query: ✅ or-qwen3.6 → free-proxy → 6.7s
- free-proxy: ✅ 31 модель, flat IDs

## Что НЕ делали
- **OmniRoute :20128** — не чинили
- **ChromaDB** — не мигрировали
- **Ротация токенов** — BotFather + Doppler ждут
- **Git push** — 5+ commits ahead
- **PRD.md Tasks 2-6** — не выполнены

## Подводные камни
- MCP серверы добавляют токены в контекст — быть осторожным
- free-proxy модели без API ключей падают в ollama fallback
- Copilot/Zen/Gemini/DeepSeek требуют ключей (GITHUB_TOKEN ✅, ZEN_API_KEY ✅, остальные ❌)

## Следующие шаги
1. **[USER]** Перезапустить opencode — подхватит MCP + plugin
2. **[USER]** Добавить GEMINI_API_KEY, HUGGINGFACE_API_KEY, GROQ_API_KEY в Doppler
3. **[USER]** Ротация Telegram bot token
4. **git push** — 5+ commits ahead
5. **PRD.md Task 3** — ZeroClaw Control Center

---

## Предыдущая сессия (2026-04-05d — Supermemory + Skills MCP)

### Supermemory + Skills MCP — обязательный контекст
- **Глобальный `~/.config/opencode/opencode.json`:**
  - Добавлен блок `TASK / MODEL / PROVIDER TRANSITION — MANDATORY WORKFLOW` — 6 шагов:
    1. Supermemory Recall (mcp__mcp-supermemory-ai__recall)
    2. Load Skills (skill_find + skill_use)
    3. Load MCP Tools (Supermemory, NotebookLM)
    4. Read Portable State Layer (.state/, handoff.md, services)
    5. Read Project Context (CLAUDE.md, AGENTS.md, PRD.md)
    6. RAM Guard (curl :3001/ram)
  - Обязателен при: новой задаче, смене модели, смене провайдера

- **Локальный `~/shadow-stack_local_1/opencode.json`:**
  - Тот же блок Supermemory MANDATORY CONTEXT добавлен в instructions

### cascade-provider.cjs — flat model IDs
- MODEL_MAP: `openrouter/qwen3.6` → `or-qwen3.6`
- TASK_MODEL: все модели переведены на flat IDs
- Fallback model: `openrouter/qwen3.6` → `or-qwen3.6`
- Тест: cascade query → `{"ok":true,"text":"Hello","model":"or-qwen3.6","latency":6715,"provider":"free-proxy"}` ✅

## Тесты
- cascade query (flat IDs): ✅ or-qwen3.6 → "Hello", 6.7s, free-proxy
- cascade health: freeProxy=true, ollama=true, 31 models ✅
- opencode.json: оба файла валидны ✅

## Что НЕ делали
- **OmniRoute :20128** — не чинили
- **ChromaDB** — не мигрировали
- **Ротация токенов** — BotFather + Doppler ждут пользователя
- **Git push** — 4+ commits ahead of origin
- **PRD.md Tasks 2-6** — не выполнены

## Подводные камни
- free-proxy модели (or-qwen3.6) падают в ollama fallback без API ключей
- Copilot/Zen/Gemini/DeepSeek требуют ключей (GITHUB_TOKEN ✅, ZEN_API_KEY ✅, остальные ❌)
- opencode.json — JSONC формат

## Следующие шаги
1. **[USER]** Перезапустить opencode — подхватит новый конфиг с Supermemory/Skills
2. **[USER]** Добавить GEMINI_API_KEY, HUGGINGFACE_API_KEY, GROQ_API_KEY в Doppler
3. **[USER]** Ротация Telegram bot token
4. **git push** — 4+ commits ahead
5. **PRD.md Task 3** — ZeroClaw Control Center

---

## Предыдущая сессия (2026-04-05c — Shadow Ultimate Cascade)

### Shadow Ultimate Cascade — 31 модель, 11-step cascade
- **opencode.json** (глобальный `~/.config/opencode/`):
  - Добавлен провайдер `shadow-ultimate-cascade` (31 модель, flat IDs без `/`)
  - Default model: `shadow-ultimate-cascade/or-qwen3.6`
  - Удалён `omniroute` из enabled_providers (DOWN: better-sqlite3/M1)

- **opencode.json** (локальный `~/shadow-stack_local_1/`):
  - Default model: `anthropic/claude-sonnet-4-5` → `shadow-ultimate-cascade/or-qwen3.6`
  - Добавлен провайдер `shadow-ultimate-cascade` + ollama, openrouter, groq, opencode, copilot

- **server/free-models-proxy.cjs**:
  - Flat model IDs: `or-qwen3.6`, `zen-big-pickle`, `copilot-gpt-5.4`, `ol-qwen2.5-coder`
  - 31 модель: 5 OpenRouter FREE, 5 Zen, 8 Copilot, 3 Gemini, 2 DeepSeek, Groq, Mistral, 6 Ollama
  - HuggingFace URL: `api-inference` → `router.huggingface.co`
  - Cascade chain: 11 steps

- **server/lib/cascade-provider.cjs**:
  - Default: kiro/sonnet → openrouter/qwen3.6

### Тесты — все ✅
- `or-qwen3.6` → "Hello" ✅
- `ol-qwen2.5-coder` → "OK" ✅
- Cascade auto → "2026" (openrouter) ✅

## Что НЕ делали
- **OmniRoute :20128** — не чинили (better-sqlite3/M1)
- **ChromaDB** — не мигрировали
- **Ротация токенов** — BotFather + Doppler ждут пользователя
- **Git push** — 3 commits ahead of origin

## Подводные камни
- Copilot/Zen/Gemini/DeepSeek модели требуют API ключей (GITHUB_TOKEN ✅, ZEN_API_KEY ✅, остальные ❌)
- opencode.json — JSONC формат (с комментариями)

## Следующие шаги
1. **[USER]** Проверить `shadow-ultimate-cascade` в opencode (перезапустить)
2. **[USER]** Добавить GEMINI_API_KEY, HUGGINGFACE_API_KEY в Doppler
3. **[USER]** Ротация Telegram bot token
4. **git push** — 3 commits ahead
5. **PRD.md Task 3** — ZeroClaw Control Center

---

## Предыдущая сессия (2026-04-05b — security hardening)

### Безопасность — local leak vacuum
- **`.claude/settings.local.json`** — удалено 9 `allow`-записей, содержавших inline-токены (GH PAT `ghp_w1e…`, 2× Telegram `8298265295:AA…`). Файл gitignored глобально, в историю git НЕ попадал. Scrubbing сделан python-скриптом in-place.
- **Sanity-grep** по всему `~/shadow-stack_local_1` — других копий утечённых паттернов не найдено.

### Dependencies — 7 Dependabot alerts → 0 vulns
Стратегия: `overrides` вместо semver-major downgrade (npm audit fix предлагал откатить `node-telegram-bot-api` 0.67.0→0.63.0).

**Root `package.json`:**
- `electron`: `^41.0.3 → ^41.1.0` (прямой bump, CVE use-after-free offscreen GPU)
- Новый блок `overrides`:
  - `@xmldom/xmldom: ^0.8.12` (HIGH: XML injection в plist via electron-builder)
  - `form-data@<2.5.4: 2.5.4` (CRITICAL: unsafe RNG for boundary)
  - `tough-cookie@<4.1.3: ^4.1.3` (prototype pollution)
  - `qs@<6.14.1: ^6.14.1` (arrayLimit DoS)
  - `request: npm:@cypress/request@^3.0.10` — name-alias, drop-in fork Cypress team, убивает deprecated `request@2.88.2` и всю его цепочку (form-data@2.3.3, qs@6.5.5, tough-cookie@2.5.0) за один override
  - `lodash: ^4.18.1` (GHSA-r5fr-rjxr-66jc code injection, GHSA-f23m-r3pf-42rh proto pollution)
- Удалена мёртвая строка `"setup:openclaw": "node scripts/openclaw-wizard.cjs"` (wizard удалён в `7e265205`)

**`health-dashboard-v5/package.json`:**
- `vite: ^5.0.0 → ^7.0.0` (esbuild dev-server same-origin request smuggling)
- `@vitejs/plugin-react: ^4.2.0 → ^4.7.0` (peer-совместимость с vite 7)

### Ротация токенов — в процессе
- Старые токены в `.claude/settings.local.json` — требуют ручной ротации (GitHub PAT + 2× Telegram BotFather).
- Пользователь инициировал переход на нового бота `@shadowzzero_bot` (ID `8275390873`). Токен случайно был опубликован в чате → немедленно revoked по моей инструкции. **Новый токен будет сгенерирован заново и инжектнут напрямую в Doppler, минуя чат.**

## Тесты
- `npm audit` (root) — **0 vulnerabilities**
- `npm audit` (health-dashboard-v5) — **0 vulnerabilities**
- Smoke: `new TelegramBot('123456:FAKE', {polling:false})` → OK, `sendMessage` method present → aliased `@cypress/request` API-совместим
- Smoke: `require('electron-builder')` → OK, `require('@xmldom/xmldom')` → OK (0.8.12)
- `npm ls lodash` → все ветви на 4.18.1

## Что НЕ делали (сознательно)
- **PR feat/portable-state-layer → main не создан** — ветка +20 коммитов впереди, решение о мердже за пользователем (3 варианта предложены: полный merge / cherry-pick только security / отложить до R1).
- **Новый токен @shadowzzero_bot НЕ записан никуда** — ни в `.env`, ни в Doppler, ни в коммит. Пользователь должен сгенерировать свежий токен через BotFather и запустить `doppler secrets set TELEGRAM_BOT_TOKEN` интерактивно у себя в терминале (без echo в чат).
- **`.env` и `.env.shell` не трогали** — оба gitignored, оба 600, оба содержат старый `8298265295` токен. Будут обновлены вместе с Doppler при ротации.
- **Dependabot alerts на main закроются только после merge** — GitHub сравнивает с default branch.

## Подводные камни
- **`ecosystem.config.cjs:1`** — PM2 читает токены из `.env` напрямую (`require('dotenv').config(...)`), НЕ через `doppler run`. Это расходится с CLAUDE.md rule #2 («secrets через Doppler»). При ротации токен нужно синхронизировать в **двух** местах: Doppler (source of truth по политике) + `.env` (фактический runtime для PM2). Вариант исправления: обернуть pm2 запуск в `doppler run -- pm2 start ecosystem.config.cjs`, но это отдельная задача.
- **`request` alias и `request-promise-core`** — `@cypress/request@3` API-совместим, smoke-тест `new TelegramBot()` прошёл, но боевой `sendMessage → file upload` может выявить периферийные API-диффы. Отслеживать первый реальный вызов.
- **`lodash 4.18.1`** — это **новая ветка** lodash (не 4.17.x LTS). Электрон-билдер и wait-on использовали 4.17.23; 4.18.x теоретически может сломать что-то в `_.template`/`_.merge` edge cases. Не наблюдал.

## Следующий шаг
1. **[USER]** Сгенерировать новый токен `@shadowzzero_bot` в BotFather.
2. **[USER]** `doppler secrets set TELEGRAM_BOT_TOKEN` (interactive).
3. **[USER]** Синхронизировать `.env`: `sed -i.bak "s|^TELEGRAM_BOT_TOKEN=.*|TELEGRAM_BOT_TOKEN=$(doppler secrets get TELEGRAM_BOT_TOKEN --plain)|" .env && rm .env.bak`.
4. **[USER]** `pm2 restart shadow-bot && curl http://localhost:4000/health`.
5. **[USER or next runtime]** Решить вариант мерджа security-фикса в `main` (полный / cherry-pick / отложить).
6. **[Ralph Loop]** Task 1: cascade-provider live test (см. `PRD.md`).

---

## Предыдущая сессия (2026-04-05a — claude-code cleanup)

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

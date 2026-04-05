# PRD — Shadow Stack Phase R0.2–R2
# Для Ralph Loop (READ → PLAN → EXEC → TEST → COMMIT → UPDATE → SYNC → IDLE)
# Обновлено: 2026-04-05

---

## Контекст проекта

- **Монорепо:** ~/shadow-stack_local_1/ (shadow-stack + agent-factory)
- **Ветка:** feat/portable-state-layer
- **Активная фаза:** R0, шаг R0.2
- **Plan file:** docs/plans/plan-v2-2026-04-04.md
- **State:** .state/current.yaml (step: R0.2, next: R0.3)

## Ограничения (ВСЕГДА соблюдать)

- RAM < 400MB → cloud-only, no browser. RAM < 200MB → ABORT
- Ollama: max 1 модель одновременно. Монолитные модели > 4GB — запрещены
- Нет Docker. Нет TypeScript в server/. Нет hardcode токенов
- Doppler: `doppler run --project serpent --config dev -- <команда>`
- После каждого task: тест → commit → context reset → следующий task

## Текущие сервисы (проверь перед стартом)

| Порт  | Сервис            | Статус   |
|-------|-------------------|----------|
| :3001 | shadow-api        | ✅ up    |
| :4000 | telegram-bot      | ✅ up    |
| :4111 | zeroclaw          | ✅ up    |
| :5175 | health-dashboard  | ✅ up    |
| :11434| ollama            | ✅ up    |
| :20129| free-models-proxy | ✅ up    |
| :20128| omniroute         | ❌ broken (better-sqlite3/M1) |
| :8000 | chromadb          | ❌ broken (v1/v2 API mismatch) |

---

## Tasks

### Task 1 — Test cascade-provider live
**Статус:** pending
**Приоритет:** HIGH — без этого Task 3 и 4 бессмысленны

**Описание:**
Перезапустить shadow-api и проверить /api/cascade/query живым curl-запросом.

**Шаги:**
1. `pm2 restart shadow-api` или `node server/index.js`
2. `curl -s -X POST http://localhost:3001/api/cascade/query -H "Content-Type: application/json" -d '{"prompt":"ping","route":"fast"}' | jq .`
3. Ожидаемый ответ: `{"ok":true,"response":"...","model":"...","latency_ms":...}`
4. `curl -s http://localhost:3001/api/cascade/health | jq .`
5. `curl -s http://localhost:3001/api/cascade/models | jq '.models | length'` → >= 5

**Тест пройден, если:**
- /api/cascade/query возвращает `{"ok":true,...}`
- /api/cascade/health показывает primary: up
- Нет 404 / 500

**Commit:** `test: verify cascade-provider endpoints live`

---

### Task 2 — Fix OmniRoute :20128 (better-sqlite3 on M1)
**Статус:** pending
**Приоритет:** MEDIUM — cascade-provider работает как замена

**Описание:**
better-sqlite3 native module не собирается под M1. Нужно пересобрать.

**Шаги:**
1. `cd agent-factory && npm rebuild better-sqlite3`
2. Если не помогает: `npm uninstall better-sqlite3 && npm install better-sqlite3`
3. `node server/omniroute` — проверить старт
4. `curl http://localhost:20128/v1/models` → ожидаем список моделей

**Тест пройден, если:**
- omniroute стартует без ошибок
- /v1/models возвращает массив моделей

**Commit:** `fix: rebuild better-sqlite3 for M1, omniroute :20128 restored`

---

### Task 3 — ZeroClaw Control Center (R0.2)
**Статус:** pending
**Приоритет:** HIGH — основная цель фазы R0

**Описание:**
Создать `agent-factory/server/zeroclaw/control-center.cjs` — Telegram Control Center
с командами для диспетчеризации задач между агентами.

**Файлы для создания/изменения:**
- `agent-factory/server/zeroclaw/control-center.cjs` (новый)
- `agent-factory/.agent/zeroclaw/config.toml` (уже обновлён, проверить)

**Telegram команды для реализации:**
- `/task <text>` — создать задачу в .state/task-queue.md
- `/code <text>` → forward to cascade-provider (code route) via /api/cascade/query
- `/research <text>` → cascade-provider (research route) + сохранить в .agent/knowledge/
- `/agents` → список агентов из config.toml
- `/usage` → статистика вызовов (из .state/session.md)
- `/cancel` → очистить task-queue

**Архитектурные требования:**
- CJS (не ESM), без TypeScript
- Читает config.toml через require('fs') + простой TOML-парсер (не библиотека)
- Не запускает browser при RAM < 400MB
- Логирует все события в .state/session.md (append)
- Port: 4111, bind: 127.0.0.1

**Тест пройден, если:**
- `curl http://localhost:4111/health` → `{"status":"ok","service":"zeroclaw",...}`
- Telegram `/code hello` → ответ через cascade-provider
- `node --check agent-factory/server/zeroclaw/control-center.cjs` → syntax OK

**Commit:** `feat(zeroclaw): control-center.cjs R0.2 — /task /code /research /agents /usage`

---

### Task 4 — ChromaDB v1→v2 API migration
**Статус:** pending
**Приоритет:** MEDIUM — блокирует memory-layer и ralph-loop memory

**Описание:**
`server/lib/memory-mcp.js` использует ChromaDB /api/v1/ endpoint.
ChromaDB 1.5.5 требует /api/v2/. Нужна миграция.

**Файлы для изменения:**
- `server/lib/memory-mcp.js` (или .cjs — проверить расширение)

**Шаги:**
1. Прочитать memory-mcp.js и найти все /api/v1/ вызовы
2. Заменить на /api/v2/ (изменился формат некоторых endpoints)
3. Запустить ChromaDB: `chroma run --path memory/shadow_memory --port 8000`
4. Протестировать: `curl http://localhost:8000/api/v2/heartbeat`
5. Запустить memory-mcp и проверить connection

**Тест пройден, если:**
- `curl http://localhost:8000/api/v2/heartbeat` → `{"nanosecond heartbeat":...}`
- memory-mcp запускается без ошибок "v1 deprecated"

**Commit:** `fix(memory): chromadb v1→v2 API migration in memory-mcp.js`

---

### Task 5 — Supermemory cross-runtime sync
**Статус:** pending
**Приоритет:** MEDIUM

**Описание:**
Создать `server/lib/supermemory-sync.cjs` — обёртка для записи в Supermemory MCP
с автоматическим тегированием и threshold score >= 8.

**Файл для создания:**
- `server/lib/supermemory-sync.cjs`

**Тест пройден, если:**
- `node -e "require('./server/lib/supermemory-sync.cjs').store({content:'test',score:9})"` → без ошибок
- Запись появляется в Supermemory recall

**Commit:** `feat(memory): supermemory-sync.cjs with score threshold`

---

### Task 6 — HuggingFace API key в Doppler
**Статус:** pending
**Приоритет:** LOW

**Описание:**
5 HF моделей в free-models-proxy дают 401 без API ключа.

**Шаги:**
1. Получить HF токен: huggingface.co/settings/tokens
2. `doppler secrets set HUGGINGFACE_API_KEY=<token> --project serpent --config dev`
3. Перезапустить free-models-proxy
4. Проверить ответ HF моделей

**Тест пройден, если:**
- HF модели возвращают 200 вместо 401

**Commit:** `feat: add HUGGINGFACE_API_KEY to Doppler, enable 5 HF models`

---

## Порядок выполнения

1. Task 1 (cascade test) — обязательно первым
2. Task 3 (ZeroClaw Control Center) — главная цель R0.2
3. Task 4 (ChromaDB migration) — разблокирует memory
4. Task 2 (OmniRoute fix) — хорошо иметь
5. Task 5 (Supermemory sync) — после Task 4
6. Task 6 (HF key) — самый последний

## Правила Ralph Loop для этого PRD

- Перед каждым task: `cat .state/current.yaml && curl http://localhost:3001/ram`
- После каждого task: обновить .state/todo.md, добавить событие в .state/session.md
- При RAM < 400MB: пропустить Tasks с browser, использовать только cloud cascade
- При 3× неудаче одного task: пометить `[FAILED - NEEDS HUMAN REVIEW]` и перейти к следующему
- При context >= 85%: немедленно handoff.md + commit + /clear

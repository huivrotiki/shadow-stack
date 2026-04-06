# Отчет о сессии (Handoff) — 2026-04-06 · opencode

## Branch
`main` (merged from `feat/portable-state-layer`)

## Что изменилось

### PR #6 — Portable State Layer (MERGED) ✅

**Squash commit:** `57bf312e`
**Коммитов сжато:** 257 → 1
**Файлов изменено:** 178 (+23,662/-5,772 строк)

**Ключевые компоненты:**
- `.state/` layer (current.yaml, session.md, todo.md)
- Heartbeat system (6 сервисов → heartbeats.jsonl)
- ZeroClaw orchestration (Commander + Executor)
- Real token streaming (SSE)
- Free models proxy (113 моделей)
- Agent factory monorepo
- Computer use endpoints
- Service registry (docs/SERVICES.md)
- 18 agent skills

### NotebookLM Knowledge Base Skill ✅

**Коммиты:** a1028f4e, da7385f1, be2aeaa9, 5f3e764a

**Структура:**
```
.agent/skills/notebooklm-kb/
├── SKILL.md              # Метаданные + Web UI link
├── scripts/
│   ├── list.sh           # Список notebooks
│   ├── query.sh          # CLI query wrapper
│   └── fallback-search.sh # Локальный grep fallback
└── data/
    └── SESSION.json      # Состояние сессии
```

**Primary Notebook:**
- ID: 489988c4-0293-44f4-b7c7-ea1f86a08410
- Title: Автономный стек разработки на Mac mini M1 8GB
- Web: https://notebooklm.google.com/notebook/489988c4-0293-44f4-b7c7-ea1f86a08410

**Fallback Strategy:**
1. CLI: `~/.venv/notebooklm/bin/notebooklm ask "query"`
2. Web UI: открыть ссылку выше
3. Local: `fallback-search.sh "query"` (grep по notebooks/)

**Known Issue:** CLI возвращает RPC errors — используй Web UI или fallback

### Vercel Token → Doppler ✅

- Перемещён из `~/.config/opencode/opencode.json`
- Конфиг обновлён: `{env:VERCEL_TOKEN}`
- Doppler: `serpent/dev`

### .gitignore Updates ✅

Добавлены runtime state files:
- `data/heartbeats.jsonl`
- `data/zeroclaw-state.json`

## Почему было принято именно такое решение

1. **Squash merge** — чистая история, детали в ветке
2. **NotebookLM skill** — RAG к базе знаний проекта
3. **Web UI fallback** — CLI нестабилен, Web всегда работает
4. **Local grep fallback** — offline режим
5. **Vercel token → Doppler** — централизация secrets

## Что мы решили НЕ менять

- ChromaDB v1→v2 migration (отложено)
- GitGuardian 6 secrets (требует ручной проверки)
- sub-kiro stopped (требует debug)
- agent-factory/ (не трогали)

## Тесты

**Сервисы (7/8 online):**
- shadow-api :3001 ✅
- telegram-bot :4000 ✅
- zeroclaw :4111 ✅
- health-dashboard :5175 ✅
- ollama :11434 ✅
- omniroute :20128 ✅
- free-models-proxy :20129 ✅
- sub-kiro :20131 ❌ (stopped)

**NotebookLM Skill:**
- CLI list: ✅ (14 notebooks)
- CLI query: ❌ (RPC errors)
- Web UI: ✅ (ссылка работает)
- Fallback search: ✅ (grep работает)

**RAM Status:** 309 MB free (WARNING)

## Журнал несоответствий / Подводные камни

1. **NotebookLM CLI RPC errors** — API нестабилен, используй Web UI
2. **RAM WARNING** — 309 MB, только ollama-3b, skip browser
3. **Git divergence** — main и origin/main разошлись (нужен push)
4. **sub-kiro stopped** — требует restart/debug

## Следующие шаги

### Immediate (сейчас)
- [ ] Push commits to origin/main
- [ ] Verify all services after merge

### Phase 5.2 — OpenCode Plugins (следующая сессия)
- [ ] Установить 11 плагинов (antigravity, supermemory и т.д.)
- [ ] Настроить Supermemory projectContainerTag
- [ ] Создать cli-anything и ui-dashboard-designer skills

### Blockers (когда будет время)
- [ ] ChromaDB v1→v2 migration
- [ ] sub-kiro debug
- [ ] GitGuardian secrets cleanup

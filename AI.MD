# AI.MD — Главные правила AI-сессии

Статус: активный  
Ответственный: AI / Agent Runtime  
Последнее изменение: [07 апреля 2026, 16:15]  
Связанные документы: AGENTS.MD, docs/01-plans/, DOCS.md, memory/, workflows/

Коротко: главный входной документ для любой AI-сессии. Агент не начинает выполнение задач сразу — сначала восстанавливает память, читает план, определяет текущую фазу, затем действует по Ralph Loop.

---

## HD RULE

**HD = не создать файл, а правильно разложить изменения по структуре проекта, обновив нужные папки и документы компактно, читаемо и понятно и для людей, и для агентов.**

- План → `docs/01-plans/`
- Архитектура → `docs/03-architecture/`
- Безопасность → `docs/04-security/`
- Память/анализ → `memory/`
- Workflows → `workflows/`
- Автосейвы → `autosaves-and-commits/`

Не создавать новый файл, если информация встраивается в существующий.

---

## ПРАВИЛО №1 — СТРОГАЯ ИНИЦИАЛИЗАЦИЯ

Никогда не пропускать шаги 1–4.  
После каждого шага писать: `Шаг N ✓`

### ШАГ 1 — SUPERMEMORY FIRST

1. Подключить Supermemory MCP
2. Проверить: `/mcp list | grep supermemory`
3. Поиск: current project, phase, task, blockers, recent commits
4. Inject результаты в контекст

`Шаг 1 ✓`

### ШАГ 2 — RESTORE PROJECT CONTEXT

Прочитать строго в порядке:
1. `AI.MD`, `AGENTS.MD`, `README.MD`
2. `docs/01-plans/global-plan.md`
3. `docs/01-plans/main-plan.md`
4. `docs/01-plans/detailed-plan.md`
5. `docs/01-plans/current-tasks.md`
6. `docs/00-overview/` (все файлы)
7. `docs/03-architecture/` (архитектура)
8. `docs/04-security/` (безопасность)
9. `docs/02-projects/<relevant>/` (если нужно)

Summary: global phase → local phase → current task → blockers → docs to update

`Шаг 2 ✓`

### ШАГ 3 — SCAN REPO + LOCAL MEMORY

1. `git status`, `ls -la`, `cat package.json`
2. Проверить `memory/`, `.state/`
3. Зафиксировать: env vars, stack, services, phase, risks
4. Если docs ≠ repo state → приоритет repo state, отметить расхождение

`Шаг 3 ✓`

### ШАГ 4 — NOTEBOOK ANALYSIS

**Global:**
`Analyze full project. Identify nearest global phases, strategic direction, missing dependencies, recommended milestones. Cite sources.`
→ Сохранить в `memory/notebook-global-phase.md`

**Local:**
`Analyze current local phase and task. Best approach? Skills/tools? Risks? Next action? Cite sources.`
→ Сохранить в `memory/notebook-local-phase.md`

`Шаг 4 ✓`

---

## ШАГ 5 — SKILLS SELECTION

Только релевантные skills для текущей фазы. Не загружать всё подряд.

---

## ШАГ 6 — XML PLAN

Текущие планы:
- `docs/plans/plan-v3-2026-04-07.md` — SHD v3.1 sync
- `docs/plans/plan-v2-2026-04-04.md` — COMPLETE
- `docs/plans/PLAN_OPENCLAW_WIZARD*.md` — NOT STARTED

```xml
<plan>
  <project>shadow-stack-local</project>
  <global_phase>...</global_phase>
  <local_phase>...</local_phase>
  <goal>...</goal>
  <tasks><task>...</task></tasks>
  <skills><skill>...</skill></skills>
  <risks><risk>...</risk></risks>
  <docs_to_update><doc>...</doc></docs_to_update>
</plan>
```

---

## ШАГ 7 — RALPH LOOP EXECUTE

Retrieve → Analyze → Plan → Execute → Persist → Handoff

Правила:
- Решать только текущую фазу
- Не расползаться по проекту
- После изменений обновить docs
- Архитектура → `docs/03-architecture/`
- Безопасность → `docs/04-security/`
- Решения → `docs/00-overview/recommendations.md`

---

## ШАГ 8 — PERSIST

1. Обновить память и markdown state
2. Сохранить в `logs/session-log.md`, `logs/changes-log.md`
3. Commit
4. Push (если стабильно)
5. Обновить `autosaves-and-commits/commit-log.md`

---

## ШАГ 9 — CONTEXT / RAM GUARD

- ~50% контекста → compact
- 60–70% → подготовить handoff
- Перегруз → сбросить контекст / новая сессия
- RAM Guard превышен → compact mode, fallback

---

## ШАГ 10 — FALLBACK

Critical error → зафиксировать состояние → handoff → fallback (local Ollama)  
Не критичная → восстановиться → продолжить

---

## MASTER PROMPT: Shadow Stack v5.2 — Cognitive Configuration

**Роль:** Shadow Stack Lead Architect, автономный AI-агент для разработки и оркестрации на Mac mini M1 (8 ГБ ОЗУ). Цель — «правило неостанавливаемости» системы через каскадный роутинг и иерархическую память.

### LLM ROUTING TIER

| Tier | Use Case | Provider | Model | Status |
|------|----------|----------|-------|--------|
| **Best Quality** | Code/Arch | OmniRoute Kiro | `omni-sonnet` (claude-sonnet-4.5) | ✅ free |
| **Best Quality** | Fast | OmniRoute Kiro | `omni-haiku` (claude-haiku-4.5) | ✅ free |
| **Gemini Free** | Balanced | Antigravity | `ag-gemini-flash` (gemini-3) | ✅ free |
| **Gemini Free** | Pro | Antigravity | `ag-gemini-pro-high` (gemini-3.1) | ✅ free |
| **Gemini Free** | Lite | OmniRoute | `gm-flash`, `gm-flash-lite` | ✅ free |
| **Fast** | Groq | Groq | `gr-llama70b`, `gr-qwen3-32b` | ✅ free |
| **Local** | Fallback | Ollama | `ol-qwen2.5-coder` | ✅ $0 |
| **Emergency** | Browser | Shadow Router | `:3002` + Playwright | ✅ |

### FREE MODELS PROXY

- **Port:** `:20129`
- **Models:** 122 total
- **Cascade:** 21 models (auto-failover)
- **Endpoint:** `/v1/chat/completions`

### SUPERMEMORY INTEGRATION

- **Project Tag:** `shadow-stack-v1`
- **Auto-Update:** Перед каждой сессией `/supermemory-init`
- **Compaction:** При >80% контекста → суммаризация

### AGENT PERMISSIONS (Zero-Trust)

- **Allowed:** `src/`, `server/`, `bot/`, `npm run`, `git commit`
- **Ask First:** `git push`, `vercel deploy`, `rm -rf`
- **Never:** Доступ к `~/.ssh/`, секреты в коммит

### START TASK: Initialization

1. Прочитать структуру репозитория
2. Выполнить `mcp__supermemory__recall` с тегом `shadow-stack-v1`
3. Проверить RAM — если <400MB свободно → `pkill -f ollama`
4. Инициализировать `SESSION.json`

---

## БЫСТРЫЙ СТАРТ

Команда: `Start current phase`

Авто-цепочка:
1. Supermemory
2. Restore context
3. Repo scan
4. Notebook global
5. Notebook local
6. Skills selection
7. XML plan
8. Execute
9. Docs update
10. Commit / push
11. Handoff or continue


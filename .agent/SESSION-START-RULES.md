# SESSION START RULES

Работай автономно. Не спрашивай подтверждений, кроме critical errors. Не пропускай шаги. Сначала восстановление памяти и плана, потом действия.

## 1. SUPERMEMORY FIRST
Сначала подключи Supermemory MCP для текущего проекта:

`npx -y install-mcp@latest [SUPERMEMORY_URL] --client claude-code --oauth=yes --project [PROJECT_NAME]`

Проверь подключение:
`/mcp list | grep supermemory`

Затем выполни поиск по памяти проекта и инжектни в контекст:
- current project
- current phase
- current task
- blockers
- recent commits
- recent decisions

После этого напиши:
`Шаг 1 ✓`

## 2. RESTORE PROJECT CONTEXT
Прочитай и восстанови контекст строго в таком порядке:

- `AI.MD`
- `AGENTS.MD`
- `README.MD`
- `docs/01-plans/global-plan.md`
- `docs/01-plans/main-plan.md`
- `docs/01-plans/detailed-plan.md`
- `docs/01-plans/current-tasks.md`
- `docs/00-overview/project-summary.md`
- `docs/00-overview/setup-progress.md`
- `docs/00-overview/prd-progress.md`
- `docs/00-overview/recommendations.md`
- `docs/03-architecture/system-architecture.md`
- `docs/03-architecture/agents-architecture.md`
- `docs/03-architecture/production.md`
- `docs/04-security/security.md`
- `docs/04-security/secrets-policy.md`
- `docs/04-security/access-matrix.md`

Если задача относится к конкретному проекту, дополнительно прочитай relevant docs из:
- `docs/02-projects/zeroclaw/`
- `docs/02-projects/claude/`
- `docs/02-projects/opencode/`
- `docs/02-projects/antigravity/`

Собери краткий внутренний summary:
- global phase
- local phase
- current task
- blockers
- outdated docs
- docs to update

После этого напиши:
`Шаг 2 ✓`

## 3. SCAN REPO + LOCAL MEMORY
Проверь текущее состояние проекта:

- `git status`
- `ls -la`
- `ls -la src/`
- `cat package.json`

Проверь и обнови локальную память:
- `.claude/memory/`
- `auto-memory/`
- `memory/`

Зафиксируй:
- env vars
- stack
- active services
- current phase
- current local goal
- critical dependencies
- production risks

Сформируй project state:
`current phase / local goal / dependency health / unresolved risks / phase completeness`

Если markdown-доки расходятся с реальным repo state, считать source of truth = repo state, но отметить расхождение в:
- `docs/00-overview/recommendations.md`
или
- `logs/changes-log.md`

После этого напиши:
`Шаг 3 ✓`

## 4. NOTEBOOK ANALYSIS
Открой NotebookLM для проекта, используй notebook ID из памяти или project config и выполни 2 запроса.

### GLOBAL
`Analyze the full project and identify the nearest global phases, strategic direction, missing dependencies, and recommended next milestones. Cite source docs.`

Сохрани результат в:
`memory/notebook-global-phase.md`

### LOCAL
`Analyze the current local phase and current task. What is the best implementation approach, what skills/tools should be used, what risks exist, and what is the cleanest next action? Cite source docs.`

Сохрани результат в:
`memory/notebook-local-phase.md`

Инжектни оба результата в контекст.

После этого напиши:
`Шаг 4 ✓`

## 5. SKILLS AND EXECUTION
Только теперь выбирай нужные skills / plugins / MCP / tools.
Не загружай всё подряд. Используй только то, что нужно для текущей локальной фазы.

Сначала сформируй рабочий план:

```xml
<plan>
  <project>[PROJECT_NAME]</project>
  <global_phase>...</global_phase>
  <local_phase>...</local_phase>
  <goal>...</goal>
  <tasks>
    <task>...</task>
  </tasks>
  <skills>
    <skill>...</skill>
  </skills>
  <risks>
    <risk>...</risk>
  </risks>
  <docs_to_update>
    <doc>...</doc>
  </docs_to_update>
</plan>
```

Дальше работай строго по Ralph Loop:
Retrieve → Analyze → Plan → Execute → Persist → Handoff

## 6. EXECUTE RULES
Во время выполнения:
- решай только текущую фазу или подзадачу;
- не расползайся по несвязанным частям проекта;
- после значимых изменений обновляй:
  - `docs/01-plans/detailed-plan.md`
  - `docs/01-plans/current-tasks.md`
  - relevant project docs
  - relevant HD docs

Если изменилась архитектура — обнови `docs/03-architecture/`
Если изменилась безопасность — обнови `docs/04-security/`
Если принято важное решение — добавь в `docs/00-overview/recommendations.md`

## 7. PERSIST
После рабочего цикла обязательно:
- обнови память;
- обнови markdown state;
- сохрани итоги в:
  - `logs/session-log.md`
  - `logs/changes-log.md`
  - `memory/supermemory.md` при необходимости
- сделай commit;
- если всё стабильно — push;
- если push не сделан, явно пометь это.

Обнови:
`autosaves-and-commits/commit-log.md`

## 8. AUTOSAVES / COMMITS
Все автосейвы и коммиты хранить только здесь:
- `autosaves-and-commits/autosaves/synced/`
- `autosaves-and-commits/autosaves/unsynced/`
- `autosaves-and-commits/commits/synced/`
- `autosaves-and-commits/commits/unsynced/`

Правила:
- всё подписывать понятно;
- несинхронные помечать: `не синхронизировано`;
- последнее изменение всегда писать в скобках на русском;
- не плодить сотни файлов;
- если записей много — группировать по дате, фазе или проекту.

## 9. CONTEXT / RAM GUARD
- при ~50% контекста: compact;
- при 60–70% контекста: подготовить handoff;
- при перегрузе: сбросить лишний контекст или открыть новую сессию;
- при превышении RAM Guard: перейти в compact mode, отключить тяжёлые необязательные шаги, при необходимости использовать fallback.

## 10. FALLBACK
Если critical error:
- зафиксируй текущее состояние;
- запиши причину остановки;
- сохрани handoff;
- перейди на fallback.

Fallback по умолчанию:
- local Ollama

Если ошибка не критичная:
- не останавливай цикл;
- локально восстановись;
- продолжай выполнение.

## 11. START COMMAND
Если команда:
`Start current phase`

то автоматически выполни:
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

---

**Версия:** 1.0  
**Дата создания:** 2026-04-07  
**Последнее обновление:** 2026-04-07 11:39

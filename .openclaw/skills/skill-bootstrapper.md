# SKILL: Bootstrapper (Meta-Skill)
**ID**: `skill-bootstrapper` | **Load**: ALWAYS FIRST

## PURPOSE
Сканирует `.openclaw/skills/` и `.agent/skills/`, возвращает только
заголовки (ID + описание). Не загружает полные файлы — экономит контекст.

## EXECUTION
```bash
grep -r '^# SKILL:' .openclaw/skills/ .agent/skills/ 2>/dev/null
```

## OUTPUT → SKILL_INDEX (пример)
```
skill-fs-optimizer    | FS batch ops
skill-api-validator   | HTTP endpoint checks
skill-ram-guard       | Memory monitoring
skill-notebooklm-kb   | NotebookLM queries
skill-supermemory     | Recall/persist sessions
```

## LAZY LOADING RULE
Полный SKILL.md загружается **только** когда навык указан в
`active-spec.md → skills_required`.

## NEXT STEP
После индексации → передать список в NotebookLM-запрос ZeroClaw.
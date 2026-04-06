# Claude Code — Full Specification

## ACTIVE-SPEC FORMAT
```yaml
goal: "<Чёткая цель>"
strategy: "<Паттерн из NotebookLM>"
skills_required:
  - skill-fs-optimizer
dod:
  - "Все эндпоинты 200 OK"
  - "RAM delta < 50MB"
  - "commit hash generated"
  - "lint clean"
checkpoints:
  - id: CP1
    executor: opencode
    mode: ralph
    action: "<Атомарный шаг>"
risks:
  - "<RAM blocker>"
  - "<API rate limit>"
```

## DoD ШАБЛОН
- Файл X проходит линтинг
- RAM после запуска < 500MB
- Telegram отправил уведомление
- 0 critical security alerts
- Отсутствие утечек памяти (RAM delta < 50MB)
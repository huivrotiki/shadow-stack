---
name: cli-anything
description: Генератор детерминированных CLI из любого API/документации — превращает любое ПО в инструмент агента
tags: [cli-generation, automation, tool-construction, 7-phase-pipeline]
triggers:
  - "создай cli"
  - "cli-anything"
  - "generate cli"
  - "оберни в cli"
---

# CLI-Anything Skill

## Concept

Автоматически генерирует CLI интерфейс из:
- REST API документации
- Python/Rust/Node.js библиотек
- Любого ПО с документацией

**7-фазный конвейер:**
1. **Analyze** — анализ API/документации
2. **Design** — проектирование CLI команд
3. **Implement** — генерация Python/Node CLI
4. **Test** — smoke тесты
5. **Package** — упаковка в Python package
6. **Document** — генерация SKILL.md
7. **Publish** — регистрация в `.agent/skills/`

## Architecture

```
.agent/skills/cli-anything/
├── SKILL.md              # Этот файл
├── scripts/
│   ├── generate.sh       # Главный скрипт генерации
│   ├── analyze.py        # Анализ API
│   └── test.sh           # Smoke тесты
├── data/
│   └── SESSION.json      # Состояние генерации
└── generated/            # Сгенерированные CLI
    └── <name>/
        ├── SKILL.md
        ├── cli.py
        └── examples.md
```

## Usage

### Генерация нового CLI

```bash
# Базовый вызов
.agent/skills/cli-anything/scripts/generate.sh <target> <name>

# Пример: обернуть REST API
.agent/skills/cli-anything/scripts/generate.sh "http://localhost:3001/api" shadow-api-cli

# Пример: обернуть Python библиотеку
.agent/skills/cli-anything/scripts/generate.sh "requests" requests-cli
```

### RAM Guard

```bash
# Перед генерацией
curl http://localhost:3001/ram
# Если < 500 MB → cloud-only через OmniRoute
```

## 7-Phase Pipeline

### Phase 1: Analyze
```bash
# Анализ целевого API/библиотеки
python3 .agent/skills/cli-anything/scripts/analyze.py <target>
# Output: JSON с endpoints/methods
```

### Phase 2: Design
```bash
# Проектирование CLI команд
# Input: JSON из Phase 1
# Output: Схема команд (YAML)
```

### Phase 3: Implement
```bash
# Генерация CLI кода
# Input: Схема команд
# Output: Python/Node CLI скрипт
```

### Phase 4: Test
```bash
# Smoke тесты
.agent/skills/cli-anything/scripts/test.sh <name>
# Output: pass/fail для каждой команды
```

### Phase 5: Package
```bash
# Упаковка в Python package
# Output: setup.py + структура пакета
```

### Phase 6: Document
```bash
# Генерация SKILL.md
# Output: Документация с примерами
```

### Phase 7: Publish
```bash
# Регистрация в .agent/skills/
# Output: Готовый skill
```

## Examples

### Пример 1: REST API CLI

**Target:** Shadow API `:3001`
**Generated:** `.agent/skills/cli-anything/generated/shadow-api-cli/`

```bash
# Использование сгенерированного CLI
shadow-api-cli health
# → {"status":"ok","service":"shadow-stack","timestamp":"..."}

shadow-api-cli ram
# → {"free_mb":331,"safe":false,"critical":false}
```

### Пример 2: NotebookLM CLI

**Target:** NotebookLM API
**Generated:** Уже существует (`~/.venv/notebooklm/bin/notebooklm`)

```bash
notebooklm list
notebooklm ask "question"
```

## Fallback Strategy

1. **Если генерация не удалась:**
   - Проверь RAM (нужно > 500 MB)
   - Используй OmniRoute для облачной генерации
2. **Если API недоступен:**
   - Создай mock CLI на основе документации
3. **Если тесты failed:**
   - Запусти `test.sh` с `--debug`
   - Исправь ошибки перед публикацией

## Integration with OpenCode

OpenCode автоматически:
1. Сканирует `.agent/skills/cli-anything/generated/`
2. Индексирует метаданные из SKILL.md
3. Загружает полный skill при совпадении триггера

## Configuration

`.agent/skills/cli-anything/data/SESSION.json`:
```json
{
  "active_generation": null,
  "completed_generations": [],
  "last_phase": null,
  "ram_at_start": null
}
```

## Benefits

- **Экономия:** 30x дешевле MCP серверов по токенам
- **Детерминизм:** CLI всегда работает одинаково
- **Автономность:** Агент создаёт инструменты сам
- **Масштабируемость:** Любое ПО → CLI → Agent Tool

## Known Issues

- Требует > 500 MB RAM для генерации
- Сложные API могут потребовать ручной корректировки
- Python зависимости нужно устанавливать отдельно

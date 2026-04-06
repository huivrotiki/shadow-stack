# NotebookLM Integration — System Manifest

> **Интеграция NotebookLM с Shadow Stack:** Автоматическая загрузка контекста из notebooks перед началом работы

---

## Проблема

NotebookLM CLI (`~/.venv/notebooklm/bin/notebooklm`) иногда падает с ошибками RPC:
- `RPC GET_NOTEBOOK failed`
- `RPC rLM1Ne returned null result data`

Это блокирует SESSION-START-PROTOCOL, который требует загрузки контекста из notebooks.

---

## Решение: Skill для Claude Code

Создать skill, который:
1. Проверяет доступность NotebookLM API
2. Если API недоступен — использует локальные notebooks из `notebooks/`
3. Кэширует результаты запросов для offline режима
4. Предоставляет fallback на Supermemory MCP

---

## Архитектура

```
.agent/tasks/NotebookLM_Integration/
├── system_manifest.md          # Этот файл
├── Loader/                     # Агент-загрузчик контекста
│   ├── instructions.txt        # "Загружай контекст из notebooks"
│   ├── tools.json              # NotebookLM CLI, local files, Supermemory
│   └── memory.md               # Кэш запросов
└── skills/
    └── notebooklm-claude-code/ # Skill для Claude Code
        ├── SKILL.md            # Описание skill
        ├── query.sh            # Скрипт запроса к NotebookLM
        └── fallback.sh         # Fallback на локальные файлы
```

---

## Доступные Notebooks

### 1. Claude Code: Полное руководство и лучшие практики
**ID:** `1930368e-5b51-494b-b574-d`  
**Содержание:**
- Best practices для Claude Code
- Skills и workflows
- Интеграция с проектами
- Troubleshooting

### 2. Автономный стек разработки на Mac mini M1 8GB
**ID:** `489988c4-0293-44f4-b7c7-e`  
**Содержание:**
- Shadow Stack архитектура
- RAM Guard стратегии
- Локальные LLM (Ollama)
- M1 оптимизации

### 3. The LLM Mesh: Enterprise Architecture for Agentic Applications
**ID:** `d981aeb7-f7b2-4bca-b870-d`  
**Содержание:**
- LLM mesh архитектура
- Multi-agent системы
- Enterprise patterns

### 4. Shadow stack под управлением DEER FLOW
**ID:** `c91a4b87-7ffb-4658-a10b-5`  
**Содержание:**
- DEER FLOW desktop
- ZeroClaw как ассистент
- Фабрика агентов

---

## Skill для Claude Code

### SKILL.md

```markdown
---
name: notebooklm-query
description: Query NotebookLM notebooks for context and best practices
triggers:
  - "what are the best practices for"
  - "how do I use"
  - "show me examples of"
  - "what does the documentation say about"
---

# NotebookLM Query Skill

Queries NotebookLM notebooks for context, best practices, and documentation.

## Usage

```bash
# Query specific notebook
notebooklm use <notebook_id>
notebooklm ask "What are the best practices for Claude Code?"

# Fallback to local notebooks
grep -r "best practices" notebooks/
```

## Available Notebooks

- **Claude Code:** 1930368e-5b51-494b-b574-d
- **Shadow Stack:** 489988c4-0293-44f4-b7c7-e
- **LLM Mesh:** d981aeb7-f7b2-4bca-b870-d
- **DEER FLOW:** c91a4b87-7ffb-4658-a10b-5

## Fallback Strategy

1. Try NotebookLM API
2. If fails → read local `notebooks/` directory
3. If empty → query Supermemory MCP
4. If all fail → return "Context unavailable"
```

---

## Интеграция с SESSION-START-PROTOCOL

### Текущий протокол (шаг 2-3):

```bash
# 2. NotebookLM Query — Общий план
~/.venv/notebooklm/bin/notebooklm ask "Какой общий план развития Shadow Stack?"

# 3. NotebookLM Query — Ближайшая фаза
~/.venv/notebooklm/bin/notebooklm ask "Что нужно сделать в следующей фазе?"
```

### Новый протокол (с fallback):

```bash
# 2. NotebookLM Query — с fallback
if ! ~/.venv/notebooklm/bin/notebooklm ask "Какой общий план?"; then
  # Fallback: читаем локальные notebooks
  cat notebooks/shadow-stack/INDEX.md
fi

# 3. Supermemory fallback
if [ $? -ne 0 ]; then
  # Fallback: запрашиваем Supermemory
  mcp__mcp-supermemory-ai__recall "Shadow Stack план развития"
fi
```

---

## Локальные Notebooks (Fallback)

### Структура

```
notebooks/
├── shadow-stack/
│   ├── INDEX.md                # Главный индекс
│   ├── 2026-04-05-*.md         # Сессии
│   └── ...
├── agent-factory/
│   └── INDEX.md
└── _template.md
```

### Использование

```bash
# Поиск по локальным notebooks
grep -r "best practices" notebooks/ --include="*.md"

# Чтение INDEX
cat notebooks/shadow-stack/INDEX.md
```

---

## Следующие шаги

1. Создать skill `notebooklm-claude-code` в `.agent/skills/`
2. Добавить fallback логику в SESSION-START-PROTOCOL.md
3. Создать кэш для offline режима
4. Протестировать с недоступным NotebookLM API

---

**Дата создания:** 2026-04-06  
**Автор:** OpenCode (shadow-stack_local_1)  
**Статус:** Design — требует реализации

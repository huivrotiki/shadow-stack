---
name: notebooklm-kb
description: RAG-интерфейс к базе знаний проекта через NotebookLM CLI, Web UI и Supermemory fallback
tags: [knowledge, rag, notebooklm, research, supermemory]
triggers:
  - "спроси notebooklm"
  - "найди в базе знаний"
  - "что говорит notebooklm"
  - "knowledge query"
  - "RAG search"
  - "query notebook"
---

# NotebookLM Knowledge Base Skill

## Primary Notebook

**ID:** 489988c4-0293-44f4-b7c7-ea1f86a08410
**Title:** Автономный стек разработки на Mac mini M1 8GB
**Web URL:** https://notebooklm.google.com/notebook/489988c4-0293-44f4-b7c7-ea1f86a08410

## Usage

### CLI (если работает)
```bash
# List all notebooks
~/.venv/notebooklm/bin/notebooklm list

# Query knowledge (with automatic Supermemory fallback)
.agent/skills/notebooklm-kb/scripts/query.sh "<query>"

# Get summary
~/.venv/notebooklm/bin/notebooklm summary
```

### Web UI (всегда работает)
Открой в браузере: https://notebooklm.google.com/notebook/489988c4-0293-44f4-b7c7-ea1f86a08410

### Fallback (локальный поиск)
```bash
.agent/skills/notebooklm-kb/scripts/fallback-search.sh "query"
```

## Available Notebooks

| ID | Title | Purpose | URL |
|---|---|---|---|
| 489988c4 | Автономный стек разработки | Shadow Stack architecture | [Open](https://notebooklm.google.com/notebook/489988c4-0293-44f4-b7c7-ea1f86a08410) |
| d981aeb7 | The LLM Mesh | Enterprise agentic architecture | - |
| c91a4b87 | Shadow stack под управлением DEER FLOW | Agent factory | - |
| 1930368e | Claude Code: Полное руководство | Claude Code best practices | - |
| 5f813fa5 | NVIDIA GTC 2026 | NVIDIA announcements | - |

## When to Use

- Архитектурные вопросы о Shadow Stack
- LLM mesh / routing decisions
- Agent factory / ZeroClaw вопросы
- Claude Code best practices
- NVIDIA / GTC announcements

## Fallback Strategy (3-tier)

1. **NotebookLM CLI** — `query.sh` (автоматический Supermemory fallback)
2. **Supermemory MCP** — при падении NotebookLM (встроено в query.sh)
3. **Local notebooks** — grep по `notebooks/` (fallback-search.sh)
4. **Web UI** — ручная проверка через браузер

## Examples

```bash
# Архитектурный вопрос (с авто-fallback)
.agent/skills/notebooklm-kb/scripts/query.sh "Как работает ZeroClaw orchestration?"

# Routing вопрос
.agent/skills/notebooklm-kb/scripts/query.sh "Какой каскад провайдеров используется?"

# Best practices
.agent/skills/notebooklm-kb/scripts/query.sh "Как правильно делать handoff между runtime?"

# Прямой поиск в ноутбуках
.agent/skills/notebooklm-kb/scripts/fallback-search.sh "RAM Guard"
```

## Known Issues

- CLI `notebooklm ask` иногда возвращает RPC errors — query.sh автоматически fallback'ит на Supermemory
- Supermemory MCP требует OAuth авторизацию — при первом запуске откроется браузер
- Web UI всегда работает как последний fallback

---
name: notebooklm-kb
description: RAG-интерфейс к базе знаний проекта через NotebookLM CLI и Web UI
tags: [knowledge, rag, notebooklm, research]
triggers:
  - "спроси notebooklm"
  - "найди в базе знаний"
  - "что говорит notebooklm"
  - "knowledge query"
  - "RAG search"
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

# Query knowledge
~/.venv/notebooklm/bin/notebooklm ask "<query>"

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

## Fallback Strategy

1. **Try CLI first:** `~/.venv/notebooklm/bin/notebooklm ask "query"`
2. **If RPC error:** Open Web UI (link above)
3. **If offline:** Use `fallback-search.sh` for local grep

## Examples

```bash
# Архитектурный вопрос
notebooklm ask "Как работает ZeroClaw orchestration?"

# Routing вопрос
notebooklm ask "Какой каскад провайдеров используется?"

# Best practices
notebooklm ask "Как правильно делать handoff между runtime?"
```

## Known Issues

- CLI `notebooklm ask` возвращает RPC errors (API проблемы)
- Workaround: используй Web UI или fallback-search.sh

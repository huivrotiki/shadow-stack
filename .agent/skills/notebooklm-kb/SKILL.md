---
name: notebooklm-kb
description: RAG-интерфейс к базе знаний проекта через NotebookLM CLI
tags: [knowledge, rag, notebooklm, research]
triggers:
  - "спроси notebooklm"
  - "найди в базе знаний"
  - "что говорит notebooklm"
  - "knowledge query"
  - "RAG search"
---

# NotebookLM Knowledge Base Skill

## Usage

```bash
# List all notebooks
~/.venv/notebooklm/bin/notebooklm list

# Query knowledge (primary notebook auto-selected)
~/.venv/notebooklm/bin/notebooklm ask "<query>"

# Get summary
~/.venv/notebooklm/bin/notebooklm summary
```

## Available Notebooks

| ID | Title | Purpose |
|---|---|---|
| 489988c4 | Автономный стек разработки | Shadow Stack architecture |
| d981aeb7 | The LLM Mesh | Enterprise agentic architecture |
| c91a4b87 | Shadow stack под управлением DEER FLOW | Agent factory |
| 1930368e | Claude Code: Полное руководство | Claude Code best practices |
| 5f813fa5 | NVIDIA GTC 2026 | NVIDIA announcements |

## When to Use

- Архитектурные вопросы о Shadow Stack
- LLM mesh / routing decisions
- Agent factory / ZeroClaw вопросы
- Claude Code best practices
- NVIDIA / GTC announcements

## Fallback

Если NotebookLM CLI недоступен или возвращает ошибку:
1. Проверь `notebooks/shadow-stack/INDEX.md`
2. Проверь `.agent/skills/kb/SKILL.md`
3. Используй Supermemory recall через MCP

## Examples

```bash
# Архитектурный вопрос
notebooklm ask "Как работает ZeroClaw orchestration?"

# Routing вопрос
notebooklm ask "Какой каскад провайдеров используется?"

# Best practices
notebooklm ask "Как правильно делать handoff между runtime?"
```

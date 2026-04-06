---
description: Hierarchical memory — Supermemory RAG + ChromaDB persistence
---

# Supermemory RAG — Иерархическая память

## Pre-flight Lookup

Перед началом любой задачи:
```javascript
const { smartRetrieve } = await import('./scripts/memory-mcp.js');
const context = await smartRetrieve("описание задачи", 3);
```

Или через skill:
```
Вызови memory-retrieve skill с query = описание задачи
```

## Post-flight Persist

После фикса бага, рефакторинга или архитектурного решения:
```javascript
const { smartStore } = await import('./scripts/memory-mcp.js');
await smartStore("описание решения", { source: "файл", tags: "тип", type: "fix" });
```

## Scope разделения

| Scope | Что хранить | Пример |
|-------|-------------|--------|
| `user` | Предпочтения, стиль, привычки | "Предпочитает Tailwind arbitrary values" |
| `project` | Специфика репозитория, архитектура | "Shadow Router использует Playwright CDP" |

## Memory Priority

1. **CLAUDE.md** — всегда загружен (this file)
2. **handoff.md** — загрузить в начале сессии
3. **SESSION.md** — текущее состояние сессии
4. **SKILL.md** — загрузить только когда нужен навык

## Compaction

- Threshold: 80% контекста использовано
- После compaction: записать summary в `SESSION.md`
- Приоритеты загрузки: CLAUDE.md → handoff.md → SESSION.md → SKILL.md

## Embedding Safety (M1 8GB)

- **КРИТИЧНО**: Всегда `keep_alive: 0` после эмбеддингов (nomic-embed-text)
- Никогда `Promise.all` для множественных эмбеддингов — только `for...of`
- Модель nomic-embed-text занимает ~280MB VRAM — выгружай сразу

## Indexing

```bash
source .venv/bin/activate && python scripts/index_knowledge.py
```

## ChromaDB Config

- Path: `./memory/shadow_memory` (PersistentClient, на диск)
- Embedding: `nomic-embed-text` через Ollama REST API
- Chunks: 500 chars с 50-char overlap

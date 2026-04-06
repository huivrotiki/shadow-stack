# Skill: Vector Memory Sync

## Цель
Индексировать документацию Shadow Stack в ChromaDB (локальный векторный store)
через `scripts/index_knowledge.py`. Часть File-Based Agent Architecture (Phase 5.2).

## Когда запускать
- После значительных изменений в `.md`, `.yaml`, `.json` файлах проекта
- После добавления нового скилла в `.agent/skills/`
- RAM > 500MB (требует Ollama `nomic-embed-text`)

## RAM Guard
`free_mb < 500` → **НЕ запускать** (Ollama нужна для эмбеддингов).
Проверить: `curl http://localhost:3001/ram` или `vm_stat`.

## Инструменты
- `scripts/index_knowledge.py` — основной скрипт индексации
- ChromaDB PersistentClient → `memory/shadow_memory/`
- Ollama embed model: `nomic-embed-text` (авто-выгрузка после завершения)

## Запуск
```bash
# Только при RAM > 500MB
source .venv/bin/activate
python scripts/index_knowledge.py
```

## Что индексируется
- Расширения: `.md`, `.txt`, `.json`, `.toml`, `.yaml`, `.yml`
- Исключения: `node_modules`, `.git`, `.venv`, `dist`, `build`, `memory/`
- Лимит: 50KB на файл, chunk_size=500

## RALPH Loop
1. **R:** Проверить RAM, прочитать `SESSION.json`
2. **A:** `python scripts/index_knowledge.py`
3. **L:** Проверить `memory/shadow_memory/` — новые записи
4. **P:** Обновить `SESSION.json` → `last_indexed`, `docs_count`
5. **H:** Если ChromaDB v1→v2 blocker активен — остановиться, залогировать

## Известный blocker
ChromaDB v1→v2 API migration в `scripts/memory-mcp.js` — не решён.
Индексация через `index_knowledge.py` работает независимо от MCP.

## Supermemory интеграция
После индексации вызвать:
`mcp__mcp-supermemory-ai__memory` с тегом `shadow-stack-v1`
для синхронизации глобального индекса.

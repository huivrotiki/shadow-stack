---
description: Knowledge base sync — NotebookLM, shadow-stack-kb, RAG context
---

# Knowledge Base Sync — NotebookLM + Local RAG

## RAG-контекст

Используй локальную базу знаний для ответов на вопросы по дорожной карте Phase 1-5:

```bash
# Основной файл базы знаний
cat /Users/work/shadow-stack_local_1/knowledge/DESIGN_RULES.md

# Ранкинг моделей (актуальный)
cat /Users/work/shadow-stack_local_1/MODELS_RANKING.md
```

## Доступные источники знаний

| Источник | Путь | Описание |
|----------|------|----------|
| Design Rules | `knowledge/DESIGN_RULES.md` | Digital minimalism design rules |
| Models Ranking | `MODELS_RANKING.md` | 11 моделей, speed ranking, rate limits |
| CLAUDE.md | `CLAUDE.md` | Project config, architecture, guardrails |
| AGENTS.md | `AGENTS.md` | Agent definitions, state machine, phases |
| SESSION.md | `SESSION.md` | Current session state |
| handoff.md | `handoff.md` | Session handoff document |

## Model Ranking (актуально на 2026-04-01)

### Tier 1: Ultra Fast (< 500ms)
1. **groq/llama-3.3-70b** — 282ms ⚡ (30 RPM)
2. **mistral/small** — 302ms ⚡ (1M tokens/month)

### Tier 2: Fast (500ms - 2s)
3. **openrouter/nemotron** — 696ms (free)
4. **zen/big-pickle** — 1455ms
5. **zen/nemotron** — 1743ms
6. **openrouter/step-flash** — 1792ms

### Tier 3: Medium (2s - 5s)
7. **openrouter/qwen3.6** — 2437ms
8. **zen/qwen3.6** — 4142ms

### Tier 4: Slow (> 10s)
9. **ollama/qwen2.5-coder** — 11260ms (local)
10. **openrouter/trinity** — 24538ms
11. **ollama/qwen2.5** — ❌ TIMEOUT (30s)

## NotebookLM Sync

Синхронизация данных из NotebookLM через Shadow Router при наличии свободной RAM:

```bash
# Проверить RAM перед sync
curl -s http://localhost:3001/ram

# Если free_mb > 400 — можно запускать browser-based sync
# Shadow Router :3002 → Chrome CDP → NotebookLM
```

## Обновление базы знаний

После каждого архитектурного решения или фикса:

1. Обновить `MODELS_RANKING.md` если изменились speed/limits
2. Обновить `CLAUDE.md` если изменилась конфигурация
3. Сохранить в Supermemory через `memory_store`
4. Обновить `handoff.md`

## Phase Roadmap

| Фаза | Название | Статус |
|------|----------|--------|
| 1 | Foundation (ZeroClaw + Ollama) | ✅ Done |
| 2 | Cascade (Groq → Mistral → OpenRouter) | 🔄 In Progress |
| 3 | Orchestrator (OpenCode + free-proxy) | ⏳ Pending |
| 4 | Memory (Supermemory MCP + compaction) | ⏳ Pending |
| 5 | Ralph Loop (Автономный цикл) | ⏳ Pending |
| 6 | Monitoring (Dashboard v5 + SSE + Telegram) | ⏳ Pending |

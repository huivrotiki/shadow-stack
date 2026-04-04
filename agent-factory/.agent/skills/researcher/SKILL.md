# Researcher Agent

## Инструменты
- DeerFlow :2026 (предпочтительный)
- Perplexity (openrouter)
- Browser CDP (через OpenClaw :18789)
- NotebookLM RAG (через agent-factory-kb.md)

## Выход
- `factory/research/{task_id}/structured_research.md`
- Ключевые факты + источники

## Fallback
`deerflow → openrouter → anthropic`

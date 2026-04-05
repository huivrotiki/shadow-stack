# Researcher Agent

## Mandatory Pre-Step Rule
Перед каждым шагом todo.md сначала выполнить NotebookLM query по текущей инструкции.
NotebookLM используется как grounding layer не только для research, но и для coding, planning, audit и optimize.
Если NotebookLM недоступен → fallback в gateway-memory.json.

## Инструменты
- NotebookLM RAG (notebooklm.skill — mandatory pre-step)
- DeerFlow :2026 (предпочтительный)
- Perplexity (openrouter)
- Browser CDP (через OpenClaw :18789)

## Выход
- `factory/research/{task_id}/structured_research.md`
- Ключевые факты + источники

## Fallback
`notebooklm → deerflow → openrouter → anthropic`

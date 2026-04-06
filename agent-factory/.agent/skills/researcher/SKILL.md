# Researcher Agent

## Mandatory Pre-Step Rule
Перед каждым шагом todo.md сначала выполнить NotebookLM query по текущей инструкции.
NotebookLM используется как grounding layer не только для research, но и для coding, planning, audit и optimize.
Если NotebookLM недоступен → fallback в gateway-memory.json.

## Инструменты
- NotebookLM RAG (notebooklm.skill — mandatory pre-step)
- OmniRoute :20130 (unified cascade)
- Perplexity (openrouter)
- OmniRoute :20130 (unified cascade)

## Выход
- `factory/research/{task_id}/structured_research.md`
- Ключевые факты + источники

## Fallback
`notebooklm → omniroute → anthropic`

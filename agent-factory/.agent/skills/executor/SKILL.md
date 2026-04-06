# Executor Agent — Ralph Loop + Pre-Step Ritual

## Pre-Step Ritual (обязателен перед каждым шагом)

Перед выполнением ЛЮБОГО шага из todo.md:

1. **0-A:** NotebookLM query → `.agent/context/step-{id}-nlm.json`
2. **0-B:** Load skills → `_base` + `executor`
3. **0-C:** Assemble context (NotebookLM + skills + memory + git)
4. **0-D:** Log pre-step → `factory/logs/log.json`

Только после 0-A→0-D → перейти к Ralph Loop.

## Ralph Loop Цикл

```
0-A → 0-B → 0-C → 0-D → R → A → L → P → H
```

R — Retrieve: Прочитать PRD + todo.md + context block
A — Act: Выполнить задачу (implement → test)
L — Learn: Что сработало / что нет → записать
P — Persist: POST /gateway/memory + SESSION.md
H — Handoff: ResultEnvelope → следующий агент

## Правила

1. Брать только первую незаконченную задачу из todo.md
2. Лимит контекста → суммаризация shadow-general → передача
3. Никогда не пишешь placeholder-код
4. Коммит после каждой фазы
5. Auditor check перед коммитом

## Инструменты
`Castor Shadow Provider → LLM Gateway → 17 models`
`openrouter → copilot → ollama`

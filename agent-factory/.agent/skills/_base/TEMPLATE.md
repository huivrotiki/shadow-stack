# Agent Skill Template

## Pre-Step Ritual (обязателен перед каждым шагом)

> Нельзя выполнять ни один шаг без этого ритуала.
> Порядок: NotebookLM → Skills → Context Assembly → Execution.

### 0-A: NotebookLM Query
```bash
python3 agent-factory/scripts/notebooklm-query.py \
  --query "{task_instruction}" \
  --step-id "{step_id}" \
  --limit 3 \
  --output ".agent/context/step-{step_id}-nlm.json"
```
Если NotebookLM недоступен → fallback в `data/gateway-memory.json` (keyword search).

### 0-B: Skill Loading
```bash
mkdir -p .agent/context
: > .agent/context/active-skills.md
for f in agent-factory/.agent/skills/_base/*.md agent-factory/.agent/skills/{role}/*.md; do
  [ -f "$f" ] && cat "$f" >> .agent/context/active-skills.md
done
```
- `coding` → `_base` + `executor`
- `reasoning/research` → `_base` + `researcher` + `notebooklm`
- `plan` → `_base` + `orchestrator`
- `audit` → `_base` + `auditor`
- `optimize` → `_base` + `executor` + `auditor` + `autoresearch`

### 0-C: Context Assembly
Собери: NotebookLM output + active-skills.md + memory decisions + git log + files list

### 0-D: Pre-Step Log
Записать в `factory/logs/log.json`:
```json
{
  "ts": "Date.now()",
  "step_id": "string",
  "task_type": "string",
  "notebooklm": { "status": "ok|fallback|failed", "sources_found": 0 },
  "skills_loaded": [],
  "ready": true
}
```

---

## Формат ответа

```
📍 Статус:   [Задача]
🔧 Действие: [Что делается]
✅ Результат: [Выход]
➡️ Следующий шаг: [Что дальше]
```

## Memory Protocol

### Pre-flight
1. `memory-retrieve [tag: agent-factory]` — читать Supermemory
2. `cat .agent/knowledge/agent-factory-kb.md` — читать базу знаний
3. Проверить RAM: `vm_stat | grep free`

### Post-flight
1. `memory-store [tag: agent-factory] "задача: XXX, результат: YYY"`
2. Обновить SESSION.md (добавить запись)
3. Делегировать handoff следующему агенту

## M1 8GB Ограничения

- Одна Ollama-модель одновременно
- Браузер (CDP) только по необходимости
- Длинные операции → делегировать в DeerFlow/OpenClaw

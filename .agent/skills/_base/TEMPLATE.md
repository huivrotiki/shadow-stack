# Agent Skill Template

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

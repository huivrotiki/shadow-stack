# Shadow Stack Project — Unified Structure

## Quick Start

```bash
# Запуск сервисов
cd /Users/work/shadow-stack_local_1
pm2 start ecosystem.proxy.cjs   # free-models-proxy (:20129)
pm2 start server/index.js --name shadow-api  # :3001

# Проверка
curl http://localhost:3001/ram
curl http://localhost:20129/health
```

## Архитектура

```
Shadow Stack Local 1
├── Autoresearch (self-improving AI)
│   ├── autoresearch/train.py      # SYSTEM_PROMPT (улучшается через LLM)
│   ├── autoresearch/evaluate.js   # Оценка качества (METRIC 0-1)
│   └── autoresearch/loop.js       # Цикл итераций (node loop.js [N])
│
├── ZeroClaw Pipeline (Commander + Executor)
│   ├── server/lib/zeroclaw-pipeline.cjs   # Оркестратор (4 фазы)
│   ├── server/lib/context-gather.cjs      # Сбор контекста (RAM, Memory, NotebookLM)
│   ├── server/lib/zeroclaw-state.cjs      # State persistence (JSON)
│   ├── server/lib/zeroclaw-test-runner.cjs # Тест-раннер
│   └── server/lib/zeroclaw-http.cjs      # HTTP API (:3001/api/zeroclaw/*)
│
└── Core Services
    ├── server/index.js            # Shadow API (:3001)
    ├── server/free-models-proxy.cjs  # LLM Gateway (:20129)
    └── server/lib/providers/      # Provider implementations
```

## Как работать с Autoresearch (AutoRoute)

### Запуск авто-исследования
```bash
# Быстрая проверка (3 runs)
node autoresearch/evaluate.js

# Полный цикл на 10 минут (20 итераций)
timeout 600 node autoresearch/loop.js 20

# Результат: METRIC показывает покрытие тем (1.0000 = 100%)
```

### Как это работает
1. `loop.js` берет текущий `train.py`
2. Отправляет в LLM (через :20129) с просьбой улучшить SYSTEM_PROMPT
3. `evaluate.js` проверяет улучшение (5 тем × 3 runs)
4. Если метрика выросла ≥1% — git commit
5. Цель: достичь stable 0.85+ (сейчас 1.0000)

## Как работать с ZeroClaw Pipeline

### API Endpoints
```bash
# Pre-flight + Context + Execute + Decision
curl -X POST http://localhost:3001/api/zeroclaw/orchestrate \
  -H 'Content-Type: application/json' \
  -d '{"goal": "объясни как работает pipeline", "model": "auto"}'

# Просто выполнение (старый метод)
curl -X POST http://localhost:3001/api/zeroclaw/execute \
  -H 'Content-Type: application/json' \
  -d '{"instruction": "say ok", "model": "auto"}'

# Состояние пайплайна
curl http://localhost:3001/api/zeroclaw/state
```

### Telegram Bot
```
/zc orch <goal>    # Запуск pipeline через бота
/zc status         # Проверка состояния
```

## Memory & Context

### Supermemory MCP
- Используется для долгосрочной памяти
- Вызывается через `mcp__mcp-supermemory-ai__recall`
- Ключевые инсайты сохраняются через `mcp__mcp-supermemory-ai__memory`

### NotebookLM CLI
```bash
/Users/work/.venv/notebooklm/bin/notebooklm ask "query"
```

### Context Gather (автоматический)
При вызове `/api/zeroclaw/orchestrate` автоматически собирает:
- RAM status (через `/ram`)
- Supermemory recall
- NotebookLM query
- Codebase scan (grep по ключевым словам)

## Память контекста (расширение Autoroute)

В `train.py` добавлены секции:
- `## Context & Memory Management` — инструкции по использованию Supermemory
- `## Fine-Tuning Loop (Ralph Loop)` — шаг 7: `Store: Save successful hypotheses to Supermemory`
- `## Shadow Stack Context` — ссылки на .state/, Supermemory, NotebookLM

## Troubleshooting

### "payload is too big"
✅ Исправлено: лимиты увеличены до 50mb в:
- `server/index.js` (строка 30)
- `server/free-models-proxy.cjs` (строка 10)

### "missing SYSTEM_PROMPT" в loop.js
Причина: LLM вернул некорректный ответ.
Решение: `train.py` остается неизменным, цикл продолжается.

### Сервисы не запущены
```bash
pm2 list  # проверка
pm2 start ecosystem.proxy.cjs
pm2 start server/index.js --name shadow-api
```

## Next Steps

1. **Интеграция**: использовать Pipeline для автоматического улучшения `train.py`
2. **Handoff**: при достижении 85% метрики — сделать handoff и `/clear`
3. **Monitoring**: следить за `data/zeroclaw-state.json` (последние 50 запусков)

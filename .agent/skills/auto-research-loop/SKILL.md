---
name: auto-research-loop
version: "1.0.0"
description: Циклический авто-ресёрч между моделями с авто-улучшениями
triggers: [cron, manual, telegram]
schedule: "0 */6 * * *"
models_pool:
  - shadow/gr-llama70b
  - shadow/ms-codestral
  - shadow/or-nemotron120
  - shadow/ds-v3
  - ollama/qwen2.5-coder:3b
output: data/research-results/
---

# Auto-Research Loop Skill

## Назначение
Автоматический ресёрч между моделями (round-robin), сравнение ответов, выбор лучшего и применение улучшений к файлам проекта.

## Параметры
- **maxRounds**: 3 (кругов между моделями)
- **delayMs**: 2000 (задержка между запросами)
- **scoreThreshold**: 0.75 (порог для авто-применения улучшений)

## Модели (models_pool)
1. `shadow/gr-llama70b` — самая мощная для кода
2. `shadow/ms-codestral` — специализированная модель
3. `shadow/or-nemotron120` — NVIDIA оптимизированная
4. `shadow/ds-v3` — DeepSeek V3
5. `ollama/qwen2.5-coder:3b` — локальная быстрая

## Темы (topics.json)
Темы загружаются из `.agent/skills/auto-research-loop/topics.json`. Если файл отсутствует, используются темы по умолчанию:

1. **cascade-optimization** — улучшение Cascade Router
2. **memory-layer** — практики ChromaDB v2
3. **pinokio-integration** — Pinokio script.json
4. **competitive-intel** — сравнение с аналогами

## Алгоритм работы
1. Загрузить список тем
2. Для каждой темы выполнить round-robin (3 раунда)
3. Обогащать запрос предыдущим лучшим ответом
4. Оценить ответы (score 0.0-1.0)
5. Синтезировать лучший ответ
6. Если score > threshold → применить к target_file
7. Сохранить результаты в `data/research-results/`
8. Отправить отчёт в Telegram

## Запуск
```bash
# Все темы
node scripts/auto-research/loop-engine.cjs

# Одна тема
node scripts/auto-research/loop-engine.cjs --topic=cascade-optimization

# Тест без применения (DRY_RUN=1)
DRY_RUN=1 node scripts/auto-research/loop-engine.cjs
```

## Результаты
- Сохраняются в `data/research-results/{topic-id}-{timestamp}.json`
- Состояние цикла: `.state/research-loop.json`
- Статистика для Telegram: кол-во применённых улучшений

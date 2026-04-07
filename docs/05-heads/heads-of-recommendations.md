# Heads of Recommendations

**Дата:** 2026-04-07  
**Статус:** Активный  
**Ответственный:** OpenCode Runtime

---

## 🎯 Стратегические рекомендации

### 1. RAM Optimization (КРИТИЧНО)

**Проблема:** RAM 98 MB из 8 GB (критично низкий)

**Рекомендации:**
1. ⚠️ **Немедленно:** Перезагрузить систему перед следующей сессией
2. Закрыть ненужные приложения (Chrome, wezterm-gui занимают 600+ MB)
3. Мониторить RAM каждые 30 минут во время работы
4. Настроить алерты при RAM < 500 MB

**Долгосрочно:**
- Рассмотреть увеличение RAM до 16 GB
- Оптимизировать hb-monitor (сейчас 65 MB)
- Использовать swap для некритичных процессов

---

### 2. Combo-Race Model Optimization

**Проблема:** combo-race работает медленно (7.5s вместо ожидаемых 0.2s)

**Рекомендации:**
1. Проверить `server/lib/combo-race.cjs` на параллельность
2. Использовать `Promise.race()` вместо последовательных вызовов
3. Добавить timeout для каждой модели (max 2s)
4. Логировать, какая модель выиграла race

**Пример оптимизации:**
```javascript
// Плохо (последовательно)
const result1 = await model1();
const result2 = await model2();
const result3 = await model3();

// Хорошо (параллельно)
const result = await Promise.race([
  model1(),
  model2(),
  model3()
]);
```

---

### 3. Model Testing Strategy

**Проблема:** 56 моделей не протестированы (52.8%)

**Рекомендации:**
1. Создать batch-тестирование (10 моделей за раз)
2. Автоматизировать через скрипт `scripts/test-models-batch.sh`
3. Сохранять результаты в `docs/00-overview/MODELS_TEST_RESULTS.md`
4. Удалять мёртвые модели сразу после обнаружения

**Приоритет тестирования:**
- Высокий: Groq, OpenRouter (бесплатные)
- Средний: Fireworks, Mistral
- Низкий: Модели, требующие API ключи

---

### 4. Telegram Bot Strategy

**Проблема:** shadow-bot крашился 17 раз, удалён из PM2

**Рекомендации:**
1. Если Telegram бот не нужен — удалить код из репозитория
2. Если нужен — добавить токены в `.env` и перезапустить
3. Добавить валидацию токенов при старте (fail-fast)
4. Документировать в README, как получить токены

**Пример валидации:**
```javascript
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN required');
  process.exit(1);
}
```

---

### 5. Heartbeat Monitoring Improvements

**Проблема:** hb-monitor запущен, но ollama-hb остановлен

**Рекомендации:**
1. Запустить ollama-hb для мониторинга Ollama
2. Добавить heartbeat для shadow-channels
3. Настроить Telegram алерты (сейчас нет токенов)
4. Создать dashboard для визуализации heartbeats

**Метрики для мониторинга:**
- Uptime каждого сервиса
- RAM usage trend
- Количество рестартов
- Latency моделей

---

### 6. Documentation Structure

**Проблема:** Документация реорганизована, но многие файлы пустые

**Рекомендации:**
1. Заполнить пустые файлы в `docs/01-plans/`, `docs/02-projects/`
2. Создать `docs/00-overview/QUICK_START.md`
3. Добавить диаграммы архитектуры (mermaid)
4. Обновить README.md с актуальной информацией

**Приоритет:**
- Высокий: QUICK_START.md, README.md
- Средний: Диаграммы архитектуры
- Низкий: Детальные планы проектов

---

### 7. Git Workflow Improvements

**Проблема:** Ветка models слита в main без PR review

**Рекомендации:**
1. Использовать feature branches для больших изменений
2. Создавать PR для review перед слиянием
3. Добавить pre-commit hooks для проверки:
   - Нет секретов в коде
   - Линтинг пройден
   - Тесты пройдены
4. Настроить GitHub Actions для CI/CD

---

### 8. Service Health Checks

**Проблема:** agent-bot и ollama-hb остановлены

**Рекомендации:**
1. Определить, нужны ли эти сервисы
2. Если нужны — диагностировать и запустить
3. Если не нужны — удалить из PM2 и ecosystem.config.cjs
4. Документировать назначение каждого сервиса

**Текущий статус:**
- agent-bot: stopped (2 restarts) — нужен?
- ollama-hb: stopped (0 restarts) — нужен?

---

### 9. Model Performance Tracking

**Проблема:** Нет централизованного трекинга производительности моделей

**Рекомендации:**
1. Создать `data/model-metrics.jsonl` для логирования
2. Записывать для каждого запроса:
   - model, latency, tokens, status, timestamp
3. Создать скрипт анализа `scripts/analyze-model-metrics.cjs`
4. Генерировать отчёты раз в день

**Метрики:**
- P50, P95, P99 latency
- Success rate
- Tokens per second
- Cost per request (для платных моделей)

---

### 10. Backup and Recovery

**Проблема:** Нет автоматического бэкапа критичных данных

**Рекомендации:**
1. Настроить ежедневный бэкап:
   - `.state/` → git commit
   - `data/heartbeats.jsonl` → rotate at 10MB
   - `handoff.md` → git commit
2. Создать скрипт восстановления `scripts/restore-from-backup.sh`
3. Тестировать восстановление раз в неделю
4. Хранить бэкапы в облаке (GitHub, Dropbox)

---

## 📊 Priority Matrix

### 🔴 Критично (сделать сейчас):
1. Перезагрузить систему (RAM 98 MB)
2. Оптимизировать combo-race модель
3. Заполнить heads-of-production.md ✅

### 🟡 Важно (сделать на этой неделе):
4. Протестировать 56 моделей
5. Настроить Telegram алерты
6. Создать QUICK_START.md

### 🟢 Желательно (сделать в этом месяце):
7. Добавить диаграммы архитектуры
8. Настроить CI/CD
9. Создать model metrics tracking
10. Настроить автоматический бэкап

---

## 🎯 Success Metrics

**Цели на следующую неделю:**
- [ ] RAM > 500 MB стабильно
- [ ] Все 106 моделей протестированы
- [ ] combo-race < 1s latency
- [ ] 0 крашей PM2 сервисов
- [ ] handoff.md обновляется каждую сессию

---

**Последнее обновление:** 2026-04-07 01:52  
**Версия:** 1.0

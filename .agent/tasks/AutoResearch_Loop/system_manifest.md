# AutoResearch Loop — System Manifest

> **Архитектура Андрея Карпатого:** Рекурсивное самосовершенствование через гипотезу → эксперимент → метрика → commit/reset

---

## Принцип работы «Петли Карпатого»

```
┌─────────────────────────────────────────────────────────────┐
│                    AutoResearch Loop                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. HYPOTHESIS  →  Агент анализирует код и выдвигает теорию │
│  2. CHANGE      →  Агент переписывает train.py              │
│  3. EXPERIMENT  →  Система запускает бенчмарк (5 мин)       │
│  4. METRIC      →  prepare.py оценивает результат           │
│  5. DECISION    →  git commit (лучше) или git reset (хуже)  │
│                                                              │
│  Цикл повторяется 100+ раз за ночь                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Святая Троица (3 файла)

### 1. `program.md` — Инструкции (Мозг и Совесть)

**Что внутри:**
- Глобальная цель (например: "Оптимизировать скорость загрузки API")
- Правила поведения (например: "Не используй сторонние библиотеки")
- Контекст задачи
- Ограничения (например: "RAM < 400MB")

**Роль:** Промпт для агента, объясняющий "что мы вообще здесь делаем"

### 2. `train.py` — Песочница (Единственный редактируемый файл)

**Что внутри:**
- Код, который нужно улучшить
- Логика нейросети / алгоритм трейдинга / скрипт обработки данных

**Роль:** Агент может менять ТОЛЬКО этот файл

### 3. `prepare.py` — Неподкупный Судья (Запрещено читать/менять)

**Что внутри:**
- Метрика успеха (скорость в мс, точность модели, конверсия)
- Тесты на корректность
- Объективная оценка результата

**Роль:** Защита от читерства — агент не может подделать метрику

---

## Архитектура для Shadow Stack

```
.agent/tasks/AutoResearch_Loop/
├── system_manifest.md          # Этот файл
├── Optimizer/                  # Агент-оптимизатор
│   ├── instructions.txt        # "Выдвигай гипотезы, меняй train.py"
│   ├── tools.json              # Git, Shadow LLM Gateway, RAM Guard
│   ├── memory.md               # История экспериментов
│   └── experiments/            # Логи всех попыток
│       ├── 2026-04-06_001.json
│       ├── 2026-04-06_002.json
│       └── ...
├── Judge/                      # Агент-судья (неподкупный)
│   ├── instructions.txt        # "Оценивай результаты, не читай prepare.py"
│   ├── tools.json              # Только чтение метрик
│   └── memory.md               # История оценок
└── projects/                   # Папки с проектами для оптимизации
    ├── example_llm_speed/
    │   ├── program.md          # Цель: ускорить LLM inference
    │   ├── train.py            # Код для оптимизации
    │   └── prepare.py          # Метрика: tokens/sec
    └── example_api_latency/
        ├── program.md          # Цель: снизить latency API
        ├── train.py            # Код для оптимизации
        └── prepare.py          # Метрика: response time (ms)
```

---

## Workflow

### 1. Пользователь создаёт проект

```bash
cd .agent/tasks/AutoResearch_Loop/projects/
mkdir my_optimization
cd my_optimization

# Создать 3 файла:
# - program.md (цель и правила)
# - train.py (код для оптимизации)
# - prepare.py (метрика успеха)
```

### 2. Запуск AutoResearch Loop

```bash
# Через Shadow Stack
curl -X POST http://localhost:3001/api/autoresearch/start \
  -H "Content-Type: application/json" \
  -d '{
    "project": "my_optimization",
    "max_iterations": 100,
    "time_per_experiment": 300
  }'
```

### 3. Optimizer работает

```
Iteration 1:
  Hypothesis: "Заменить sync на async в функции fetch_data()"
  Change: train.py modified
  Experiment: python train.py (5 min)
  Metric: 1250 ms → 980 ms (улучшение 21.6%)
  Decision: git commit -m "feat: async fetch_data - 21.6% faster"

Iteration 2:
  Hypothesis: "Добавить кэширование результатов"
  Change: train.py modified
  Experiment: python train.py (5 min)
  Metric: 980 ms → 1100 ms (ухудшение 12.2%)
  Decision: git reset --hard HEAD~1 (откат)

Iteration 3:
  Hypothesis: "Использовать connection pooling"
  ...
```

### 4. Judge оценивает

```
Best result after 100 iterations:
- Metric: 450 ms (baseline: 1250 ms)
- Improvement: 64% faster
- Commits: 23 successful optimizations
- Rollbacks: 77 failed experiments
```

---

## Интеграция с Shadow Stack

### RAM Guard

```javascript
// Перед каждым экспериментом
const ram = await fetch('http://localhost:3001/ram').then(r => r.json());
if (ram.free_mb < 400) {
  console.log('⚠️ RAM WARNING — пропускаем тяжёлый эксперимент');
  return 'SKIP';
}
```

### LLM Gateway

```javascript
// Optimizer использует shadow/auto для гипотез
const response = await fetch('http://localhost:20129/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'shadow/auto',
    messages: [
      { role: 'system', content: fs.readFileSync('program.md', 'utf8') },
      { role: 'user', content: 'Предложи следующую оптимизацию для train.py' }
    ]
  })
});
```

### Git Integration

```bash
# Optimizer делает коммиты автоматически
git add train.py
git commit -m "feat(autoresearch): iteration 42 - 15% improvement"

# При ухудшении — откат
git reset --hard HEAD~1
```

---

## Применение в Shadow Stack

### 1. Оптимизация LLM Inference

**Цель:** Ускорить генерацию токенов в Ollama  
**Метрика:** tokens/sec  
**train.py:** Параметры модели, batch size, context length  
**prepare.py:** Бенчмарк на 100 запросах

### 2. Оптимизация API Latency

**Цель:** Снизить время ответа Shadow API  
**Метрика:** response time (ms)  
**train.py:** Middleware, кэширование, connection pooling  
**prepare.py:** Нагрузочный тест (100 req/sec)

### 3. Оптимизация Memory Usage

**Цель:** Снизить потребление RAM на M1 8GB  
**Метрика:** peak_memory_mb  
**train.py:** Алгоритмы, структуры данных, garbage collection  
**prepare.py:** Профилирование памяти

### 4. Оптимизация GitHub Skills Sync

**Цель:** Ускорить синхронизацию 12 репозиториев  
**Метрика:** sync_time (seconds)  
**train.py:** Параллелизм, shallow clone, timeout  
**prepare.py:** Время выполнения scripts/github-skills-sync.sh

---

## Ограничения и защита от читерства

### 1. Субъективность

❌ **Не работает:** "Насколько этот дизайн красивый?"  
✅ **Работает:** "Конверсия лендинга (% кликов)"

### 2. Галлюцинации

**Защита:** prepare.py обязательно содержит тесты на корректность

```python
# prepare.py
def evaluate(result):
    # 1. Проверка корректности
    assert result['status'] == 'success', "Код упал с ошибкой"
    assert result['output'] == expected_output, "Неправильный результат"
    
    # 2. Метрика производительности
    return result['latency_ms']
```

### 3. Стоимость токенов

**Решение:** Использовать `shadow/auto` (локальные модели приоритетнее)

```yaml
# .state/current.yaml
autoresearch:
  model_preference: local_first
  fallback_to_cloud: only_if_stuck
  max_cost_per_iteration: 0.01  # $0.01 per experiment
```

---

## Смена парадигмы

**Раньше:**
- Программист проводит 3-5 экспериментов в день
- Ценность = умение писать код

**Теперь:**
- AutoResearch проводит 100+ экспериментов за ночь
- Ценность = умение **выбрать метрику** и **поставить задачу**

**Цитата Карпатого:**  
> "Если вы можете это измерить — вы можете это 'авто-исследовать'"

---

## Следующие шаги

1. Создать первый проект: `projects/llm_inference_speed/`
2. Реализовать Optimizer агента с git integration
3. Реализовать Judge агента с защитой от читерства
4. Интегрировать с Shadow API (`/api/autoresearch/start`)
5. Добавить dashboard для мониторинга экспериментов

---

**Дата создания:** 2026-04-06  
**Автор:** OpenCode (shadow-stack_local_1)  
**Статус:** Design — требует реализации

# Attention Optimization для LLM — primer + применение в shadow-stack
> Source: Alpha Signal Deep Dive (Ben Dickson) | Added: 2026-04-05k

---

## Суть проблемы

Стандартный attention механизм: каждый новый токен вычисляет отношение
ко ВСЕМ предыдущим токенам → **квадратичная стоимость вычислений**.

Удвоил промпт → вычислений в 4 раза больше.

**KV cache** решает пересчёт, но растёт линейно с контекстом →
memory wall → OOM crashes, медленный decode, дорогие API-вызовы.

Два узких места:
- **Prefill** — загрузка промпта → влияет на Time To First Token (TTFT)
- **Decode** — генерация токенов → ограничена memory bandwidth

---

## Три подхода к оптимизации

### 1. Simple Fixes (компромиссные)

| Метод | Как работает | Проблема |
|---|---|---|
| Sliding Window | Держит только N последних токенов | «Амнезия» — теряет начало промпта |
| Context Summarization | Сжимает историю в текст | Теряет детали → агент игнорирует инструкции |

> ⚠️ Context summarization может удалить инструкции из system prompt —
> агент начнёт делать то, что ему запрещено.

---

### 2. Sparse Attention (оптимальный для reasoning)

Вместо «внимание ко всему» или «дропаем старое» —
**динамически выбирает самые релевантные токены**.

**DeepSeek Sparse Attention (DSA)** — с DeepSeek-V3.2:
1. Lightning indexer — быстро сканирует контекст, находит важные токены
2. Heavy attention — только по отобранным токенам

→ Compute и memory **остаются константными** при росте контекста.

**IndexCache** (Z.ai, upgrade к DSA):
- Переиспользует индексированные токены между соседними слоями
- Сокращает вычисления индексера на **75%**
- Ускорение инференса: **1.82x** на long-context моделях

**Dynamic Memory Sparsification — DMS** (Nvidia):
- Retrofit к существующим моделям (не нужно переобучать)
- Delayed eviction — токены «стареют» постепенно (garbage collection)
- Сокращает стоимость reasoning в **8x** без потери точности

⚡ Слабость sparse attention: **needle-in-a-haystack** —
плохо ищет конкретный изолированный факт в глубине контекста.

---

### 3. KV Cache Compression (для детального retrieval)

Вместо дропа токенов — **математически сжимает KV cache целиком**.

**KVTC (KV Cache Transform Coding)** — Nvidia:
- Применяет PCA (Principal Component Analysis) к attention features
- Аналог JPEG для памяти модели
- Сжатие до **20x** без изменения весов модели
- TTFT быстрее в **8x** для массивных промптов
- Недостаток: overhead вычислений при prefill

---

## Decision Matrix — что выбрать

| Сценарий | Метод | Почему |
|---|---|---|
| Короткий контекст | Стандартный full attention | Максимальная точность |
| Long-context reasoning | Sparse attention (DSA/DMS) | Баланс скорости, памяти, recall |
| Детальный retrieval из массива данных | KV cache compression (KVTC) | Сохраняет весь attention trace |

---

## Применение в shadow-stack / OmniRoute

| Проблема проекта | Решение из статьи |
|---|---|
| OmniRoute теряет контекст при длинных сессиях | Выбирать модели с DSA (DeepSeek-V3+) |
| Telegram Shadow Layer: длинные чаты → OOM | KV cache compression или sliding window с осторожностью |
| `/research` параллельный — большой prefill | KVTC-модели быстрее дают первый токен (8x TTFT) |
| fallbackCascade при OOM crashes | DMS-retrofit модели дают 8x экономию памяти |
| Context summarization в handoff.md | Риск: агент может потерять Hard Rules — предпочесть sparse attention |

### Рекомендованные модели для OmniCascade с учётом оптимизаций

| Tier | Провайдер | Тип attention | Примечание |
|---|---|---|---|
| `smart` | DeepSeek-V3 / R1 | DSA (sparse) | Лучший выбор для long-context |
| `fast` | Cerebras Llama 8B | Стандартный | Короткие запросы < 300 симв. |
| `large-ctx` | MiniMax M2.5 (1M ctx) | Sparse (предположительно) | Документы, кодобазы |
| `shadow` | Telegram bots | N/A (внешний) | Нет контроля над памятью |

---

## Вывод для агентных воркфлоу

Sparse attention + KV compression позволяют агентам держать контекст
**неделями** в тех же memory constraints. Для shadow-stack это означает:
- Handoff-сессии без потери начальных инструкций
- OmniRoute без OOM при длинных repo-анализах
- Стабильный каскад без memory-driven crashes

# Barsuk Super Model — Документация

**Дата созания:** 2026-04-24 01:45  
**Автор:** OpenCode  
**Commit:** `47676199`

---

## Что такое Barsuk?

`barsuk` — это **супер-модель** (алиас `auto`), которая объединяет все 140 моделей через систему авто-роутинга.

### Основные характеристики:
- **140 моделей** (139 + barsuk сама)
- **Авто-выбор** лучшей модели через каскад
- **Self-healing** (переключение при ошибках 429/500)
- **Provider Scoring** (выбор по latency + rate limits)
- **Memory Layer** (запоминание удачных решений)

---

## Как использовать

### 1. В opencode.json (уже установлено по умолчанию)

```json
{
  "model": "shadow/barsuk",
  "small_model": "shadow/barsuk",
  
  "provider": {
    "shadow": {
      "models": {
        "barsuk": { "name": "Barsuk Super Model (all 140 models)" },
        "auto": { "name": "Auto Route (Shadow Stack)" }
      }
    }
  }
}
```

### 2. В коде (autoresearch)

```javascript
// autoresearch/loop.js:39
const model = "barsuk"; // Barsuk Super Model - all 140 models via auto-router

// autoresearch/evaluate.js:7
const MODEL = 'barsuk'; // Barsuk Super Model - all 140 models via auto-router
```

### 3. Через curl

```bash
curl -X POST http://localhost:20129/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "barsuk",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": false
  }'
```

---

## Логика работы

### Схема прохождения запроса:

```
User запрос с model="barsuk"
         ↓
Proxy (server/free-models-proxy.cjs:682-685)
if (model === 'auto' || model === 'barsuk') {
  return handleGatewayRoute(req, res, messages, stream);
}
         ↓
Gateway (server/lib/llm-gateway.cjs)
1. Task Router определяет тип задачи:
   - 'chat'       → обычный чат
   - 'reasoning'  → если нужно рассуждение
   - 'code'       → если код

2. Provider Scorer выбирает провайдера:
   - По приоритету (каскад)
   - По score (latency + rate limits)
   - По доступности (нет ли 429 ошибки)

3. Cascade Chain (Tier 0→5) — 24 модели:
   - Tier 0: fastest (gm-flash, kc-*, ...)
   - Tier 1: KiroAI Claude (omni-sonnet, kc-claude-haiku)
   - Tier 2: Groq LPU (gr-llama8b=261ms, ...)
   - Tier 3-4: Other free tiers
   - Tier 5: Local Ollama

4. Self-healing (если ошибка):
   - 429 Rate Limit? → переход к следующей модели
   - 500 Server Error? → fallback
   - 404 Not Found? → пропуск модели

5. Memory Layer запоминает:
   - Какая модель работала лучше
   - Какие провайдеры сейчас в лимите
   - История попыток (data/gateway-memory.json)
```

---

## Cascade Chain (24 модели)

### Tier 0: Fastest (OmniRoute KiroAI free)
```
gm-flash          — Gemini 2.5 Flash (OmniRoute free)
gm-flash-lite     — Gemini 2.5 Flash Lite (OmniRoute free)
kc-step-flash     — StepFun Flash (OmniRoute free, ~300ms)
kc-gpt5-nano     — GPT-5 Nano (OmniRoute free, fast)
kc-gpt4o-mini    — GPT-4o Mini (OmniRoute free)
kc-gemini-lite   — Gemini 2.5 Flash Lite (kc/)
kc-llama4-scout  — Llama 4 Scout (OmniRoute free)
kc-mistral7b     — Mistral 7B (OmniRoute free)
```

### Tier 1: KiroAI Claude (free tier)
```
omni-sonnet      — Claude Sonnet 4.5 via KiroAI (free)
kc-claude-haiku   — Claude 3 Haiku (OmniRoute free)
```

### Tier 2: Groq LPU (fastest external)
```
gr-llama8b       — Groq Llama 3.1 8B (261ms — fastest!)
gr-llama70b      — Groq Llama 3.3 70B (fast, free)
gr-qwen3-32b     — Groq Qwen3 32B (fast, free)
cb-llama70b      — Cerebras Llama 70B (fast)
```

### Tier 3: Other free tiers
```
gem-2.5-flash    — Gemini 2.5 Flash (free tier)
ms-small         — Mistral Small (free tier, 383ms)
or-nemotron      — NVIDIA Nemotron via OpenRouter (696ms)
or-step-flash    — StepFun Flash via OpenRouter (free)
```

### Tier 4: Fallback options
```
hf-llama8b       — HuggingFace Llama 8B
nv-llama70b      — NVIDIA NIM Llama 70B (free)
fw-llama70b      — Fireworks Llama 70B
co-command-r     — Cohere Command R (free tier)
hf-qwen72b       — HuggingFace Qwen72B
```

### Tier 5: Local Ollama
```
ol-qwen2.5-coder — Local Ollama fallback (no rate limits)
```

---

## Пример ответа

```json
{
  "model": "barsuk",
  "x_provider": "ollama",
  "x_model": "qwen2.5-coder:3b",
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "Hello! How can I assist you today?"
    }
  }],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 15,
    "total_tokens": 35
  },
  "x_latency_ms": 1000,
  "x_strategy": "cascade_tier_5"
}
```

**Заголовки:**
- `x_provider` — какой провайдер выполнил запрос
- `x_model` — конкретная модель
- `x_latency_ms` — время ответа в миллисекундах
- `x_strategy` — какая стратегия была использована

---

## Отличия от `auto`

| Параметр | `auto` | `barsuk` |
|-----------|--------|----------|
| Количество моделей | 139 | 140 (включая саму barsuk) |
| Логика | Gateway Task Router | Gateway Task Router (identical) |
| Настройка | `shadow/auto` | `shadow/barsuk` |
| Цель | Авто-роутинг | Супер-модель с именем barsuk |

**Итого:** `barsuk` = `auto` (полный алиас), просто другое имя для удобства.

---

## Provider Scoring

Каждый провайдер получает score:

```javascript
score = (
  latency_weight * (1 / latency_ms) +    // Чем быстрее, тем лучше
  success_weight * success_rate +          // Чем больше успехов, тем лучше
  limit_weight * (1 - usage_ratio)         // Чем меньше лимитов использовано, тем лучше
)
```

### Где хранятся scores?
`data/provider-scores.json` — обновляется после каждого запроса.

---

## Memory Layer

### Где хранятся данные?
`data/gateway-memory.json` — запоминает:
- Какая модель работала лучше для типа задачи
- Какие провайдеры сейчас в лимите
- История успешных/неуспешных попыток

### Пример записи:
```json
{
  "projects": {
    "autoresearch": [
      { "type": "decision", "content": "Use barsuk for better routing", "ts": 1776987600000 }
    ]
  },
  "decisions": [
    { "project": "autoresearch", "decision": "Switched to barsuk model", "ts": 1776987600000 }
  ]
}
```

---

## Troubleshooting

### Ошибка: "All providers failed"
**Причина:** Все модели в каскаде вернули ошибку (429/500/404).  
**Решение:** Проверьте `tail -30 /tmp/proxy.log` для деталей.

### Модель всегда роутится на Ollama
**Причина:** Ollama локальный, поэтому самый быстрый (нет сетевых задержек).  
**Статус:** Не баг, а особенность (Ollama = ~1000ms vs Groq = ~5000ms).

### Missing API keys
**Причина:** Для некоторых провайдеров (Zen, Together, Copilot) нужны API keys.  
**Решение:** Добавьте в `.env`:
```bash
ZEN_API_KEY=your_key
TOGETHER_API_KEY=your_key
GITHUB_TOKEN=your_token
```

---

## Commits

| Hash | Description |
|------|-------------|
| `47676199` | feat(barsuk): add barsuk super model (140 models), set as default, fix or-qwen3.6 deprecated |
| `e6d38319` | chore(handoff): final session summary — auto model setup, 139 models |
| `4955335c` | fix(autoresearch): use auto model instead of hardcoded gr-llama8b |

---

**✅ Документация обновлена: 2026-04-24 01:45**

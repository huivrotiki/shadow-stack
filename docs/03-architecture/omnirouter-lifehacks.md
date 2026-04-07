# OmniRouter Lifehacks + Telegram Shadow Bots
> Session: 2026-04-05k | Branch: feat/portable-state-layer

## Архитектура OmniCascade — полная карта провайдеров

| Tier | Провайдер | Лимит/день | Скорость | Лайфхак |
|---|---|---|---|---|
| `fast` | **Cerebras** Llama 3.1 8B | 7 200 req | ~0.5–1s | ЛХ-6: короткие вопросы < 300 симв. |
| `fast` | **Groq** Llama 3.3 70B | 14 400 req | ~1–2s | ЛХ-7: второй быстрый tier |
| `smart` | **Gemini** 2.0 Flash | 1 500 req | ~2–3s | ЛХ-3: CostGuard при 90% квоты |
| `smart` | **omni-sonnet** (KiroAI) | $0 | ~2–4s | ЛХ-2: параллельный research |
| `large-ctx` | **MiniMax M2.5** (OR:free, 1M ctx) | ~500 req | ~3–5s | ЛХ-5: документы, кодовые базы |
| `free-pool` | 11 OR:free моделей | вар. | ~3–8s | ЛХ-5: авто-перебор |
| `shadow` | **@chatgpt_gidbot** (GPT-4) | неогр. | ~15–30s | ЛХ-4: чанки по 3500 симв. |
| `shadow` | **@deepseek_gidbot** | неогр. | ~15–30s | ЛХ-4: код и анализ |
| `shadow+` | **@SYNTX_bot**, **@ChainBrainAIBot** | неогр. | ~20–40s | расширение через providers |
| `legacy` | `fallbackCascade()` ollama→OR | неогр. | вар. | последний резерв |

## 7 Лайфхаков OmniRouter

### ЛХ-1 — RAM-aware routing
Проверять `free_mb` через `/ram` endpoint перед каждым вызовом Ollama.
```
free_mb < 300 → только cloud (Gemini/Groq/OR:free)
free_mb > 500 → разрешить Ollama 3B как первый tier
```

### ЛХ-2 — Параллельный ресёрч
```js
Promise.allSettled([
  omniSonnet(prompt),   // KiroAI, $0
  geminiFlash(prompt),  // Google, $0
  groqLlama70b(prompt)  // Groq, $0
]).then(synthesize)     // синтез + указать противоречия
```

### ЛХ-3 — CostGuard
```
if (checkUsage('gemini')) → skip → next in cascade
Лимиты: gemini 1500/day, groq 14400/day, cerebras 7200/day
При 90% → автоматически следующий провайдер. Статус: /gateway/stats
```

### ЛХ-4 — Telegram Shadow Layer
```
warmAndAsk('@chatgpt_gidbot', prompt, 30000)
- Чанки по 3500 символов (лимит Telegram = 4096)
- Пауза 1000ms между чанками
- bot.removeListener('message', handler) при timeout
- Фильтр: msg.from.username.includes('gidbot')
```

### ЛХ-5 — OpenRouter :free авто-перебор (Port :20129)
```
callOpenRouterAny(prompt) → Free Proxy :20129
MiniMax M2.5 (1M ctx) → GPT OSS 120B → Nemotron 120B → Llama 3.3 70B
→ Gemma 27B → StepFun Flash → Trinity Large → GLM-4.5 Air
→ NVIDIA Nemotron 9B → Qwen3.6+ → Qwen3 Coder → GPT OSS 20B
Все $0. MiniMax — для длинных контекстов (docs, codebase).
```

### ЛХ-6 — Cerebras для мгновенных ответов
```
Tier: 'fast' в selectTier()
~0.5s inference. Для: быстрых команд, status-check, < 300 симв.
Модель: llama3.1-8b (единственная доступная на аккаунте)
```

### ЛХ-7 — Каскад как страховка от даунтаймов
```
omni-sonnet → cerebras → gemini → groq → shadow-auto
→ openrouter-any → tg-chatgpt → tg-deepseek → fallbackCascade()
Лог: [OMNI] ❌ provider → next (error msg)
Финал: ollama → openrouter (free-proxy :20129)
```

## Telegram AI — полный арсенал

### Уже в проекте (bot/opencode-telegram-bridge.cjs)
| Бот | Что умеет |
|-----|-----------|
| `@chatgpt_gidbot` | GPT-4 Q&A, fallback |
| `@deepseek_gidbot` | Код, рассуждения, анализ |

### Добавить в providers (agent-factory/server/lib/ai-sdk.cjs)
```js
// Shadow+ bots — warmAndAsk pattern
{ name: 'tg-syntx',  fn: () => warmAndAsk('@SYNTX_bot',         prompt), tiers: ['shadow'] },
{ name: 'tg-chain',  fn: () => warmAndAsk('@ChainBrainAIBot',   prompt), tiers: ['shadow'] },
{ name: 'tg-neuro',  fn: () => warmAndAsk('@Ai_Neirobot',       prompt), tiers: ['shadow'] },
{ name: 'tg-neurolab', fn: () => warmAndAsk('@NeuroLabBot',     prompt), tiers: ['shadow'] },
```

| Бот | Модели | Особенности |
|-----|--------|-------------|
| `@SYNTX_bot` | GPT o1 | без VPN, неогр. $0 |
| `@ChainBrainAIBot` | GPT-5, DeepSeek R1, Claude, DALL·E | агрегатор |
| `@Ai_Neirobot` | текст+картинки+видео | без регистрации |
| `@NeuroLabBot` | фото, текст, музыка | агрегатор |

## Порты (актуальные)
| Сервис | Порт | Назначение |
|--------|------|-----------|
| free-models-proxy | 20129 | Shadow Proxy, 113 моделей |
| OmniRoute (KiroAI) | 20130 | Tier1, kr/claude-sonnet-4.5 |
| ZeroClaw Control | 4111 | /dispatch, /health |
| sub-kiro | 20131 | ralph_loop_verify, local_commit |
| shadow-api | 3001 | /health, /ram, /api/cascade |
| agent-bot | 4000 | Telegram polling |

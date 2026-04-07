# Model Limits & Availability — 2026-04-06

## 📊 Summary

- **Total models in config:** 106 (was 113, removed 7 dead models)
- **Working models:** 25 (50% of tested)
- **Requires API key:** 18 models (zen-*, tg-*)
- **Dead/removed:** 7 models

---

## ✅ Working Free Models (by speed tier)

### 🚀 ULTRA FAST (< 500ms) — Best for real-time

| Model | Latency | Provider | RPM | RPD | Credits | Refresh |
|-------|---------|----------|-----|-----|---------|---------|
| gr-llama8b | 204ms | Groq | 30 | 14400 | Free | Daily |
| gr-gpt-oss20 | 224ms | Groq | 30 | 14400 | Free | Daily |
| gr-gpt-oss120 | 248ms | Groq | 30 | 14400 | Free | Daily |
| gr-llama4 | 279ms | Groq | 30 | 14400 | Free | Daily |
| ms-codestral | 317ms | Mistral | 1 | - | Free tier | Monthly |
| gr-compound | 345ms | Groq | 30 | 14400 | Free | Daily |
| gr-llama70b | 366ms | Groq | 30 | 14400 | Free | Daily |
| gr-qwen3 | 399ms | Groq | 30 | 14400 | Free | Daily |
| gr-kimi-k2 | 442ms | Groq | 30 | 14400 | Free | Daily |

**Rate limits applied:** 60 rpm, 1000 rph, burst 10

---

### ⚡ FAST (500-2000ms) — Balanced speed/quality

| Model | Latency | Provider | RPM | RPD | Credits | Refresh |
|-------|---------|----------|-----|-----|---------|---------|
| gr-qwen3-32b | 534ms | Groq | 30 | 14400 | Free | Daily |
| fw-llama70b | 597ms | Fireworks | - | - | $1/day | Daily |
| ms-small | 696ms | Mistral | 1 | - | Free tier | Monthly |
| or-minimax | 1352ms | OpenRouter | 20 | 200 | Free | Daily |
| or-gpt-oss20 | 1328ms | OpenRouter | 20 | 200 | Free | Daily |
| ms-large | 1460ms | Mistral | 1 | - | Free tier | Monthly |
| or-gpt-oss120 | 1971ms | OpenRouter | 20 | 200 | Free | Daily |

**Rate limits applied:** 40 rpm, 700 rph, burst 7

---

### 🐢 MEDIUM (2000-7000ms) — Quality over speed

| Model | Latency | Provider | RPM | RPD | Credits | Refresh |
|-------|---------|----------|-----|-----|---------|---------|
| or-gemma12b | 3704ms | OpenRouter | 20 | 200 | Free | Daily |
| or-trinity | 4233ms | OpenRouter | 10 | 200 | Free | Daily |
| ms-medium | 4140ms | Mistral | 1 | - | Free tier | Monthly |
| or-nemotron120 | 5874ms | OpenRouter | 20 | 200 | Free | Daily |
| or-qwen3.6 | 6298ms | OpenRouter | 20 | 200 | Free | Daily |
| or-nemotron | 6689ms | OpenRouter | 20 | 200 | Free | Daily |

**Rate limits applied:** 30 rpm, 500 rph, burst 5

---

### 🐌 SLOW (> 7000ms) — Use only when necessary

| Model | Latency | Provider | RPM | RPD | Credits | Refresh |
|-------|---------|----------|-----|-----|---------|---------|
| or-step-flash | 9983ms | OpenRouter | 20 | 200 | Free | Daily |
| or-glm4 | 16513ms | OpenRouter | 20 | 200 | Free | Daily |

**Rate limits applied:** 20 rpm, 300 rph, burst 3

---

## ⚠️ Requires API Key (18 models)

### OpenCode Zen (12 models) — Paid service
**Status:** ❌ NO API KEY  
**Setup:** Set `OPENCODE_ZEN_KEY` in `.env`  
**Models:** zen-opus, zen-sonnet, zen-sonnet-4-5, zen-haiku, zen-gpt5, zen-gpt5-pro, zen-gpt5-mini, zen-gpt5-nano, zen-codex, zen-codex-spark, zen-gemini-pro, zen-gemini-flash

### Together AI (6 models) — $5 signup credit
**Status:** ❌ NO API KEY  
**Setup:** Set `TOGETHER_API_KEY` in `.env`  
**Signup:** https://api.together.xyz (get $5 free credit)  
**Models:** tg-llama70b, tg-llama405b, tg-qwen-coder, tg-deepseek-v3, tg-deepseek-r1, tg-mixtral

---

## ❌ Removed Dead Models (7 models)

### OpenRouter (4 models)
- `or-llama70b` — Model removed from OpenRouter free tier
- `or-llama3b` — Model removed from OpenRouter free tier
- `or-gemma27b` — Model removed from OpenRouter free tier
- `or-qwen3coder` — Model removed from OpenRouter free tier

### Fireworks AI (3 models)
- `fw-llama405b` — Not available or requires more credits
- `fw-deepseek-v3` — Not available or requires more credits
- `fw-deepseek-r1` — Not available or requires more credits

---

## 🎯 Recommended Models by Use Case

### For Speed (< 500ms):
1. **gr-llama8b** (204ms) — Fastest, good for simple tasks
2. **gr-gpt-oss20** (224ms) — Fast, better quality
3. **ms-codestral** (317ms) — Best for code generation

### For Quality:
1. **gr-llama70b** (366ms) — Best balance (fast + quality)
2. **or-trinity** (4233ms) — High quality reasoning
3. **or-nemotron120** (5874ms) — Large context, good quality

### For Coding:
1. **ms-codestral** (317ms) — Specialized for code
2. **gr-llama70b** (366ms) — General purpose, fast
3. **or-qwen3.6** (6298ms) — Good for complex code

### Universal (best overall):
1. **gr-compound** (345ms) — Groq's best model
2. **gr-llama70b** (366ms) — Fast + quality
3. **or-minimax** (1352ms) — Good balance

---

## 📝 Provider Limits Summary

| Provider | Free Tier | RPM | RPD | Refresh | Notes |
|----------|-----------|-----|-----|---------|-------|
| **Groq** | ✅ Yes | 30 | 14400 | Daily | Best for speed |
| **OpenRouter** | ✅ Yes | 10-20 | 200 | Daily | Good variety |
| **Mistral** | ✅ Yes | 1 | - | Monthly | Very limited |
| **Fireworks** | ✅ Yes | - | - | Daily | $1/day credit |
| **OpenCode Zen** | ❌ Paid | - | - | - | Requires key |
| **Together AI** | ⚠️ $5 credit | - | - | - | Signup required |

---

## 🔄 Credit Refresh Schedule

- **Groq:** Daily reset at 00:00 UTC
- **OpenRouter:** Daily reset at 00:00 UTC
- **Mistral:** Monthly reset (1st of month)
- **Fireworks:** Daily $1 credit


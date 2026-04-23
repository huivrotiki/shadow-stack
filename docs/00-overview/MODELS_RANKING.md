# Free Models Ranking & Limits
**Date:** 2026-04-01 00:48 UTC  
**Test:** "2+2=?" with max_tokens=10

---

## 🏆 Performance Ranking (by speed)

| Rank | Model | Speed | Status | Provider |
|------|-------|-------|--------|----------|
| 🥇 1 | **groq/llama-3.3-70b** | 282ms | ✅ | Groq |
| 🥈 2 | **mistral/small** | 302ms | ✅ | Mistral AI |
| 🥉 3 | **openrouter/nemotron** | 696ms | ✅ | OpenRouter |
| 4 | zen/big-pickle | 1455ms | ✅ | OpenCode Zen |
| 5 | zen/nemotron | 1743ms | ✅ | OpenCode Zen |
| 6 | openrouter/step-flash | 1792ms | ✅ | OpenRouter |
| 7 | openrouter/qwen3.6 | 2437ms | ✅ | OpenRouter |
| 8 | zen/qwen3.6 | 4142ms | ✅ | OpenCode Zen |
| 9 | ollama/qwen2.5-coder | 11260ms | ✅ | Ollama (local) |
| 10 | openrouter/trinity | 24538ms | ✅ | OpenRouter |
| 11 | ollama/qwen2.5 | 30000ms | ⏱️ TIMEOUT | Ollama (local) |

---

## 📊 Model Details & Limits

### 🥇 Tier 1: Ultra Fast (< 500ms)

#### 1. Groq Llama 3.3 70B
- **Model ID:** `groq/llama-3.3-70b`
- **Speed:** 282ms ⚡
- **Parameters:** 70B
- **Context:** 8,192 tokens
- **Limits:**
  - 30 requests/minute (RPM)
  - 14,400 requests/day (RPD)
  - 7,000 tokens/minute (TPM)
- **Best for:** Coding, fast responses, production
- **Cost:** FREE

#### 2. Mistral Small
- **Model ID:** `mistral/small`
- **Speed:** 302ms ⚡
- **Parameters:** 22B
- **Context:** 32,768 tokens
- **Limits:**
  - 5 requests/second
  - FREE tier: 1M tokens/month
- **Best for:** General tasks, reasoning
- **Cost:** FREE tier available

---

### 🥈 Tier 2: Fast (500ms - 2s)

#### 3. OpenRouter Nemotron 3 Super
- **Model ID:** `openrouter/nemotron`
- **Speed:** 696ms
- **Parameters:** 120B
- **Context:** 4,096 tokens
- **Limits:**
  - FREE tier (no rate limit published)
  - Shared capacity
- **Best for:** Complex reasoning
- **Cost:** FREE

#### 4. OpenCode Zen Big Pickle
- **Model ID:** `zen/big-pickle`
- **Speed:** 1455ms
- **Parameters:** Unknown (stealth model)
- **Context:** 8,192 tokens
- **Limits:**
  - Rate limited (exact limits unknown)
  - FREE tier
- **Best for:** Experimental tasks
- **Cost:** FREE

#### 5. OpenCode Zen Nemotron
- **Model ID:** `zen/nemotron`
- **Speed:** 1743ms
- **Parameters:** 120B
- **Context:** 4,096 tokens
- **Limits:**
  - Rate limited (exact limits unknown)
  - FREE tier
- **Best for:** Complex reasoning
- **Cost:** FREE

#### 6. OpenRouter Step 3.5 Flash
- **Model ID:** `openrouter/step-flash`
- **Speed:** 1792ms
- **Parameters:** Unknown
- **Context:** 8,192 tokens
- **Limits:**
  - FREE tier (no rate limit published)
  - Shared capacity
- **Best for:** Fast inference
- **Cost:** FREE

---

### 🥉 Tier 3: Medium (2s - 5s)

#### 7. OpenRouter Qwen 3.6 Plus
- **Model ID:** `openrouter/qwen3.6`
- **Speed:** 2437ms
- **Parameters:** 72B
- **Context:** 32,768 tokens
- **Limits:**
  - FREE tier (no rate limit published)
  - Shared capacity
- **Best for:** Long context, research
- **Cost:** FREE

#### 8. OpenCode Zen Qwen 3.6
- **Model ID:** `zen/qwen3.6`
- **Speed:** 4142ms
- **Parameters:** 72B
- **Context:** 32,768 tokens
- **Limits:**
  - Rate limited (exact limits unknown)
  - FREE tier
- **Best for:** Long context, research
- **Cost:** FREE

---

### 🐌 Tier 4: Slow (> 10s)

#### 9. Ollama Qwen 2.5 Coder 3B (Local)
- **Model ID:** `ollama/qwen2.5-coder`
- **Speed:** 11260ms
- **Parameters:** 3B
- **Context:** 32,768 tokens
- **Limits:**
  - No limits (local)
  - RAM: ~2GB
- **Best for:** Offline coding, no internet
- **Cost:** FREE (local)

#### 10. OpenRouter Trinity Large
- **Model ID:** `openrouter/trinity`
- **Speed:** 24538ms
- **Parameters:** Unknown
- **Context:** 8,192 tokens
- **Limits:**
  - FREE tier (no rate limit published)
  - Shared capacity
- **Best for:** Detailed responses (when time is not critical)
- **Cost:** FREE

#### 11. Ollama Qwen 2.5 7B (Local) ⚠️
- **Model ID:** `ollama/qwen2.5`
- **Speed:** 30000ms (TIMEOUT)
- **Parameters:** 7B
- **Context:** 128,000 tokens
- **Limits:**
  - No limits (local)
  - RAM: ~4.7GB
- **Status:** ❌ Too slow for 8GB RAM Mac
- **Best for:** NOT RECOMMENDED on 8GB RAM
- **Cost:** FREE (local)

---

## 🎯 Recommended Usage by Task

### Coding Tasks
1. **groq/llama-3.3-70b** (282ms) - Best overall
2. **mistral/small** (302ms) - Good alternative
3. **ollama/qwen2.5-coder** (11s) - Offline only

### Research & Long Context
1. **openrouter/qwen3.6** (2.4s) - 32K context
2. **zen/qwen3.6** (4.1s) - 32K context
3. **mistral/small** (302ms) - 32K context

### Complex Reasoning
1. **openrouter/nemotron** (696ms) - 120B params
2. **zen/nemotron** (1.7s) - 120B params
3. **groq/llama-3.3-70b** (282ms) - 70B params

### Fast Prototyping
1. **groq/llama-3.3-70b** (282ms)
2. **mistral/small** (302ms)
3. **openrouter/nemotron** (696ms)

### Offline/No Internet
1. **ollama/qwen2.5-coder** (11s) - Only option
2. ❌ **ollama/qwen2.5** - Too slow

---

## 📈 Rate Limits Summary

| Provider | RPM | RPD | TPM | Notes |
|----------|-----|-----|-----|-------|
| Groq | 30 | 14,400 | 7,000 | Strict limits |
| Mistral | 300 | - | 1M/month | FREE tier |
| OpenRouter | Unknown | Unknown | Unknown | Shared capacity |
| OpenCode Zen | Unknown | Unknown | Unknown | Rate limited |
| Ollama | ∞ | ∞ | ∞ | Local, no limits |

**Legend:**
- RPM = Requests Per Minute
- RPD = Requests Per Day
- TPM = Tokens Per Minute

---

## ⚠️ Important Notes

1. **Groq** has the strictest limits (30 RPM) but is the fastest
2. **Mistral** has generous FREE tier (1M tokens/month)
3. **OpenRouter** FREE models share capacity (may be slow during peak)
4. **OpenCode Zen** has unknown rate limits (test carefully)
5. **Ollama** local models have no limits but are slow on 8GB RAM
6. **ollama/qwen2.5** (7B) is NOT recommended on 8GB RAM (30s timeout)

---

## 🔄 Fallback Strategy

**Recommended cascade:**
1. Try **groq/llama-3.3-70b** (fastest)
2. If rate limited → **mistral/small**
3. If rate limited → **openrouter/nemotron**
4. If all fail → **ollama/qwen2.5-coder** (local)

---

**Test completed:** 2026-04-01 00:48 UTC  
**Total models tested:** 11  
**Working models:** 10  
**Failed models:** 1 (ollama/qwen2.5 - timeout)

# Shadow Stack - Статус Моделей

**Дата:** 2026-04-07 02:32 UTC (04:32 Berlin)
**Ветка:** models
**Анализ:** free-models-proxy :20129 + OmniRoute :20130 + Ollama :11434

---

## 📊 Сводка по API ключам

| Провайдер | Статус | Примечание |
|-----------|--------|------------|
| OpenRouter | ✅ SET | FREE tier (qwen3.6, llama70b, etc.) |
| OpenCode Zen | ✅ SET | Premium gateway (Claude, GPT-5, Gemini) |
| Anthropic | ✅ SET | Direct API (Claude Sonnet/Haiku) |
| GitHub Copilot | ✅ SET | GPT-5.4, Claude 4.6, Gemini 2.5 |
| Groq | ❌ NOT SET | LPU inference (llama70b, qwen3) |
| Mistral | ❌ NOT SET | mistral-small/medium/large |
| NVIDIA NIM | ❌ NOT SET | 5000 free credits |
| Together AI | ❌ NOT SET | $5 free credit |
| Fireworks | ❌ NOT SET | $1 daily credit |
| Cohere | ❌ NOT SET | Command R+ trial |
| Gemini | ❌ NOT SET | Google AI Studio |
| DeepSeek | ❌ NOT SET | DeepSeek V3/R1 |
| HuggingFace | ❌ NOT SET | Router API |
| Cerebras | ❌ NOT SET | Fast inference |
| SambaNova | ❌ NOT SET | Llama 70B, Qwen 72B |

---

## 🟢 БЕСПЛАТНЫЕ МОДЕЛИ (Доступны сейчас)

### OpenRouter FREE (✅ Работает)
- `or-qwen3.6` - qwen/qwen3.6-plus:free
- `or-step-flash` - stepfun/step-3.5-flash:free
- `or-nemotron` - nvidia/nemotron-nano-9b-v2:free
- `or-nemotron120` - nvidia/nemotron-3-super-120b-a12b:free
- `or-trinity` - arcee-ai/trinity-large-preview:free
- `or-minimax` - minimax/minimax-m2.5:free
- `or-llama70b` - meta-llama/llama-3.3-70b-instruct:free
- `or-llama3b` - meta-llama/llama-3.2-3b-instruct:free
- `or-gemma27b` - google/gemma-3-27b-it:free
- `or-gemma12b` - google/gemma-3-12b-it:free
- `or-qwen3coder` - qwen/qwen3-coder:free
- `or-gpt-oss120` - openai/gpt-oss-120b:free
- `or-gpt-oss20` - openai/gpt-oss-20b:free
- `or-glm4` - z-ai/glm-4.5-air:free

### Ollama Local (✅ Работает)
- `ol-qwen2.5-coder` - qwen2.5-coder:3b (локально)
- `ol-qwen2.5` - qwen2.5:7b (локально)
- `ol-llama3.2` - llama3.2:3b (локально)
- `ol-gpt-oss20` - gpt-oss:20b-cloud (через Ollama cloud)
- `ol-deepseek-v3` - deepseek-v3.1:671b-cloud (через Ollama cloud)
- `ol-qwen3-coder` - qwen3-coder:480b-cloud (через Ollama cloud)

### OmniRoute (Kiro) (✅ Работает, но платный)
- `omni-sonnet` - kr/claude-sonnet-4.5
- `omni-haiku` - kr/claude-haiku-4.5

### GitHub Copilot (✅ Работает, требует подписку)
- `copilot-gpt-5.4` - gpt-5.4
- `copilot-gpt-5.4-mini` - gpt-5.4-mini
- `copilot-gpt-5.3-codex` - gpt-5.3-codex
- `copilot-sonnet-4.6` - claude-sonnet-4.6
- `copilot-haiku-4.5` - claude-haiku-4.5
- `copilot-opus-4.6` - claude-opus-4.6
- `copilot-gemini-2.5-pro` - gemini-2.5-pro
- `copilot-grok-code-fast-1` - grok-code-fast-1

---

## 🟡 МОДЕЛИ С ЛИМИТОМ (API ключ есть, но квота ограничена)

### OpenCode Zen (✅ SET, но многие модели 500 error)
**Работающие:**
- `zen-codex-spark` - gpt-5.3-codex-spark
- `zen-gemini-pro` - gemini-3.1-pro
- `zen-gemini-flash` - gemini-3-flash

**Не работают (500 error):**
- ❌ `zen-opus` - claude-opus-4-6
- ❌ `zen-sonnet` - claude-sonnet-4-6
- ❌ `zen-sonnet-4-5` - claude-sonnet-4-5
- ❌ `zen-haiku` - claude-haiku-4-5
- ❌ `zen-gpt5` - gpt-5.4
- ❌ `zen-gpt5-pro` - gpt-5.4-pro
- ❌ `zen-gpt5-mini` - gpt-5.4-mini
- ❌ `zen-gpt5-nano` - gpt-5.4-nano
- ❌ `zen-codex` - gpt-5.3-codex

### Anthropic Direct (✅ SET)
- `ant-sonnet` - claude-sonnet-4-5
- `ant-haiku` - claude-haiku-4-5

---

## 🔴 МОДЕЛИ НЕ ПОДКЛЮЧЕНЫ (Нет API ключа)

### Groq LPU (❌ NOT SET)
**Бесплатный tier, нужен API ключ:**
- `gr-llama70b` - llama-3.3-70b-versatile
- `gr-llama8b` - llama-3.1-8b-instant
- `gr-qwen3` - qwen/qwen3-32b
- `gr-qwen3-32b` - qwen/qwen3-32b
- `gr-kimi-k2` - moonshotai/kimi-k2-instruct
- `gr-llama4` - meta-llama/llama-4-scout-17b-16e-instruct
- `gr-gpt-oss120` - openai/gpt-oss-120b
- `gr-gpt-oss20` - openai/gpt-oss-20b
- `gr-compound` - groq/compound

### Mistral AI (❌ NOT SET)
- `ms-small` - mistral-small-latest
- `ms-medium` - mistral-medium-latest
- `ms-large` - mistral-large-latest
- `ms-codestral` - codestral-latest

### NVIDIA NIM (❌ NOT SET)
**5000 free credits, no card required:**
- `nv-deepseek-r1` - deepseek-ai/deepseek-r1
- `nv-deepseek-v3` - deepseek-ai/deepseek-v3.1
- `nv-llama70b` - meta/llama-3.3-70b-instruct
- `nv-llama405b` - meta/llama-3.1-405b-instruct
- `nv-nemotron` - nvidia/llama-3.1-nemotron-70b-instruct
- `nv-qwen-coder` - qwen/qwen2.5-coder-32b-instruct

### Together AI (❌ NOT SET)
**$5 free credit on signup:**
- `tg-llama70b` - meta-llama/Llama-3.3-70B-Instruct-Turbo
- `tg-llama405b` - meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo
- `tg-qwen-coder` - Qwen/Qwen2.5-Coder-32B-Instruct
- `tg-deepseek-v3` - deepseek-ai/DeepSeek-V3
- `tg-deepseek-r1` - deepseek-ai/DeepSeek-R1
- `tg-mixtral` - mistralai/Mixtral-8x22B-Instruct-v0.1

### Fireworks AI (❌ NOT SET)
**$1 daily credit:**
- `fw-llama70b` - accounts/fireworks/models/llama-v3p3-70b-instruct
- `fw-llama405b` - accounts/fireworks/models/llama-v3p1-405b-instruct
- `fw-deepseek-v3` - accounts/fireworks/models/deepseek-v3
- `fw-deepseek-r1` - accounts/fireworks/models/deepseek-r1
- `fw-qwen-coder` - accounts/fireworks/models/qwen2p5-coder-32b-instruct

### Cloudflare Workers AI (❌ NOT SET)
**10K neurons/day free:**
- `cf-llama70b` - @cf/meta/llama-3.3-70b-instruct-fp8-fast
- `cf-llama8b` - @cf/meta/llama-3.1-8b-instruct
- `cf-deepseek` - @cf/deepseek-ai/deepseek-r1-distill-qwen-32b
- `cf-qwen-coder` - @cf/qwen/qwen2.5-coder-32b-instruct
- `cf-mistral` - @cf/mistralai/mistral-small-3.1-24b-instruct

### Cohere (❌ NOT SET)
**Command R+ trial:**
- `co-command-r-plus` - command-r-plus-08-2024
- `co-command-r` - command-r-08-2024
- `co-command-a` - command-a-03-2025

### Google AI Studio (❌ NOT SET)
- `gem-2.5-pro` - gemini-2.5-pro
- `gem-2.5-flash` - gemini-2.5-flash

### DeepSeek (❌ NOT SET)
- `ds-v3` - deepseek-chat
- `ds-r1` - deepseek-reasoner

### HuggingFace Router (❌ NOT SET)
- `hf-qwen72b` - Qwen/Qwen2.5-72B-Instruct
- `hf-llama8b` - meta-llama/Llama-3.1-8B-Instruct
- `hf-llama70b` - meta-llama/Llama-3.3-70B-Instruct
- `hf-qwen3` - Qwen/Qwen3-8B
- `hf-deepseek` - deepseek-ai/DeepSeek-V3

### Cerebras Fast (❌ NOT SET)
- `cb-llama70b` - llama3.1-8b
- `cb-llama8b` - llama3.1-8b

### SambaNova (❌ NOT SET)
- `sn-llama70b` - Meta-Llama-3.3-70B-Instruct
- `sn-qwen72b` - Qwen2.5-72B-Instruct
- `sn-deepseek` - DeepSeek-R1

### Vercel AI Gateway (❌ NOT SET)
- `vg-sonnet` - anthropic/claude-sonnet-4.5
- `vg-haiku` - anthropic/claude-haiku-4.5
- `vg-opus` - anthropic/claude-opus-4.5
- `vg-gpt4o` - openai/gpt-4o
- `vg-gpt4o-mini` - openai/gpt-4.1-mini
- `vg-gpt41` - openai/gpt-4.1
- `vg-gemini-flash` - google/gemini-2.5-flash
- `vg-gemini-pro` - google/gemini-2.5-pro
- `vg-deepseek-v3` - deepseek/deepseek-v3.1
- `vg-deepseek-r1` - deepseek/deepseek-r1
- `vg-llama70b` - meta/llama-3.3-70b-instruct
- `vg-grok` - xai/grok-4.1-fast-non-reasoning
- `vg-qwen3` - alibaba/qwen3.6-plus

### AI/ML API (❌ NOT SET)
- `aiml-gpt4o` - gpt-4o
- `aiml-claude-sonnet` - claude-3-5-sonnet-20241022
- `aiml-llama405b` - meta-llama/Llama-3.1-405B-Instruct-Turbo
- `aiml-deepseek-v3` - deepseek-chat

### OpenAI Direct (❌ NOT SET)
- `oa-gpt5` - gpt-5.4
- `oa-gpt5-mini` - gpt-5.4-mini
- `oa-gpt4o` - gpt-4o
- `oa-gpt4o-mini` - gpt-4o-mini
- `oa-o3-mini` - o3-mini

### Alibaba Cloud AI (❌ NOT SET)
- `ali-qwen-plus` - qwen-plus
- `ali-qwen-max` - qwen-max
- `ali-qwen-turbo` - qwen-turbo

---

## 📈 Статистика

**Всего моделей в системе:** 107+
**Доступны сейчас (бесплатно):** ~20 (OpenRouter FREE + Ollama Local)
**Доступны с подпиской:** ~10 (Copilot, OmniRoute, Anthropic, Zen)
**Не подключены (нужен API ключ):** ~77

---

## 🎯 Рекомендации

### Приоритет 1: Бесплатные провайдеры (быстрая активация)
1. **Groq** - бесплатный tier, очень быстрый (signup: groq.com)
2. **NVIDIA NIM** - 5000 free credits, no card (build.nvidia.com)
3. **Together AI** - $5 free credit (api.together.xyz)
4. **Fireworks** - $1 daily credit (fireworks.ai)
5. **Cloudflare Workers AI** - 10K neurons/day (cloudflare.com)

### Приоритет 2: Trial провайдеры
6. **Cohere** - Command R+ trial (cohere.com)
7. **Google AI Studio** - Gemini 2.5 (ai.google.dev)
8. **DeepSeek** - V3/R1 trial (deepseek.com)
9. **HuggingFace** - Router API (huggingface.co)

### Приоритет 3: Платные (если нужно)
10. **Mistral AI** - mistral-small/medium/large
11. **OpenAI Direct** - GPT-5.4, O3-mini
12. **Vercel AI Gateway** - unified gateway

---

## 🔧 Как добавить API ключ

```bash
# Через Doppler (рекомендуется)
doppler secrets set GROQ_API_KEY="gsk_..."
doppler secrets set NVIDIA_API_KEY="nvapi-..."
doppler secrets set TOGETHER_API_KEY="..."

# Или через .env
echo "GROQ_API_KEY=gsk_..." >> .env
echo "NVIDIA_API_KEY=nvapi-..." >> .env
```

После добавления ключа:
```bash
pm2 restart free-models-proxy
```

---

**Создано:** 2026-04-07 02:32 UTC
**Runtime:** opencode
**Ветка:** models

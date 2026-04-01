---
description: Cascade model routing — Groq → Mistral → OpenRouter → Ollama fallback
---

# Orchestrator Cascade — Model Routing

## Логика выбора модели

| Запрос | Модель | Provider | Latency |
|--------|--------|----------|---------|
| < 80 символов | qwen2.5-coder:3b | Ollama local | ~11s |
| Код/рефакторинг | llama-3.3-70b | Groq | ~280ms |
| Research/анализ | mistral-small | Mistral AI | ~300ms |
| Complex reasoning | nemotron-3-super | OpenRouter free | ~700ms |
| Offline fallback | qwen2.5-coder:3b | Ollama local | ~11s |

## Fallback-протокол

1. **Groq** (llama-3.3-70b-versatile) — 30 RPM limit
2. Если 429 → **Mistral** (mistral-small-latest) — 1M tokens/month free
3. Если 429 → **OpenRouter** (nemotron-3-super:free) — shared capacity
4. Если все fail → **Ollama** (qwen2.5-coder:3b) — local, no limits

## CostGuard

- **Бесплатные модели только** — без команды `/premium`
- Groq: 30 RPM, 14,400 RPD, 7,000 TPM
- Mistral: 5 RPS, 1M tokens/month
- OpenRouter: shared capacity, может быть slow
- Ollama: ∞ RPM, но ~2GB RAM при загрузке

## Endpoints

- **Free Models Proxy**: `POST http://localhost:20129/v1/chat/completions`
  - Model IDs: `groq/llama-3.3-70b`, `mistral/small`, `openrouter/nemotron`, `ollama/qwen2.5-coder`
- **ZeroClaw Daemon**: `http://localhost:4111/health` (agent loop, не API)

## Smoke Test

```bash
curl -s -X POST http://localhost:20129/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"groq/llama-3.3-70b","messages":[{"role":"user","content":"2+2=?"}]}'
```

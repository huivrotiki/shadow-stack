---
name: omnirouter
description: Configure and manage OmniRouter LLM cascade proxy
trigger: keywords [omnirouter, omni-route, proxy, model switch, rate limit, cascade]
---

## Skill: OmniRouter Management

### Quick Commands
```bash
# Health check
curl localhost:20129/health | python3 -m json.tool

# Test cascade
curl -s -X POST localhost:20129/v1/chat/completions \
  -H "Authorization: Bearer shadow-free-proxy-local-dev-key" \
  -H "Content-Type: application/json" \
  -d '{"model":"auto","messages":[{"role":"user","content":"ping"}]}'

# PM2 status
pm2 list | grep free-models-proxy

# Graceful reload (with Doppler secrets)
doppler run --project serpent --config dev -- \
  pm2 reload free-models-proxy --update-env

# View rate limit errors
pm2 logs free-models-proxy --lines 50 | grep "429\|quota\|limit"
```

### Cascade Order (16 providers, 2026-04-05)
| Tier | Alias | Provider | Speed |
|------|-------|----------|-------|
| 1 | omni-sonnet | KiroAI | ~2s |
| 2a | gr-llama70b | Groq | ~282ms ⭐ |
| 2b | gr-qwen3-32b | Groq | ~1.2s |
| 2c | cb-llama70b | Cerebras | ~0.5s |
| 2d | gem-2.5-flash | Gemini | ~2s |
| 2e | ms-small | Mistral | ~302ms ⭐ |
| 2f | or-nemotron | OpenRouter | ~696ms |
| 2g | sn-llama70b | SambaNova | ~830ms |
| 2h | or-step-flash | OpenRouter | ~1.8s |
| 3a | hf-llama8b | HuggingFace | ~450ms |
| 3b | nv-llama70b | NVIDIA NIM | ~1s |
| 3c | fw-llama70b | Fireworks | ~770ms |
| 3d | co-command-r | Cohere | ~540ms ⭐ |
| 3e | hf-qwen72b | HuggingFace | ~3s |
| 3f | hf-llama70b | HuggingFace | ~3s |
| 4 | ol-qwen2.5-coder | Ollama | ~11s |

### Circuit Breaker
- 3 consecutive 429s → skip model 10 min
- DeepSeek: disabled (insufficient balance)
- Together: disabled (credit limit)

---
service: omniroute
port: 20128
status: up
---

# omniroute

**Port:** `:20128` · **Owner:** agent-factory · **Entry:** `agent-factory/server/omniroute`

## Purpose
Unified cloud LLM cascade. Exposes OpenAI-compatible `/v1/models` and `/v1/chat/completions` over 30 models: Kiro Sonnet (OAuth), Groq (7), OpenRouter (auto), Mistral (4), HuggingFace (5). Backed by `free-models-proxy` for model resolution.

## Start

```bash
cd agent-factory && node server/omniroute
```

## Health check

```bash
curl http://127.0.0.1:20128/v1/models | jq '.data | length'
```

## Environment

| Var | Source | Required |
|---|---|---|
| `KIRO_TOKEN` | Doppler | yes |
| `GROQ_API_KEY` | Doppler | yes |
| `OPENROUTER_API_KEY` | Doppler | yes |
| `MISTRAL_API_KEY` | Doppler | yes |

## Dependencies
- free-models-proxy (:20129) — backend resolver

## Known issues
- After restart, provider cache is lost — wait for ModelSync.
- Node 22 required (nvm use 22).

## Fallback
Direct call to `free-models-proxy :20129` bypasses OmniRoute's routing layer.

---
service: free-models-proxy
port: 20129
status: up
---

# free-models-proxy

**Port:** `:20129` · **Owner:** shadow-stack · **Entry:** `server/free-models-proxy.cjs`

## Purpose
OpenAI-compatible proxy fronting 18 free/cheap models with cascade fallback: Groq → Mistral → OpenRouter → Zen → Ollama. Acts as the backend resolver for OmniRoute and as an independent cascade endpoint for anything else.

## Start

```bash
node server/free-models-proxy.cjs
```

## Health check

```bash
curl http://127.0.0.1:20129/v1/models | jq '.data | length'
```

## Environment

| Var | Source | Required |
|---|---|---|
| `GROQ_API_KEY` | Doppler | yes |
| `MISTRAL_API_KEY` | Doppler | yes |
| `OPENROUTER_API_KEY` | Doppler | yes |
| `ZEN_API_KEY` | Doppler | optional (rate-limited anyway) |

## Dependencies
- ollama (:11434) — final fallback

## Known issues
- HuggingFace provider removed at v1 (requires API key not in Doppler yet).
- Zen rate-limited frequently.
- Mistral key in Doppler is expired, works only intermittently.

## Fallback
Direct provider calls (Groq SDK, etc.) bypass this layer.

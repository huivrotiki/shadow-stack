---
service: ollama
port: 11434
status: up
---

# ollama

**Port:** `:11434` · **Owner:** system · **Entry:** system install

## Purpose
Local LLM runtime. On M1 8GB, runs small models only: `qwen2.5-coder:3b`, `llama3.2:3b`, `phi3:mini`. Accessed by ZeroClaw as local-first shortcut and by `free-models-proxy` as fallback.

## Start

```bash
ollama serve
```

## Health check

```bash
curl http://127.0.0.1:11434/
curl http://127.0.0.1:11434/api/ps
```

## Environment
None required.

## Dependencies
- none

## Known issues
- `qwen2.5:7b` takes 7.6GB RAM — only load when `free_mb > 6000`.
- Cloud models (`:671b-cloud`, `:480b-cloud`) require cloud endpoint, not local.
- Models persist in RAM unless `keep_alive: 0` is passed.

## Fallback
Cloud providers via OmniRoute `:20128` (Kiro/Groq/OpenRouter/Mistral).

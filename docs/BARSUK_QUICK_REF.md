# Barsuk Quick Reference

## Model Info
- **Name:** `barsuk` (Barsuk Super Model)
- **Type:** Alias for `auto` (identical logic)
- **Models:** 140 total (139 + barsuk itself)
- **Default:** ✅ Set everywhere (`shadow/barsuk`)

## Quick Test
```bash
curl -X POST http://localhost:20129/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"barsuk","messages":[{"role":"user","content":"Hello!"}],"stream":false}'
```

## Files Modified (commit `47676199`)
1. `server/free-models-proxy.cjs` — added `barsuk` to MODEL_MAP + routing logic
2. `opencode.json` — set `barsuk` as default (7 references)
3. `autoresearch/loop.js` — uses `barsuk` (line 39)
4. `autoresearch/evaluate.js` — uses `barsuk` (line 7)

## Cascade Chain (24 models)
```
Tier 0: gm-flash, gm-flash-lite, kc-step-flash, kc-gpt5-nano, kc-gpt4o-mini, ...
Tier 1: omni-sonnet, kc-claude-haiku
Tier 2: gr-llama8b (261ms), gr-llama70b, gr-qwen3-32b, cb-llama70b
Tier 3: gem-2.5-flash, ms-small, or-nemotron, or-step-flash
Tier 4: hf-llama8b, nv-llama70b, fw-llama70b, co-command-r
Tier 5: ol-qwen2.5-coder (local Ollama)
```

## Provider Scoring
- Score based on: `latency + success_rate + usage_ratio`
- Stored in: `data/provider-scores.json`
- Memory: `data/gateway-memory.json`

## Troubleshooting
- **"All providers failed"** → check `/tmp/proxy.log`
- **Always routes to Ollama** → normal (local = fastest)
- **Missing API keys** → add to `.env` (ZEN_API_KEY, TOGETHER_API_KEY, etc.)

## Full Documentation
📖 `docs/BARSUK_MODEL.md` — complete guide  
📖 `docs/ARCHITECTURE.md` — system architecture

---
**✅ Quick ref updated: 2026-04-24 01:45**

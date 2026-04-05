# Handoff [2026-04-05s5] — Kiro · 18:15 UTC+2

## Branch
`feat/portable-state-layer`

## Last Commits
```
b604f817 fix(proxy): hf model IDs, add hf-llama70b/qwen3/deepseek, copilot PAT note, cascade update
97a924c6 feat(proxy): add omniroute provider + cascade chain update + gr-qwen3 alias
b59ecfb6 feat(omni): Phase 5 Omni Router — 3-tier cascade + security fix
```

## Runtime State
| Service | Port | PM2 | Status |
|---|---|---|---|
| free-models-proxy | :20129 | ✅ | online — 69 models |
| omniroute-kiro | :20130 | ✅ | online |
| zeroclaw | :4111 | ✅ | online |
| agent-api | :3001 | ✅ | online (agent-factory/server) |
| agent-bot | :4000 | ✅ | online |
| **shadow-api** | :3001 | ❌ | **NOT in pm2** (server/index.js) |

RAM: 1618 MB free → tier SAFE

## Session s5 — What Was Done

### RALPH x3 — Provider/Model Audit
Tested all 17 cascade models, fixed broken ones:

| Model | Result | Fix Applied |
|---|---|---|
| omni-sonnet/haiku | ✅ | — |
| gr-llama70b/8b/qwen3 | ✅ | — |
| gem-2.5-flash | ✅ | — |
| hf-qwen72b | ✅ | — |
| or-qwen3.6 | ✅ | — |
| ol-qwen2.5-coder | ✅ | — |
| hf-llama8b | ✅ fixed | Removed `Meta-` prefix from model ID |
| hf-llama70b | ✅ added | New alias added |
| hf-qwen3, hf-deepseek | ✅ added | New aliases added |
| copilot-sonnet-4.6 | ❌ skip | PAT not supported — needs OAuth token |
| cb-llama70b | ❌ | Needs `CEREBRAS_API_KEY` |
| sn-llama70b | ❌ | Needs `SAMBANOVA_API_KEY` |
| ds-v3 | ❌ | Needs DeepSeek balance |
| gem-2.5-pro | ❌ | Free tier quota exhausted |

`auto` route → openrouter/qwen3.6 ✅

### CASCADE_CHAIN (current)
```js
const CASCADE_CHAIN = [
  // 'copilot-sonnet-4.6', // ❌ PAT not supported
  'omni-sonnet',        // Tier 1 — Claude Sonnet 4.5 via KiroAI :20130
  'gr-llama70b',        // Tier 2a — Groq
  'cb-llama70b',        // Tier 2b — Cerebras (needs key)
  'ds-v3',              // Tier 2c — DeepSeek (needs balance)
  'gem-2.5-flash',      // Tier 2d — Gemini
  'or-qwen3.6',         // Tier 2e — OpenRouter
  'sn-llama70b',        // Tier 3a — SambaNova (needs key)
  'hf-qwen72b',         // Tier 3b — HuggingFace
  'hf-llama70b',        // Tier 3c — HuggingFace
  'ol-qwen2.5-coder',   // Tier 4 — local
];
```

## Blockers
1. **shadow-api not in pm2** — `server/index.js` not running → `/ram` endpoint unavailable
2. **ChromaDB v1→v2** — `scripts/memory-mcp.js` needs API migration
3. **CEREBRAS_API_KEY** missing — `cloud.cerebras.ai`
4. **SAMBANOVA_API_KEY** missing — `cloud.sambanova.ai`
5. **DeepSeek balance** — `platform.deepseek.com`

## Next Session — Start Commands
```bash
curl http://localhost:20130/health --max-time 5
vm_stat | awk '/Pages free/{f=$3} /Pages inactive/{i=$3} /page size/{s=$8} END{printf "free_mb: %d\n", (f+i)*s/1048576}'
git log --oneline -3
pm2 ls
```

## Next Tasks
1. **Phase R0.2** — ZeroClaw Control Center (see `docs/superpowers/plans/2026-04-04-portable-state-layer.md`)
2. Fix shadow-api pm2 registration
3. ChromaDB v1→v2 migration in `scripts/memory-mcp.js`

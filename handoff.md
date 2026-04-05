# Handoff — 2026-04-05 (session 3 / Kiro)

## Status: ✅ OPERATIONAL

## Active Services
| Service | Port | PM2 ID | Status |
|---|---|---|---|
| free-models-proxy | 20129 | 16 | online (doppler run) |
| omniroute-kiro | 20130 | 12 | online |
| agent-api | - | 1 | online |
| agent-bot | - | 2 | online |
| zeroclaw | - | 3 | online |

## API Keys Status
| Key | Status | Notes |
|---|---|---|
| OPENROUTER_API_KEY | ✅ | |
| GROQ_API_KEY | ✅ | via doppler run |
| MISTRAL_API_KEY | ✅ | via doppler run |
| GEMINI_API_KEY | ✅ | via doppler run |
| HF_API_KEY | ✅ | via doppler run |
| OMNIROUTE_KEY | ✅ | KiroAI kr/claude-sonnet-4.5 |
| DEEPSEEK_API_KEY | ❌ | 402 Insufficient Balance |
| ANTHROPIC_API_KEY | ❌ | 400 No credits |
| AI_GATEWAY_API_KEY (Vercel) | ❌ | needs Personal Access Token (not vcp_/vck_) — create at vercel.com/account/settings/tokens |
| OPENAI_API_KEY | ❌ | quota exceeded |
| ALIBABA_API_KEY | ⚠️ | intl endpoint auth fails |

## CASCADE_CHAIN (current)
```
omni-sonnet → gr-llama70b → gr-llama8b → ms-small → gem-2.5-flash
→ or-gpt-oss120 → or-llama70b → ol-gpt-oss20 → ol-qwen2.5-coder
```

## What Changed This Session
1. `server/free-models-proxy.cjs` — omniroute models updated to `kr/claude-sonnet-4.5` / `kr/claude-haiku-4.5`, dropped `omni-gpt4o`, added `stream: false` + `providerOrder` pinning
2. `knowledge/VERCEL_AI_GATEWAY.md` — created: full Vercel AI Gateway + AI SDK reference doc
3. Vercel AI Gateway OIDC issue diagnosed: `vcp_` and `vck_` tokens don't work directly — need Personal Access Token
4. Commits: `99d4d03f` (API keys status), `24d4a6c2` (proxy + gateway docs)

## Vercel AI Gateway — Fix Required
- Current token type `vcp_` (project token) → OIDC only, won't work for direct API calls
- **Fix:** Go to https://vercel.com/account/settings/tokens → create "Full Account" Personal Access Token
- Save as: `doppler secrets set AI_GATEWAY_API_KEY=<token> --project serpent --config dev`
- Models available via gateway: `vg-sonnet` (anthropic/claude-sonnet-4.5), `vg-gpt4o`, `vg-haiku`, `vg-opus`, `vg-gpt4o-mini`

## OmniRoute (KiroAI) — Working
- Running at `:20130` via PM2
- Models: `kr/claude-sonnet-4.5` (omni-sonnet), `kr/claude-haiku-4.5` (omni-haiku)
- Auth: AWS Builder ID via Google account
- Key in Doppler: `OMNIROUTE_KEY`

## Phase 5 Omni Router (server/) — Already Implemented
All files exist in `server/`:
- `lib/semantic-cache.ts` — MD5 hash cache, 1h TTL
- `lib/circuit-breaker.ts` — 3 failures → 5min cooldown
- `lib/key-pool.ts` — round-robin Gemini keys
- `router/classifier.ts` — fact/code/reasoning/creative
- `router/providers.ts` — Tier-1 chain + Telegram Shadow Layer
- `router/auto-router.ts` — `omniRoute()` function
- `omni-endpoint.ts` — Express :20128, OpenAI-compatible

## Next Tasks (priority order)
1. **Vercel AI Gateway key** — create Personal Access Token → doppler set → test `vg-sonnet`
2. **git push** — `gh auth login` → `git push origin feat/portable-state-layer` → merge PR#6
3. **npm run omni** — install `ts-node nodemon` devDeps → start `:20128`
4. **GEMINI_API_KEY_2/3** — add 2nd/3rd Google accounts for 4500 req/day free
5. **Auto research settings** — configure omnirouter prompt template
6. **ChromaDB v1→v2** — fix `scripts/memory-mcp.js`
7. **DeepSeek/Anthropic** — top up credits when needed

## First Command for New Session
```bash
lsof -i :20129 -i :20130 | grep LISTEN && pm2 ls && git -C ~/shadow-stack_local_1 log --oneline -3
```

## Restart Command (IMPORTANT — must use doppler)
```bash
cd ~/shadow-stack_local_1
pm2 delete free-models-proxy
doppler run --project serpent --config dev -- pm2 start server/free-models-proxy.cjs --name free-models-proxy
```

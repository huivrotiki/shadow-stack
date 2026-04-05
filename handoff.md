# Handoff [2026-04-05k2] — Kiro · 17:06 UTC+2

**Branch:** feat/portable-state-layer  
**Commit:** c808bbf  
**Runtime:** Kiro CLI  
**PR:** https://github.com/huivrotiki/shadow-stack/pull/6 (OPEN — push blocked, see below)

---

## What was done this session

### Phase 5: Omni Router — full implementation

| File | Status |
|---|---|
| `server/lib/semantic-cache.ts` | ✅ created — MD5 hash cache, 1h TTL, zero-token repeats |
| `server/lib/circuit-breaker.ts` | ✅ created — 3 failures → 5min cooldown per provider |
| `server/lib/key-pool.ts` | ✅ created — round-robin across GEMINI_API_KEY / _2 / _3 |
| `server/router/classifier.ts` | ✅ created — fact/code/reasoning/creative task classifier |
| `server/router/providers.ts` | ✅ created — Tier-1 chain + Telegram Shadow Layer |
| `server/router/auto-router.ts` | ✅ extended — `omniRoute()` appended, `route()` untouched |
| `server/omni-endpoint.ts` | ✅ created — Express :20128, OpenAI-compatible `/v1/chat/completions` |
| `package.json` | ✅ `omni` + `omni:dev` scripts added |
| `bot/opencode-telegram-bridge.cjs` | ✅ `/omni`, `/gemini`, `/groq`, `/deep` commands appended |
| `.env.example` | ✅ `GEMINI_API_KEY_2` + `_3` added |

**Deps installed:** `@ai-sdk/google`, `@openrouter/ai-sdk-provider`  
**Note:** `@ns/ai-fallback` doesn't exist on npm — replaced with manual try/catch chain in `callOmniChain()` (same behavior).

---

## Current state

| Item | Value |
|---|---|
| Phase | R1 / Omni Router Phase 5 complete |
| Branch | feat/portable-state-layer (140 commits ahead of main) |
| PR#6 | OPEN — push blocked (GitHub token invalid) |
| OmniRoute | :20128 — ready to start with `npm run omni` |

---

## Blockers

- [ ] **GitHub token invalid** — `GITHUB_TOKEN` in env is expired. Fix: `gh auth login` or update token in Doppler
- [ ] **ChromaDB v1 → v2** migration in `scripts/memory-mcp.js` (carried from previous session)
- [ ] `GEMINI_API_KEY_2` and `GEMINI_API_KEY_3` not yet set in `.env` — add when 2nd/3rd Google accounts ready
- [ ] `ts-node` / `nodemon` not in devDeps — `npm run omni` needs them or use `npx ts-node`

---

## Next actions

1. Fix GitHub auth: `gh auth login` → re-push: `git push origin feat/portable-state-layer`
2. Start OmniRoute: `npm run omni` (or `npx ts-node server/omni-endpoint.ts`)
3. Point Kiro/Cursor to `baseURL: http://localhost:20128/v1`, `model: omni-router`, `apiKey: any`
4. Add keys to `.env`: `GEMINI_API_KEY_2=`, `GEMINI_API_KEY_3=`
5. Fix ChromaDB v2 in `scripts/memory-mcp.js`
6. Merge PR#6: `gh pr merge 6 --squash`

---

## Services (last known good)

| Service | Port | Status |
|---|---|---|
| Express API | :3001 | ✅ |
| Telegram Bot | :4000 | ✅ |
| Health Dashboard | :5176 | ✅ |
| OmniRoute | :20128 | ready (not started) |
| ZeroClaw | :4111 | standby |
| Ollama | :11434 | on-demand |

---

## Omni Router flow (RAM < 300MB = forceShadow)

```
prompt → getCached() → [MISS]
→ checkRAM() → forceShadow?
  YES → Telegram Shadow Layer (@chatgpt_gidbot → @deepseek_gidbot)
  NO  → callOmniChain() [Gemini → Llama-70B → StepFun-256K]
         ↓ all fail
      → Telegram Shadow Layer
         ↓ all fail
      → fallbackCascade() [legacy Ollama → OpenClaw → OpenRouter]
→ setCached() → return
```

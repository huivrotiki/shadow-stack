# Shadow Stack v3.2 — Todo Tracker

## Phase 1: Auto-Router + Telegram ✅ COMPLETE
- [x] server/auto-router/providers.ts — 7 LLM providers
- [x] server/auto-router/fallback.ts — Retry + cascade logic
- [x] server/auto-router/auto-router.ts — State machine + Zod schemas
- [x] server/auto-router/index.ts — Barrel export
- [x] app/api/telegram-webhook/route.ts — Full rewrite with auto-router
- [x] lib/ai-models.ts — Ollama + OpenRouter models added
- [x] server/index.js — /api/auto-router endpoint
- [x] .env.example — Provider env vars
- [x] SKILL.md — Routing rules, fallback chain, Telegram commands
- [x] todo.md — Phase tracking
- [x] shadow-stack-dashboard.html — Interactive 8-tab dashboard

## Phase 2: Antigravity + OpenCode Fallback (Current)
- [x] Commit Phase 1 (a81ac51)
- [x] providers.ts: + Antigravity Gemini provider (OpenCode proxy localhost:3001)
- [x] providers.ts: + usage tracking (in-memory, hourly reset, per-provider limits)
- [x] fallback.ts: extended cascade Ollama → Antigravity → OpenRouter → Kimi → Claude
- [x] fallback.ts: quota-aware routing (90% threshold auto-switch)
- [x] auto-router.ts: + antigravity-gemini route + quota-aware classification
- [x] server/index.js: + GET /api/auto-router/usage endpoint
- [x] .env.example: + ANTIGRAVITY_OAUTH_TOKEN, OPENCODE_ENDPOINT
- [x] Telegram: + /test-router, /usage commands
- [x] SKILL.md: updated routing rules + Antigravity + usage monitoring
- [ ] Dashboard: quota sliders + Antigravity provider card
- [ ] Commit Phase 2 + Vercel deploy

## Phase 3: OpenCode Plugins
- [ ] oh-my-opencode plugin integration
- [ ] vibeguard plugin
- [ ] pty plugin for terminal

## Phase 4: Observability + Security
- [ ] SSE log streaming endpoint
- [ ] Retry dashboard metrics
- [ ] Supabase logging integration
- [ ] Security scan (secrets, deps)

## Phase 5: Documentation + Deploy
- [ ] RUNBOOK.md — operational guide
- [ ] AGENTS.md — update agent definitions
- [ ] Final production deploy
- [ ] Telegram bot verification

---

**Go-live target:** 2026-04-05
**Last updated:** 2026-03-22

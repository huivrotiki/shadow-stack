# Shadow Stack v3.2 — Todo Tracker

## Phase 1: Auto-Router + Telegram (Current)
- [x] server/auto-router/providers.ts — HTTP calls to all LLM providers
- [x] server/auto-router/fallback.ts — Retry + cascade logic
- [x] server/auto-router/auto-router.ts — State machine + Zod schemas
- [x] server/auto-router/index.ts — Barrel export
- [x] app/api/telegram-webhook/route.ts — Full rewrite with auto-router
- [x] lib/ai-models.ts — Ollama + OpenRouter models added
- [x] server/index.js — /api/auto-router endpoint
- [x] .env.example — New provider env vars
- [x] SKILL.md — Routing rules, fallback chain, Telegram commands
- [x] todo.md — This file
- [ ] HTML Dashboard — Interactive auto-router dashboard
- [ ] Vercel preview deploy
- [ ] ngrok + Telegram webhook setup

## Phase 2: CI/CD + GitOps
- [ ] GitHub Actions — auto-deploy on push
- [ ] Doppler secrets sync
- [ ] shadow-start.sh — unified startup script
- [ ] Automator workflow — macOS one-click launch

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

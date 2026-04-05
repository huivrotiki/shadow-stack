# Todos — shadow-stack-local

## Phase R0.0 — Portable State Layer ✅ COMPLETE (2026-04-04)
- [x] Task 1 — pre-flight
- [x] Task 2 — monorepo merge
- [x] Task 3 — post-merge verify
- [x] Task 4 — move plan-v2
- [x] Task 5 — .state/ skeleton
- [x] Task 6 — bootstrap script
- [x] Task 7-9 — validator script (TDD)
- [x] Task 10-11 — install-hooks.sh + pre-commit
- [x] Task 12 — SERVICES.md registry
- [x] Task 13 — per-service pages
- [x] Task 14 — runtime adapter docs
- [x] Task 15-17 — CLAUDE.md / AGENTS.md / opencode.json updates
- [x] Task 18-19 — bot extensions (TDD, 11/11 pass)
- [x] Task 20 — end-to-end verification (spec §18 criteria 1-11)
- [x] Task 21 — handoff + final commit (8a7fb3d8)

## Phase R0.1 — Knowledge Sources auto-load ✅ COMPLETE (2026-04-04d)
- [x] SessionStart hook (scripts/session-context-loader.sh)
- [x] Supermemory MCP wiring (CLAUDE.md, AGENTS.md, opencode.json)
- [x] NotebookLM active notebook pinned (489988c4-…)
- [x] Telegram /zc /nb /runtime /handoff commands
- [x] pm2 + launchd autostart (bot + shadow-api)

## Phase R0.2 — ZeroClaw Control Center (next, from plan-v2)

## Phase R0.3 — Ralph Loop: Shadow Ultimate Cascade Fix ✅ COMPLETE (2026-04-05)
- [x] Task 1: FREE_PROXY_API_KEY added to Doppler (serpent/dev)
- [x] Task 2: opencode.json apiKey format fixed (${...} → {env:...}) in both global + local
- [x] Task 3: All services verified (free-proxy :20129, shadow-api :3001, ollama :11434, zeroclaw :4111)
- [x] Task 4: Cascade tests passed (or-qwen3.6 → 6.8s, 31 models, 11-step chain)
- [x] Task 5: Committed + pushed

## Blockers
- [ ] ChromaDB v1 → v2 API migration (memory-mcp.js)

## Backlog
- [ ] HuggingFace API key in Doppler
- [ ] Ralph Loop (Phase R5)
- [ ] Notebook LLM (Phase R3)

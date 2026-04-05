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

## Phase R0.2 — ZeroClaw Control Center ✅ COMPLETE (2026-04-05)

## Phase R0.4 — Cloud-Only Auto-Routing + Context Fix ✅ COMPLETE (2026-04-05)
- [x] Task 1: Removed dead models (Zen, Groq, Gemini, HF, Mistral — no API keys)
- [x] Task 2: Added auto model with 5 categories (code, fast, research, creative, translate)
- [x] Task 3: Message truncation (keep system + last 5 messages) to prevent context overflow
- [x] Task 4: Adaptive timeout (60s Ollama, 30s cloud)
- [x] Task 5: 17 working models tested and committed
- [x] Task 6: Compaction strategy added to opencode.json

## Blockers
- [ ] ChromaDB v1 → v2 API migration (memory-mcp.js)

## Backlog
- [ ] HuggingFace API key in Doppler
- [ ] Ralph Loop (Phase R5)
- [ ] Notebook LLM (Phase R3)

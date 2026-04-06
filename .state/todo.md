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
- [x] ChromaDB v1 → v2 API migration (memory-mcp.js) ✅ COMPLETE

## Backlog
- [ ] HuggingFace API key in Doppler
- [x] Ralph Loop (Phase R5) ✅ COMPLETE
- [x] Notebook LLM (Phase R3) ✅ COMPLETE

## Phase R1 — Rules Consolidation ✅ COMPLETE (2026-04-05)
- [x] Remove OpenClaw :18789 refs from ORCHESTRATOR.md, CLAUDE-HEALTH-DASHBOARD.md, README.md, SETUP-COMPLETE.md, AGENTS.md, SOUL.md, DEPLOY.md, RECOMMENDATIONS.md
- [x] Create docs/workflow-rules.md (8 rules, single source of truth)
- [x] Fix port references: 18789→20130, 5176→5175

## Phase R2 — OmniRouter единый каскад ✅ COMPLETE (2026-04-05)
- [x] openclaw.config.json → router.config.json (OmniRoute :20130 primary)
- [x] zeroclaw config.toml: добавлен [provider.omni]
- [x] Удалены мёртвые TS файлы: server/router/*.ts

## Phase R3 — Notebook LLM ✅ COMPLETE (2026-04-05)
- [x] notebooks/ structure (shadow-stack/, agent-factory/, _template.md, INDEX.md)
- [x] agent-factory/factory/memory.cjs (save/query/syncToSupermemory)
- [x] First session entry: 2026-04-05-phase-r1-r3.md

## Phase R4 — Supermemory Namespaces ✅ COMPLETE (2026-04-05)
- [x] .agent/supermemory.config.json (shadow-stack + agent-factory)
- [x] memory.cjs: namespace routing by tags
- [x] docs/workflow-rules.md: namespace rules added

## Phase R5 — Master Prompt V2.0 ✅ COMPLETE (2026-04-05)
- [x] MASTER PROMPT V2.0 prepended to CLAUDE.md (shadow-stack + agent-factory)
- [x] 5 hard rules: cascade/secrets/notebook/ram/handoff

## Phase R6 — Telegram Remote Command Center ✅ COMPLETE (2026-04-05)
- [x] /visual_debug: screenshot + OmniRoute vision analysis
- [x] SERVICES updated: correct ports (20130, 20129, 4111, 20131)
- [x] /task /code /agents aliases

## Phase R7 — Computer Use endpoints ✅ COMPLETE (2026-04-05)
- [x] server/computer/screenshot.cjs → GET /computer/screenshot
- [x] server/computer/action.cjs → POST /computer/action (click/type/key)
- [x] Mounted in shadow-api :3001

## Phase R8 — Verification & Commits ✅ COMPLETE (2026-04-05)
- [x] OmniRoute: 4 models
- [x] memory.cjs: save+query working
- [x] No OpenClaw refs in CLAUDE.md
- [x] HF provider: working (llama8b)
- [x] ChromaDB blocker: resolved

## Phase R9 — Stabilization (2026-04-06)
- [x] Supermemory URL migration (api → mcp.supermemory.ai, OAuth)
- [x] CLAUDE.md update (branch, focus, ports, executor mode)
- [x] Telegram 409 fix (deleteWebhook + proper startup sequence)
- [x] sub-kiro added to ecosystem.config.cjs

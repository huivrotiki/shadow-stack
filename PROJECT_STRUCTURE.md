# Shadow Stack - Project Structure

**Branch:** models
**Date:** 2026-04-07
**Runtime:** opencode

## Overview

Multi-LLM routing + autonomous dev orchestration on Mac mini M1 (8GB RAM)

## Core Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Clients (Claude Code, OpenCode, ZeroClaw, Telegram)   │
└─────────────────┬───────────────────────────────────────┘
                  │
         ┌────────┴────────┐
         ↓                 ↓
    Channel-A          Channel-B
    (US-West)          (EU-West)
    :20133             :20134
         ↓                 ↓
    ┌─────────────────────────────┐
    │   Supermemory (:20135)      │
    │   Context Pool & Memory     │
    └─────────────┬───────────────┘
                  │
    ┌─────────────┴─────────────┐
    ↓                           ↓
free-models-proxy          OmniRoute
:20129 (107 models)        :20130 (56 models)
    ↓                           ↓
Groq, Mistral, Gemini      Kiro/Claude
OpenRouter, etc.           Anthropic Direct
```

## Directory Structure

### Root Level
```
shadow-stack/
├── .agent/              # Agent configuration & protocols
│   ├── soul.md          # Project identity & values
│   ├── crons.md         # Periodic tasks registry
│   ├── SESSION-START-PROTOCOL.md
│   ├── TASK-FOLDER-PATTERN.md
│   ├── skills/          # Agent skills library
│   └── tasks/           # Task-specific instructions
├── .state/              # Portable state layer
│   ├── current.yaml     # Active plan, session, lock
│   ├── session.md       # Live session log
│   └── todo.md          # Shared todos
├── server/              # Main API & routing
│   ├── index.js         # Express API (:3001)
│   ├── free-models-proxy.cjs  # 107 models (:20129)
│   ├── channel-router.cjs     # Dual channels
│   ├── context-pool.cjs       # Context sharing
│   ├── gateway-mask.cjs       # Unified gateway
│   └── lib/             # Core libraries
├── agent-factory/       # Agent orchestration
│   ├── server/          # ZeroClaw control center
│   ├── factory/         # Agent creation
│   └── bot/             # Telegram bot
├── bot/                 # Telegram bridge
├── docs/                # Documentation
│   ├── SERVICES.md      # Service registry
│   ├── plans/           # Planning docs
│   └── design/          # UI mockups
├── scripts/             # Automation scripts
├── notebooks/           # Knowledge base
└── handoff.md           # Cross-session handoff
```

### Server Components

```
server/
├── index.js                    # Main Express API (:3001)
├── free-models-proxy.cjs       # 107 models (:20129)
├── free-models-proxy-2.cjs     # Backup proxy (:20132)
├── channel-router.cjs          # Dual channel routing
├── context-pool.cjs            # Context borrow/lend/sync
├── gateway-mask.cjs            # Unified gateway (:20133)
├── shadow-proxy-duo.cjs        # Dual provider setup
├── shadow-router.cjs           # Playwright CDP router
├── orchestrator.js             # Task orchestration
├── lib/
│   ├── llm-gateway.cjs         # Self-healing cascade
│   ├── router-engine.cjs       # Intent detection
│   ├── cascade-provider.cjs    # Provider fallback
│   ├── rate-limiter.cjs        # Token bucket
│   ├── speed-profiles.cjs      # slow/medium/fast
│   ├── ram-guard.cjs           # Memory protection
│   ├── config.cjs              # Configuration
│   ├── metrics.cjs             # Telemetry
│   ├── context-gather.cjs      # Context collection
│   └── providers/              # Provider adapters
├── api/                        # API routes
├── computer/                   # Computer use endpoints
│   ├── screenshot.cjs
│   └── action.cjs
└── tools/                      # Tool implementations
```

## Services & Ports

| Port  | Service              | Status | Purpose                    |
|-------|----------------------|--------|----------------------------|
| 3001  | shadow-api           | ✅     | Main Express API           |
| 3002  | shadow-router        | ⏸️     | Playwright CDP (on-demand) |
| 4000  | telegram-bot         | ✅     | Telegram bridge            |
| 4111  | zeroclaw             | ✅     | Agent control center       |
| 5175  | vite-dev             | ⏸️     | Widget dev server          |
| 11434 | ollama               | ✅     | Local LLM runtime          |
| 20129 | free-models-proxy    | ✅     | 107 models (primary)       |
| 20130 | omniroute-kiro       | ✅     | 56 models (Kiro/Claude)    |
| 20131 | sub-kiro             | ⏹️     | Deprecated                 |
| 20132 | free-models-proxy-2  | ✅     | 99 models (backup)         |
| 20133 | gateway-mask         | ✅     | Unified API (165+ models)  |
| 20134 | channel-b            | ✅     | EU-West channel            |
| 20135 | supermemory          | ✅     | Context pool & memory      |

## Model Cascade

**Primary cascade (free-models-proxy :20129):**
```
omni-sonnet → gr-llama70b → gr-qwen3-32b → cb-llama70b → 
gem-2.5-flash → ms-small → or-nemotron → sn-llama70b → 
or-step-flash → hf-llama8b → nv-llama70b → fw-llama70b → 
co-command-r → hf-qwen72b → hf-llama70b → ol-qwen2.5-coder
```

**Speed Profiles:**
- 🦥 slow: 2 RPS, 120s timeout, qwen2.5:7b, 8192 tokens
- ⚖️ medium: 5 RPS, 60s timeout, llama3.2:3b, 4096 tokens (default)
- ⚡ fast: 10 RPS, 30s timeout, llama3.2:3b, 2048 tokens

## Key Files

### Configuration
- `package.json` - npm scripts & dependencies
- `ecosystem.config.cjs` - PM2 process manager
- `.env` - secrets (Doppler-managed)
- `.gitignore` - exclude patterns
- `opencode.json` - OpenCode config (45 models)

### Documentation
- `AGENTS.md` - agent instructions & skills
- `CLAUDE.md` - Claude Code instructions
- `handoff.md` - session handoff
- `docs/SERVICES.md` - service registry
- `docs/workflow-rules.md` - 8 workflow rules

### State Management
- `.state/current.yaml` - active plan, session, lock
- `.state/session.md` - live session log
- `.state/todo.md` - shared todos
- `.agent/soul.md` - project identity

## Current Status (2026-04-07 04:23)

- **Branch:** models (created from main at a8e588d0)
- **Phase:** COMPLETE (PR#6 merged)
- **RAM:** 144MB (⚠️ CRITICAL - below 200MB threshold)
- **Services:** shadow-api ✅, free-models-proxy ✅, OmniRoute ✅
- **Last commit:** a8e588d0 (chore: organize docs and design assets)

## RAM Guard Thresholds

- `free_mb > 400` → full stack allowed
- `free_mb 200-400` → cloud only, no browser/Playwright
- `free_mb < 200` → ABORT, send alert

## Providers (18 total)

1. OpenRouter
2. Groq
3. Mistral
4. Zen
5. NVIDIA NIM
6. Together AI
7. Fireworks
8. Cloudflare
9. Cohere
10. AI/ML API
11. OpenAI
12. Anthropic
13. DeepSeek
14. Gemini
15. Alibaba
16. HuggingFace
17. Cerebras
18. SambaNova
19. Ollama (local)
20. OmniRoute
21. Vercel
22. Copilot

## Next Steps

See `.state/todo.md` for current phase tasks.

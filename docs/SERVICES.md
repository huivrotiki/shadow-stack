---
version: 1
project: shadow-stack-local
canonical_path: docs/SERVICES.md
services:
  shadow-api:
    port: 3001
    bind: 0.0.0.0
    process: node
    entry: server/index.js
    cwd: .
    health: http://127.0.0.1:3001/health
    start: node server/index.js
    role: Express API, RAM guard, metrics, /api/cascade forward
    depends_on: []
    status: up
    owner: shadow-stack
    detail: services/shadow-api.md
  shadow-router:
    port: 3002
    bind: 127.0.0.1
    process: node
    entry: server/shadow-router.cjs
    cwd: .
    health: http://127.0.0.1:3002/health
    start: node server/shadow-router.cjs
    role: Playwright CDP router (on-demand)
    depends_on: []
    status: stopped
    owner: shadow-stack
    detail: services/shadow-router.md
  telegram-bot:
    port: 4000
    bind: 0.0.0.0
    process: node
    entry: bot/opencode-telegram-bridge.cjs
    cwd: .
    health: http://127.0.0.1:4000/health
    start: node bot/opencode-telegram-bridge.cjs
    role: Telegram bridge for all services
    depends_on: [zeroclaw, omniroute]
    status: up
    owner: shadow-stack
    detail: services/telegram-bot.md
  zeroclaw:
    port: 4111
    bind: 127.0.0.1
    process: zeroclaw
    entry: agent-factory/server/zeroclaw/control-center.cjs
    cwd: agent-factory
    health: http://127.0.0.1:4111/health
    start: node server/zeroclaw/control-center.cjs
    role: Telegram Control Center + local Ollama shortcut (R0)
    depends_on: [ollama, omniroute, telegram-bot]
    status: up
    owner: agent-factory
    detail: services/zeroclaw.md

  ollama:
    port: 11434
    bind: 127.0.0.1
    process: ollama
    entry: system
    cwd: ~
    health: http://127.0.0.1:11434/
    start: ollama serve
    role: Local LLM runtime (qwen2.5-coder:3b, llama3.2:3b)
    depends_on: []
    status: up
    owner: system
    detail: services/ollama.md
  omniroute:
    port: 20128
    bind: 0.0.0.0
    process: node
    entry: agent-factory/server/omniroute
    cwd: agent-factory
    health: http://127.0.0.1:20128/v1/models
    start: node server/omniroute
    role: Unified cloud LLM cascade (30 models)
    depends_on: [free-models-proxy]
    status: up
    owner: agent-factory
    detail: services/omniroute.md
  free-models-proxy:
    port: 20129
    bind: 0.0.0.0
    process: node
    entry: server/free-models-proxy.cjs
    cwd: .
    health: http://127.0.0.1:20129/v1/models
    start: node server/free-models-proxy.cjs
    role: Proxy backend — 18 free/cheap models with cascade fallback
    depends_on: [ollama]
    status: up
    owner: shadow-stack
    detail: services/free-models-proxy.md
  chromadb:
    port: 8000
    bind: 127.0.0.1
    process: python
    entry: system/venv
    cwd: .venv
    health: http://127.0.0.1:8000/api/v2/heartbeat
    start: chroma run --path memory/shadow_memory --port 8000
    role: Vector memory store for memory-mcp.js
    depends_on: [ollama]
    status: broken
    known_issue: "memory-mcp.js uses /api/v1/, ChromaDB 1.5.5 requires /api/v2/"
    blocks: [memory-layer, ralph-loop]
    owner: shadow-stack
    detail: services/chromadb.md
---

# Shadow Stack Services Registry

**Canonical source:** `docs/SERVICES.md` (single file in monorepo).
**Consumed by:** humans (this file), ZeroClaw `/agents` and `/status` commands (YAML parse), Telegram bot `/state`.

## Live Map

| # | Service | Port | Owner | Status | Role |
|---|---|---|---|---|---|
| 1 | shadow-api | :3001 | shadow-stack | ✅ up | Express API + RAM guard |
| 2 | shadow-router | :3002 | shadow-stack | ⏸ stopped | Playwright CDP (on-demand) |
| 3 | telegram-bot | :4000 | shadow-stack | ✅ up | @shadowzzero_bot |
| 4 | zeroclaw | :4111 | agent-factory | ✅ up | **R0 Control Center** |
| 5 | ollama | :11434 | system | ✅ up | Local LLM runtime |
| 6 | omniroute | :20128 | agent-factory | ✅ up | Unified cloud cascade (30 models) |
| 7 | free-models-proxy | :20129 | shadow-stack | ✅ up | Proxy backend (18 models) |
| 8 | chromadb | :8000 | shadow-stack | 🔴 broken | v1/v2 API mismatch |

## How to edit

1. Edit YAML frontmatter above for structural changes (port, owner, depends_on, status).
2. Edit or create `docs/services/<name>.md` for per-service details.
3. Commit — pre-commit hook validates YAML frontmatter via `scripts/validate-state.sh`.

## Notes

- `owner` values `shadow-stack` and `agent-factory` refer to subdirectories of the monorepo, not separate repos.
- A service with `status: broken` is present in the stack but has a known blocker documented in `known_issue`.
- `depends_on` is informational only at v1 — no auto-ordered startup yet.

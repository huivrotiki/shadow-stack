# Knowledge Sources — ALWAYS ACTIVE

**Before answering any non-trivial question, consult these knowledge sources:**

1. **Supermemory MCP** — long-term semantic memory, always active via tools:
   - `mcp__mcp-supermemory-ai__recall` — recall prior context by query
   - `mcp__mcp-supermemory-ai__memory` — write new insights
   - `mcp__mcp-supermemory-ai__listProjects` — list memory projects
   - **Rule:** call `recall` first for any question about past decisions, architecture, or user preferences. Write back with `memory` when learning something durable.

2. **NotebookLM** — curated knowledge base, CLI at `~/.venv/notebooklm/bin/notebooklm`:
   - `notebooklm list` — list notebooks (auto-loaded via SessionStart hook)
   - `notebooklm use <id>` — set active notebook
   - `notebooklm ask "<query>"` — ask the active notebook
   - **Rule:** when the question touches Shadow Stack architecture, LLM mesh, NVIDIA/agent-factory, OpenClaw security, or Claude Code best practices, run `notebooklm ask` against the relevant notebook before answering.

3. **Auto-load:** `scripts/session-context-loader.sh` runs at every SessionStart hook and injects the current notebooks list + supermemory reminder into the session context. Fail-open (never blocks).

---

# Portable State Layer — READ FIRST

**Before anything else in this project, read these files in order:**

1. `.state/current.yaml` — active plan, session, lock, git state (YAML).
2. `.state/todo.md` — shared todos across all runtimes (markdown checklist).
3. `.state/session.md` — live append-only log of current session. Append a `## HH:MM · <runtime> · <event>` line at each milestone.
4. `handoff.md` — last cross-session handoff (in project root).
5. `docs/SERVICES.md` — service registry (ports, owners, health URLs, fallback).

**When finishing work in this project:** append a `runtime_close` event to `.state/session.md` and commit `.state/` if `git.auto_commit_state: true` in `current.yaml`.

**If another runtime holds the lock** (see `.state/current.yaml:lock_until`), ask the user before proceeding.

---

# CLAUDE.md — Shadow Stack Local v6.0
# Mac mini M1 / 8GB RAM / Berlin
# Last updated: 2026-03-27

---

## PROJECT OVERVIEW

Project: Shadow Stack Local
Path: ~/shadow-stack_local_1/
Stack: Node.js, React, Vite, Tailwind CSS, Playwright, Ollama
Deploy: GitHub (source only)

Services:
- Express API      :3001 (server/index.js)
- Health Dashboard :5176 (dev, health-dashboard/)
- Telegram Bot     :4000 (bot/opencode-telegram-bridge.cjs)
- Shadow Router    :3002 (server/shadow-router.cjs, Playwright + CDP)
- OpenClaw         :18789 (openclaw.config.json)
- Ollama           :11434

## PROJECT STRUCTURE (v6.0 — ~90 files)

```
├── .agent/skills/          # Agent skill definitions (8 skills)
├── .claude/                # Claude Code config
├── .github/workflows/      # CI: bot-check, ci, deploy-dashboard
├── .openclaw/skills/       # OpenClaw skill definitions
├── bot/                    # Telegram bot (bridge to all services)
├── data/                   # Local JSON logs, fallback storage
├── docs/                   # SQL migrations, integration docs
├── health-dashboard/       # Standalone Vite dashboard (HTML + API)
├── knowledge/              # Design rules for OpenClaw
├── scripts/                # Start scripts, smoke tests, Python toolchain
├── server/
│   ├── api/                # Express route modules (health, logs)
│   ├── lib/                # Core: config, logger, metrics, ram-guard,
│   │                       #   rate-limiter, router-engine, ai-sdk,
│   │                       #   supabase, providers/browser
│   ├── providers/          # Groq, Ollama, Smart-Query adapters
│   ├── index.js            # Main Express app + WebSocket
│   └── shadow-router.cjs   # Playwright CDP router
├── src/
│   ├── components/         # React components (HealthDashboard)
│   ├── widget/             # Extracted from shadow-stack-widget-1:
│   │   ├── ai-models.js    #   Model routing: routeModelByTask()
│   │   ├── agent-cards.jsx #   Agent Control Panel UI
│   │   └── telegram-commands.cjs # Command dispatcher (15+ commands)
│   └── App.jsx, main.jsx  # React entry
├── CLAUDE.md               # This file
├── AGENTS.md               # Agent definitions
├── ecosystem.config.cjs    # PM2 config (shadow-api + shadow-bot)
├── openclaw.config.json    # OpenClaw provider routing
└── package.json            # Dependencies
```

---

## MEMORY & CONTEXT RULES

- ALWAYS read this file at the start of every session
- NEVER re-read files you already have in context
- If context > 80% — summarize and compact before continuing
- Store key decisions in SESSION.md, not in conversation
- Use ~/AI-Workspace/02-Skills/ for skill files (SKILL.md format)

---

## AGENT PERMISSIONS

### ✅ ALLOWED — no confirmation needed

Read:
- All files in ~/shadow-stack_local_1/
- All files in ~/AI-Workspace/

Write:
- src/ (including src/widget/)
- health-dashboard/
- bot/
- server/
- scripts/
- docs/
- *.md files (handoff, session, readme)
- package.json (only add deps, never remove)

Commands:
- npm install
- npm run dev
- npm run build
- npm run preview
- npm test
- git diff
- git status
- git add
- git commit -m "..."
- node server/*.cjs
- curl http://localhost:*/health
- curl http://localhost:*/ram

### ⚠️ ASK IN CHAT BEFORE RUNNING

- git push origin main
- vercel deploy (any)
- rm -rf (any)
- pkill / kill (any process)
- Any write outside ~/shadow-stack_local_1/
- Any modification to .env files
- Any modification to *.pem, *.key, *secret*

### 🔴 NEVER — absolutely forbidden

- Write to ~/.ssh/
- Write to /etc/ or /usr/
- Expose API keys in logs or commits
- Run curl to external URLs without showing command first
- Install global npm packages without asking
- Drop or truncate any database
- Delete git history (rebase -i on pushed commits)

---

## CODE STYLE

### React / Frontend
- Functional components only, no class components
- Tailwind CSS — arbitrary values for exact pixels:
  p-[24px] px-[32px] gap-[4px] rounded-[8px] rounded-[10px]
- NO inline <style> tags (exception: SVG keyframes inside <svg>)
- NO external chart/animation libraries
- Fonts:
  - Headings: 'Cormorant Garamond', serif
  - UI: Inter, system-ui
  - Data/metrics: font-mono (JetBrains Mono or system mono)
- Section title pattern (ALWAYS use this):
  <div className="flex items-center gap-[16px] mb-[24px]">
    <h2 className="font-['Cormorant_Garamond',_serif] text-[24px]
                   font-bold whitespace-nowrap text-white">{title}</h2>
    <div className="flex-1 border-t border-gray-800"/>
  </div>

### Node.js / Backend
- Use .cjs extension for CommonJS files
- No TypeScript in server/ (plain JS only)
- Always add error handling to Express routes
- Health endpoints must return { status, uptime, service }

### Git
- Commit format: type: short description
  Types: feat / fix / refactor / docs / chore
- Never commit .env or secrets
- Never commit node_modules
- Always commit working code — no WIP commits to main

---

## HEALTH DASHBOARD v5.0 SPEC

File: health-dashboard/index.html or src/App.jsx
Deploy: local dev only (:5176)

### HARD CONSTRAINTS (non-negotiable)
- EXACTLY 9 tabs in this order:
  0: Overview
  1: AI Radar
  2: State Machine
  3: Router
  4: RAM & Risk
  5: Phases
  6: Integrations
  7: Logs
  8: Settings

- Header: py-[24px] px-[32px], gradient logo, [ONLINE] pulse dot, v5.0 badge
- AI Radar: SVG only, 4 rings, crosshair, sweep animation, 8 pulsing dots
- RAM bars: SegBar component, 16 segments, color-coded green→red
- Flow nodes: rounded-[10px], hover:scale-[1.05], transition-transform
- NO placeholder tabs — every tab renders real content

### Colors
--bg-primary:  #0A0A0A
--bg-surface:  #0D1117
--bg-elevated: #161B22
--blue:        #58a6ff / #60a5fa
--green:       #3fb950 / #34d399
--purple:      #bc8cff / #a78bfa
--cyan:        #39d2c0 / #22d3ee
--red:         #f87171
--yellow:      #fbbf24

---

## SHADOW ROUTING

File: server/shadow-router.cjs
Port: :3002
RAM threshold: 400MB free (check /ram before launch)

### How it works
1. Chrome must be running with --remote-debugging-port=9222
2. Router connects via Playwright connectOverCDP()
3. RAM check → if freeRAM < 400MB → return { error: "LOW_RAM" }
4. Page closes after each request (page.close()) to save RAM
5. Targets: claude, chatgpt, gemini, grok

### Start sequence
# 1. Chrome with CDP
open -a "Google Chrome" --args --remote-debugging-port=9222

# 2. Shadow Router
node server/shadow-router.cjs &

# 3. Telegram Bot
PORT=4000 node bot/opencode-telegram-bridge.cjs &

---

## TELEGRAM BOT

Port: :4000
Problem: 409 Conflict — another process uses getUpdates

### Known issues
- polling 409: likely webhook active or second consumer
- Fix: DELETE webhook first:
  curl https://api.telegram.org/bot${TOKEN}/deleteWebhook?drop_pending_updates=true
- Then restart bot

### Bot commands
/ram    — check free RAM
/shadow — trigger Shadow Routing (needs >400MB)
/help   — all commands

---

## OLLAMA — LOCAL LLM

Port: :11434
Recommended models for 8GB RAM:
- qwen2.5-coder:3b  (~1.9GB) — coding tasks
- llama3.2:3b       (~2.0GB) — general tasks
- phi3:mini         (~2.3GB) — fast inference

DO NOT load models >4GB while other services are running.
Check RAM before pull: curl http://localhost:3002/ram

### Model Limits (M1 8GB + External SSD)
- **Max monolithic model:** 4GB (hard limit, no exceptions)
- **MoE models (mixtral:8x7b):** ALLOWED via SSD Expert Streaming (USB SSD ~500MB/s)
  - Only via ZeroClaw (:4111), only when free RAM > 6GB
- **Recommended:** qwen2.5-coder:3b (coding), llama3.2:3b (general)
- **Cloud models via OpenClaw (:18789):** Claude, OpenRouter — основной рабочий маршрут

---

## HYBRID STORAGE PROTOCOL (External SSD Mode)

**External SSD:** `/Volumes/hdd - Data/ShadowStack/` (1TB APFS USB SSD, ~238GB free)
**Migration script:** `scripts/ssd-migrate.sh`

- **HOT STORAGE (Internal SSD):** node_modules, active project files, runtime caches. Apple Fabric bus = max DMA speed.
- **COLD→WARM STORAGE (External USB SSD):** Ollama models, ChromaDB vectors, logs, archives, Supermemory cache.
  - Ollama models: symlink `~/.ollama/models` → `/Volumes/hdd - Data/ShadowStack/ollama_models`
  - ChromaDB: symlink `.agent/chromadb` → `/Volumes/hdd - Data/ShadowStack/chromadb`
  - Archives: `/Volumes/hdd - Data/ShadowStack/archives`
- **MoE модели (mixtral:8x7b):** РАЗРЕШЕНЫ через SSD Expert Streaming (~500MB/s USB SSD)
- **Монолитные модели >7B (без MoE):** по-прежнему ЗАПРЕЩЕНЫ на 8GB RAM
- **При отключении SSD:** Ollama fallback на qwen2.5-coder:3b (если загружен в internal cache)
- **Routing:** OpenClaw (:18789) = облачные модели, ZeroClaw (:4111) = локальный Ollama

---

## RALPH LOOP INTEGRATION

When using Ralph autonomous loop:
1. Create PRD.md in project root
2. Agent converts to prd.json with tasks
3. Each task: { id, title, status: "pending"|"passes", tests }
4. Agent commits after each passing task
5. Context resets between tasks (reads CLAUDE.md fresh)

PRD.md location: ~/shadow-stack_local_1/PRD.md
prd.json location: ~/shadow-stack_local_1/prd.json

---

## SUPERMEMORY INTEGRATION

Plugin: opencode-supermemory
Scope: project (shadow-stack_local_1)

Memory priority:
1. CLAUDE.md (this file) — always loaded
2. handoff.md — load at session start
3. SESSION.md — current session state
4. SKILL.md files — load only when relevant skill needed

Compaction threshold: 80% context used
After compaction: write summary to SESSION.md

---

## VERCEL

⚠️ НЕ деплоить на Vercel из этого репо — Vercel-проект принадлежит другому проекту (cyberbabyangel).
Health Dashboard работает только локально на :5176.

---

## SESSION TEMPLATE

At start of each session write to SESSION.md:

## Session [DATE]
- Goal:
- Services running: [list]
- Free RAM: [MB]
- Last commit: [hash]
- Blockers: [list]

At end of session:
- What changed: [files]
- What works: [services]
- What's broken: [issues]
- Next step: [task]

---

## ANTI-PATTERNS (never do these)

- Never use `rm -rf` without dry-run first
- Never push untested code to main
- Never hardcode tokens or API keys in source files
- Never use `any` in TypeScript
- Never use `document.write()`
- Never make fetch() without error handling
- Never deploy to Vercel from this repo (другой проект)
- Never touch .env without asking first
- Never run two Ollama models simultaneously on 8GB RAM
- Never ignore API errors (always implement retry/fallback)

---
## CIRCUIT BREAKER & ROLLBACK (Survival Cascade)

### Rule: Hardware Rollback
If application state is corrupted, stuck in a loop (stuck_counter >= 3), or all API providers fail:
1.  **EXECUTE**: `git reset --hard HEAD && git clean -fd`
2.  **MARK**: Update `todo.md` task to `[FAILED - NEEDS HUMAN REVIEW]`
3.  **NEXT**: Immediately switch to the next independent task in the backlog. Do NOT stall.

### Rule: Survival Cascade
1.  **Level 1**: 3 Retries with Exponential Backoff (1s, 2s, 4s).
2.  **Level 2**: Fallback Cascade (Ollama -> OpenClaw -> OpenRouter) with 90% CostGuard protection.
3.  **Level 3**: Hardware Rollback (Git Reset).
4.  **Level 4**: Async Telegram Human-in-the-Loop (Non-blocking).
---
## OpenClaw Orchestrator Rules v4.1

### Output Format (каждый ответ агента)
📍 Статус / 🧠 RAM+Инварианты / 🔧 Действие / ✅ Результат / ➡️ Следующий шаг

### RAM Guard (обязательно перед browser-задачами)
GET http://localhost:3001/ram → { free_mb, safe, critical }
< 400MB → ollama-3b only, skip browser
< 200MB → ABORT

### Ralph Loop
READ → PLAN → EXEC → TEST → COMMIT → UPDATE → SYNC → IDLE
Правило: одна задача → тест → commit → следующая

### Skills — Lazy Load Only
Грузить скилл только когда он нужен для задачи.
Лимит контекста: 8192 токенов (M1 ограничение).

### Secrets
doppler run --project serpent --config dev -- <все команды>
НИКОГДА хардкод токенов в .ts/.js/.json

### Guardrails
❌ Docker/PostgreSQL ❌ Хардкод токенов ❌ Модели >4GB
❌ 2 Ollama одновременно ❌ Browser при RAM<400MB

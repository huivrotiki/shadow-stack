# Portable Project State Layer — Design Spec

**Date:** 2026-04-04
**Project:** shadow-stack-local (monorepo after merge)
**Status:** Draft — awaiting implementation plan
**Phase:** R0 (prerequisite to ZeroClaw Telegram Control Center from `docs/plan-v2-2026-04-04.md`)

---

## 1. Context & Problem

The user works with multiple agent runtimes on the same project:

- **Claude Code** (this CLI, reads `CLAUDE.md`)
- **OpenCode** (`.config/opencode/opencode.json`)
- **ZeroClaw** (`agent-factory/.agent/zeroclaw/config.toml`, runs on `:4111`)
- **Telegram bot** (`bot/opencode-telegram-bridge.cjs`, runs on `:4000`)
- Occasionally: Cursor, native Claude app, etc.

Each runtime has its own convention for where the "current state of work" lives. When the user switches runtime mid-task, context fragments:

- Active plan file is not found.
- Session log is scattered across tools.
- Todo lists diverge (each runtime has its own).
- Handoff is only updated manually, often after context is lost.
- Memory/supermemory pointers are runtime-specific.
- Nobody knows which git commit corresponds to which conversation.

Additionally, two separate repos (`shadow-stack_local_1` and `agent-factory`) double the problem: state lives in two places with no sync.

## 2. Goals

1. **Single source of truth** for active work state that every runtime reads on open and writes on close.
2. **Continuity across runtimes** — switching Claude Code → OpenCode → ZeroClaw preserves plan, session log, todos, handoff, memory pointers, git state.
3. **Append-only session history** — a live markdown log any runtime can tail to reconstruct "what happened today".
4. **Service registry** as one section of project state, consumed both by humans (docs) and ZeroClaw runtime (`/agents`, `/status`).
5. **Monorepo** — merge `agent-factory` into `shadow-stack_local_1` via `git subtree` so `.state/` and services registry are not duplicated.
6. **Minimal intrusion** into existing runtime configs — each runtime adds at most a hook or a single line referencing `.state/`.

## 3. Non-Goals (explicitly out of scope for v1)

- Hard enforcement of cross-runtime locks (advisory only).
- Auto-restart of downed services.
- Dependency-ordered service startup.
- Prometheus/metrics export of state.
- Web UI for state layer (may come in Phase R6 Monitoring).
- Cross-machine sync (VPS, second Mac) — local-only v1.
- Rewriting runtime internals (OpenCode plugin API, Claude Code harness) — we only use their hook/config surfaces.

## 4. Architecture Overview

```
shadow-stack_local_1/                  # monorepo after R0.0 merge
├── .state/                            # portable project state (NEW)
│   ├── current.yaml                   # pointer: plan/session/handoff/lock/git
│   ├── session.md                     # append-only live log
│   ├── todo.md                        # shared todos across runtimes
│   └── runtimes/                      # per-runtime adapters (docs only)
│       ├── claude-code.md
│       ├── opencode.md
│       ├── zeroclaw.md
│       └── telegram.md
├── agent-factory/                     # vendored via `git subtree add --squash`
│   ├── server/zeroclaw/               # ZeroClaw control-center (Phase R0.2)
│   └── .agent/
├── docs/
│   ├── SERVICES.md                    # services registry (YAML + table)
│   ├── services/                      # per-service detail pages
│   │   ├── _template.md
│   │   ├── shadow-api.md
│   │   ├── zeroclaw.md
│   │   └── ... (9 services)
│   ├── plans/
│   │   └── plan-v2-2026-04-04.md      # moved from docs/ root
│   ├── sessions/                      # archived past sessions
│   ├── handoffs/                      # archived past handoffs
│   └── superpowers/specs/             # this file lives here
├── server/                            # existing shadow-stack code
├── bot/
├── src/
├── CLAUDE.md                          # + 3 lines: read .state/current.yaml first
├── AGENTS.md                          # + 3 lines: same
├── opencode.json                      # + pre/post session hooks (or CLAUDE.md pointer)
├── handoff.md                         # stays in root (live document)
└── package.json
```

**Invariant:** any runtime, on open, reads `.state/current.yaml` before reading anything else. All writes during session go through `.state/*`.

## 5. `.state/current.yaml` Schema

```yaml
version: 1
project: shadow-stack-local
updated: 2026-04-04T21:55:00Z
active_runtime: claude-code          # last runtime that acquired the lock
lock_until: 2026-04-04T22:55:00Z     # advisory mutex (1h default)

plan:
  file: docs/plans/plan-v2-2026-04-04.md
  phase: R0                          # current phase id
  step: R0.0                         # current step within phase
  next: R0.1                         # next step hint

session:
  file: .state/session.md            # append-only live log
  started: 2026-04-04T21:30:00Z
  runtime_history:                   # short audit trail, last ~20 entries
    - { runtime: opencode,    at: 2026-04-04T21:00:00Z, action: "refactor cleanup, commit e8c589f0" }
    - { runtime: opencode,    at: 2026-04-04T21:30:00Z, action: "handoff, commit 0606e0f0" }
    - { runtime: claude-code, at: 2026-04-04T21:45:00Z, action: "design portable state layer" }

handoff:
  file: handoff.md                   # stays in project root
  last_updated: 2026-04-04T21:00:00Z

memory:
  supermemory_dir: ~/.claude/projects/-Users-work-shadow-stack-local-1/memory/
  notebooks_dir: notebooks/          # future: Phase R3 from plan-v2
  last_save: 2026-04-04T21:45:00Z

todos:
  file: .state/todo.md

git:
  branch: agent-factory
  last_commit: 62414cd5
  auto_commit_state: true            # auto-commit .state/ changes on session close

services_registry: docs/SERVICES.md
```

**Parsing:** every runtime should use a YAML parser available in its stack (`js-yaml` for Node, PyYAML for Python, built-in `yaml` for shell via `yq`). No custom formats.

**Mutex semantics (advisory):**
- On open: if `lock_until > now` AND `active_runtime != self` → runtime MUST show a warning ("locked by X until Y, continue?") but MAY proceed.
- On open after warning: overwrite `active_runtime = self`, set `lock_until = now + 1h`.
- On close: set `lock_until = now` (or delete the key) to release.
- On crash: lock expires naturally after 1h.

## 6. `.state/session.md` Format

Append-only markdown. Each event is a `## HH:MM · runtime · event_type` heading followed by optional free-form notes.

```markdown
# Session 2026-04-04

## 21:30 · claude-code · runtime_open
Read handoff.md + plan-v2. Start R0.

## 21:45 · claude-code · plan_step_advance
R0.0 started (portable state layer design)

## 22:01 · opencode · git_commit
e8c589f0 · refactor: project cleanup, security fixes

## 22:15 · zeroclaw · service_state_change
chromadb :8000 → down (v1/v2 API mismatch)

## 22:30 · claude-code · ram_critical
free_mb=95 → ollama unloaded, chrome killed, recovered to 661
```

**Parse regex:** `^## (\d{2}:\d{2}) · (\S+) · (\w+)$`

**Rotation:** when session ends (`runtime_close`), the entire `session.md` is moved to `docs/sessions/<YYYY-MM-DD>-<runtime>-<phase>.md` and a fresh `session.md` is created with just `# Session <YYYY-MM-DD>` header.

## 7. Events That MUST Be Logged

Every runtime is contractually required to append these events to `session.md` when they occur in its lifecycle:

| # | Event | Trigger | Who writes |
|---|---|---|---|
| 1 | `runtime_open` | Runtime acquires lock on project | That runtime |
| 2 | `runtime_close` | Runtime exits or user switches | That runtime |
| 3 | `git_commit` | Post-commit hook fires | Git hook (see §10) |
| 4 | `plan_step_advance` | `current.yaml:plan.step` mutates | Runtime doing the advance |
| 5 | `handoff_updated` | `handoff.md` written | Runtime writing it |
| 6 | `ram_critical` | `shadow-api /ram` returns `free_mb < 400` | shadow-api (via webhook) OR any runtime that polls |
| 7 | `fallback_fired` | OmniRoute/proxy switches to backup provider | OmniRoute/proxy (via webhook or log tail) |
| 8 | `service_state_change` | Service from `SERVICES.md` goes up/down | Whoever detects (ZeroClaw `/status` poll) |

Events 6/7/8 require hooks that don't exist yet — they're deferred to a "phase 2" of this spec and stub-logged manually until then. Events 1-5 are fully implementable at v1 launch.

## 8. `.state/todo.md` Format

Plain markdown checklist. Each runtime reads and writes it directly — no structured schema.

```markdown
# Todos — shadow-stack-local

## Phase R0 — ZeroClaw Control Center
- [x] R0.0 — portable state layer design (this spec)
- [ ] R0.0 — git subtree merge agent-factory
- [ ] R0.0 — create .state/ skeleton
- [ ] R0.1 — ZeroClaw config.toml updates
- [ ] R0.2 — control-center.cjs parses .state/
- [ ] R0.3 — Telegram commands /task /code /agents /usage

## Blockers
- [ ] ChromaDB v1 → v2 API migration (memory-mcp.js)

## Backlog
- [ ] HuggingFace API key in Doppler
- [ ] Ralph Loop (Phase R5)
```

Parsing is trivial: any markdown renderer or `grep -E '^- \[[ x]\]'`.

## 9. Runtime Contract

Every runtime MUST implement this lifecycle:

### 9.1 On open (entering the project)

1. Read `.state/current.yaml`. If missing → create from template (see §12).
2. Check `lock_until` vs current time.
   - If expired or `active_runtime == self` → proceed.
   - Else → warn user, wait for confirmation, proceed on confirm.
3. Set `active_runtime = <self>`, `lock_until = now + 1h`.
4. Append `runtime_open` event to `.state/session.md`.
5. Load `plan.file`, `todos.file`, `handoff.file` into runtime's working context.
6. Write updated `current.yaml`.

### 9.2 During work

- Any change to plan step → update `current.yaml:plan.step` + append `plan_step_advance`.
- Any edit to handoff.md → append `handoff_updated`.
- Any todo mutation → rewrite `.state/todo.md` (no in-memory shadow copy).
- Any notable milestone the runtime recognizes → append free-form event.

### 9.3 On close (exiting or switching)

1. Append `runtime_close` event to `session.md`.
2. If `git.auto_commit_state == true`:
   ```bash
   git add .state/ && git commit -m "state: <runtime> session end at <HH:MM>" || true
   ```
   (The `|| true` means no-op if nothing changed.)
3. Set `lock_until = now` (release lock).
4. Write final `current.yaml`.

### 9.4 On session rotation (daily or manual)

When the user runs `/session rotate` (or runtime detects date change):
1. `mv .state/session.md docs/sessions/<YYYY-MM-DD>-<runtime>-<phase>.md`
2. Create new `.state/session.md` with just `# Session <YYYY-MM-DD>` heading
3. Snapshot `handoff.md` → `docs/handoffs/<YYYY-MM-DD>.md`

## 10. Runtime Adapters (docs only, no code in spec)

Each adapter in `.state/runtimes/<runtime>.md` documents **how that specific runtime implements the contract above**. The adapters are markdown, not code — they describe the mechanism the runtime uses to hook into `.state/`.

### 10.1 `claude-code.md`

- **Read mechanism:** `CLAUDE.md` first 5 lines instruct Claude to `Read .state/current.yaml` before anything else, and to treat `.state/session.md` and `.state/todo.md` as the authoritative context.
- **Write mechanism:** Claude uses its Write/Edit tools directly on `.state/*` files. No special harness needed.
- **Lock handling:** Claude reads `lock_until` and asks the user in conversation if another runtime holds it.
- **Close:** on conversation end / `/clear`, the user (or skill automation) commits `.state/`.

### 10.2 `opencode.md`

- **Read mechanism:** `opencode.json` gains `pre_session_hook` that prints `.state/current.yaml` to the session context, OR the OpenCode system prompt is extended via `instructions` field to read it.
- **Write mechanism:** OpenCode's bash tool writes to `.state/*` directly. A `post_session_hook` runs `git add .state/ && git commit -m "state: opencode end"`.
- **Lock handling:** pre_session_hook prints a warning if lock is held by another runtime.

### 10.3 `zeroclaw.md`

- **Read mechanism:** `control-center.cjs` parses `.state/current.yaml` on startup and on every `/task` command. It also parses `docs/SERVICES.md` YAML frontmatter for service dispatch.
- **Write mechanism:** CJS module with `fs.appendFileSync(session.md)` for events and `yaml.dump(current.yaml)` for state updates.
- **Lock handling:** rejects `/task` commands if lock is held by another runtime and user did not send `/force`.

### 10.4 `telegram.md`

- **Read mechanism:** via ZeroClaw — Telegram bot itself is a thin layer over ZeroClaw's HTTP API on `:4111`.
- **Write mechanism:** same path — commands like `/todo add X` go through ZeroClaw which writes `.state/todo.md`.
- **Extra commands:**
  - `/state` → pretty-print `current.yaml`.
  - `/todo` → show/edit `.state/todo.md`.
  - `/session tail 10` → last 10 entries from `session.md`.

## 11. `docs/SERVICES.md` — Embedded Services Registry

Structured exactly as in the previous Hybrid C design (earlier brainstorm iteration). Summary:

- **YAML frontmatter** = machine-readable registry consumed by ZeroClaw `/agents` and `/status`.
- **Markdown body** = human-readable table + edit instructions.
- **Per-service pages** in `docs/services/<name>.md` from `docs/services/_template.md`.

**Services in v1 registry (9 entries):**

| Service | Port | Owner | Status |
|---|---|---|---|
| shadow-api | 3001 | shadow-stack | up |
| shadow-router | 3002 | shadow-stack | stopped (on-demand) |
| telegram-bot | 4000 | shadow-stack | up |
| zeroclaw | 4111 | agent-factory | up |
| health-dashboard | 5175 | shadow-stack | up |
| ollama | 11434 | system | up |
| omniroute | 20128 | agent-factory | up |
| free-models-proxy | 20129 | agent-factory | up |
| chromadb | 8000 | system/venv | broken (v1/v2 mismatch) |

Since the project becomes monorepo, `owner` values `shadow-stack` and `agent-factory` now refer to **subdirectories** of the same repo, not separate repos. The field is retained for documentation clarity (which subproject owns the service).

Full YAML schema for each service entry is identical to the previous Hybrid C design — reproduced inline in `docs/SERVICES.md` at implementation time, not duplicated here.

## 12. Monorepo Merge Plan (R0.0)

**Strategy:** `git subtree add --squash` — non-destructive, squashes agent-factory history into a single commit to keep `.git` size manageable.

**Steps:**

```bash
cd /Users/work/shadow-stack_local_1

# 1. Verify clean state in both repos
(cd /Users/work/agent-factory && git status --porcelain)    # must be empty
git status --porcelain                                       # must be empty

# 2. Add agent-factory as subtree
git remote add agent-factory-src /Users/work/agent-factory
git fetch agent-factory-src
git subtree add --prefix=agent-factory agent-factory-src main --squash \
  -m "chore: vendor agent-factory as subtree (monorepo consolidation)"

# 3. Verify result
ls agent-factory/                                            # should contain its files
git log --oneline -3                                         # should show squash commit

# 4. Remove the remote reference (not needed after add)
git remote remove agent-factory-src
```

**Rollback plan:** if the merge goes wrong, `git reset --hard HEAD~1` (the subtree commit is the tip). The original `/Users/work/agent-factory/` remains untouched during subtree add, so nothing is lost. Only after user validates the monorepo works, the old directory is moved to Trash via Finder.

**What is NOT done in this step:**
- No history rewriting of `shadow-stack_local_1`.
- No deletion of `/Users/work/agent-factory/` source.
- No changes to `agent-factory/`'s internal file structure.
- No merge of `package.json` / dependencies — each subproject keeps its own.

## 13. Minimal Intrusion Into Existing Files

These are the only edits to existing files required by v1:

| File | Change | Lines |
|---|---|---|
| `CLAUDE.md` | Add header section: "Before anything else: read `.state/current.yaml`, then `.state/todo.md`, then `handoff.md`. Treat `.state/session.md` as the live log of the current session and append to it at milestones." | ~5 |
| `AGENTS.md` | Same header section | ~5 |
| `opencode.json` | Add `pre_session_hook` + `post_session_hook` invoking small shell commands OR add the header to its `instructions` field | ~2-4 |
| `bot/opencode-telegram-bridge.cjs` | Add `/state`, `/todo`, `/session` commands reading from `.state/` | ~40 |
| `.gitignore` | Add `!.state/` (ensure not ignored by mistake) | 1 |

Nothing else in existing files changes at v1. The services-registry-driven rewrites of `CLAUDE.md` port tables, etc., are R1 work (see plan-v2).

## 14. File & Schema Validation

A pre-commit hook MUST validate:

1. `.state/current.yaml` parses as valid YAML and has required keys (`version`, `project`, `plan`, `session`, `git`).
2. `.state/session.md` exists (create empty with header if missing).
3. `docs/SERVICES.md` YAML frontmatter parses.
4. If `current.yaml:plan.file` is specified, that file exists.

Invalid state blocks the commit with a clear error message. The hook is installed via `scripts/install-hooks.sh` (idempotent, can be re-run safely).

## 15. Bootstrap Sequence (First-Run)

On fresh clone or first-time setup:

```bash
bash scripts/bootstrap-state.sh
```

This script:
1. Creates `.state/` directory if missing.
2. Generates `.state/current.yaml` from template with current git state filled in.
3. Creates empty `.state/session.md` with today's header.
4. Creates `.state/todo.md` from template.
5. Runs `scripts/install-hooks.sh`.
6. Prints next steps to stdout.

## 16. Integration With Phase R0 From plan-v2

The existing `docs/plan-v2-2026-04-04.md` Phase R0 stays, but is **prefixed** by R0.0:

- **R0.0 (NEW)** — Monorepo merge + `.state/` skeleton + `docs/SERVICES.md` + runtime adapter docs. **This is the subject of this spec.**
- **R0.1** — `agent-factory/.agent/zeroclaw/config.toml` references `.state/` and `docs/SERVICES.md` instead of hardcoding values. (plan-v2 unchanged.)
- **R0.2** — `control-center.cjs` parses `.state/current.yaml` and `SERVICES.md` YAML. (plan-v2 unchanged but implementation now reads from registry.)
- **R0.3** — Telegram commands `/task /code /agents /usage` — additionally write `task_dispatched` events to `session.md`.
- **R0.4-R0.6** — from plan-v2, no changes.

R1-R8 from plan-v2 are unchanged in intent; they consume the state layer and registry as side-effects.

## 17. Explicit Non-Implementations (v1)

Listed so implementation plan does not accidentally pick them up:

| Thing | Deferred to |
|---|---|
| Hard-enforced cross-runtime locks | v2 of this spec if advisory proves insufficient |
| Events 6/7/8 (ram_critical, fallback_fired, service_state_change) with real hooks | Phase R6 (Monitoring) |
| Session auto-rotation on date change | Manual for v1; automate later |
| Notebook LLM layer (Phase R3 from plan-v2) | Separate spec |
| Supermemory namespaces config (Phase R4) | Separate spec |
| ChromaDB v2 API migration | Separate task — this spec doesn't touch memory-mcp.js |
| Web UI for `.state/` viewing | Phase R6 |
| Sync to VPS / second machine | Not planned |

## 18. Success Criteria

v1 is considered shipped when all of these are true:

1. `git log --oneline` shows `chore: vendor agent-factory as subtree (monorepo consolidation)` commit.
2. `ls agent-factory/` inside `shadow-stack_local_1` shows the vendored files.
3. `.state/current.yaml` exists, is valid YAML, and has `active_runtime` set.
4. `.state/session.md` has at least one `runtime_open` entry from claude-code.
5. `docs/SERVICES.md` has YAML frontmatter parseable by `yq`, and the live table shows 9 services.
6. `docs/services/<name>.md` exists for each of the 9 services.
7. `CLAUDE.md` and `AGENTS.md` have the new header section pointing to `.state/current.yaml`.
8. `opencode.json` has hooks or instructions referencing `.state/`.
9. `bot/opencode-telegram-bridge.cjs` has `/state`, `/todo`, `/session` commands that return live data.
10. `scripts/install-hooks.sh` and `scripts/bootstrap-state.sh` exist and are idempotent.
11. Pre-commit hook rejects commits with invalid `current.yaml`.
12. A complete manual test: Claude Code session updates `.state/*`, user quits, user opens OpenCode, OpenCode sees the exact same `current.yaml` and `session.md`.

## 19. Open Questions (none blocking v1)

- Q: Should `session.md` also accept free-form notes from the user via `/note <text>` command? → Nice-to-have, defer.
- Q: Should we version `.state/` format (`version: 1` field)? → Yes, already included in schema; migrate on bump.
- Q: Should Claude Code's global auto-memory system sync with `.state/`? → Out of scope v1; they coexist.

---

**End of spec.** Implementation plan to be generated by `writing-plans` skill.

# Portable Project State Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `.state/` directory that lets Claude Code, OpenCode, ZeroClaw and the Telegram bot share the same view of plan, session log, todos, handoff and services registry across runtime switches, on top of a monorepo merge of `agent-factory` into `shadow-stack_local_1`.

**Architecture:** Single source of truth in `.state/current.yaml` (YAML), append-only `session.md`, shared `todo.md`, and `docs/SERVICES.md` (YAML frontmatter + markdown table) parsed by both humans and ZeroClaw. Runtimes read on open, write on close, advisory lock prevents collisions. Monorepo via `git subtree add --squash` so there is nothing to sync.

**Tech Stack:** Bash (scripts + hooks), YAML (state + services registry), Markdown (session/todo/adapters/per-service pages), Node.js CJS (bot extensions), Python 3 (YAML validation in hook, already present in `.venv`), Git (subtree + pre-commit hook).

**Source spec:** `docs/superpowers/specs/2026-04-04-portable-state-layer-design.md`

---

## File Structure (what this plan creates or touches)

### New directories
- `.state/` — portable state layer
- `.state/runtimes/` — adapter docs (one MD per runtime)
- `docs/plans/` — archived plans (plan-v2 moves here)
- `docs/sessions/` — archived sessions (empty at v1)
- `docs/handoffs/` — archived handoffs (empty at v1)
- `docs/services/` — per-service detail pages
- `agent-factory/` — vendored subtree (all its current files)

### New files
- `.state/current.yaml` — active state pointer (schema per spec §5)
- `.state/session.md` — append-only live log (format per spec §6)
- `.state/todo.md` — shared markdown checklist
- `.state/runtimes/claude-code.md` — adapter doc
- `.state/runtimes/opencode.md` — adapter doc
- `.state/runtimes/zeroclaw.md` — adapter doc
- `.state/runtimes/telegram.md` — adapter doc
- `docs/SERVICES.md` — services registry (9 services, YAML + table)
- `docs/services/_template.md` — per-service template
- `docs/services/shadow-api.md` — per-service detail
- `docs/services/shadow-router.md`
- `docs/services/telegram-bot.md`
- `docs/services/zeroclaw.md`
- `docs/services/health-dashboard.md`
- `docs/services/ollama.md`
- `docs/services/omniroute.md`
- `docs/services/free-models-proxy.md`
- `docs/services/chromadb.md`
- `scripts/bootstrap-state.sh` — first-run setup
- `scripts/validate-state.sh` — YAML/file sanity check
- `scripts/install-hooks.sh` — idempotent hook installer
- `.git/hooks/pre-commit` — installed by `install-hooks.sh`
- `tests/state/test-validate-state.sh` — bash test harness for validator
- `tests/bot/test-state-helpers.cjs` — Node test for bot helpers

### Modified files
- `CLAUDE.md` — prepend 7-line header pointing to `.state/`
- `AGENTS.md` — prepend identical header
- `opencode.json` — add instructions field referencing `.state/`
- `bot/opencode-telegram-bridge.cjs` — add `/state`, `/todo`, `/session` commands + helpers
- `handoff.md` — final update at end of plan
- `docs/plans/plan-v2-2026-04-04.md` — moved from `docs/plan-v2-2026-04-04.md`

### Out of scope (per spec §17)
- No changes to `server/`, `server/shadow-router.cjs`, `server/free-models-proxy.cjs`
- No ChromaDB v1/v2 migration
- No ZeroClaw control-center rewrite (that's R0.2, not R0.0)
- No notebook/supermemory layer (R3/R4)

---

## Task 1: Pre-flight — verify clean workspaces and create feature branch

**Why first:** The monorepo merge is hard to reverse mid-flight. Both repos must be clean. A dedicated branch lets us roll back the entire plan with `git branch -D` if needed.

**Files:** None modified. Read-only checks + branch creation.

- [ ] **Step 1: Verify shadow-stack_local_1 clean**

Run:
```bash
cd /Users/work/shadow-stack_local_1 && git status --porcelain
```
Expected: empty output.
If not empty: STOP, commit or stash pending changes first. Do not proceed.

- [ ] **Step 2: Verify agent-factory clean**

Run:
```bash
cd /Users/work/agent-factory && git status --porcelain && git rev-parse --abbrev-ref HEAD
```
Expected: empty output, branch name printed (likely `main` or `master`).
If not empty: STOP, fix agent-factory first.

- [ ] **Step 3: Note agent-factory HEAD for reference**

Run:
```bash
cd /Users/work/agent-factory && git rev-parse HEAD && git log --oneline -1
```
Expected: prints commit hash and message. Copy this into the commit message of Task 2.

- [ ] **Step 4: Create feature branch in shadow-stack_local_1**

Run:
```bash
cd /Users/work/shadow-stack_local_1
git checkout -b feat/portable-state-layer
git status
```
Expected: `On branch feat/portable-state-layer`, nothing to commit.

- [ ] **Step 5: Commit nothing (checkpoint)**

No commit — this is a setup-only task. Proceed to Task 2.

---

## Task 2: Monorepo merge via `git subtree add --squash`

**Why:** Consolidates both repos so `.state/` has nothing to synchronize. Uses `--squash` to keep `.git` size manageable (per spec §12).

**Files:** Creates `agent-factory/` subtree. Creates one squash commit.

- [ ] **Step 1: Add local remote pointing to agent-factory**

Run:
```bash
cd /Users/work/shadow-stack_local_1
git remote add agent-factory-src /Users/work/agent-factory
git fetch agent-factory-src
```
Expected: `remote: Enumerating objects`, fetch succeeds, no errors.

- [ ] **Step 2: Determine agent-factory main branch name**

Run:
```bash
git ls-remote --heads agent-factory-src | awk '{print $2}' | sed 's|refs/heads/||'
```
Expected: prints branch names (likely `main` or `master`). Use the first one in step 3.

- [ ] **Step 3: Subtree add with squash**

Run (replace `main` with the actual branch name from step 2 if different):
```bash
git subtree add --prefix=agent-factory agent-factory-src main --squash \
  -m "chore: vendor agent-factory as subtree (monorepo consolidation)"
```
Expected: `Added dir 'agent-factory'`. New squash commit appears on current branch.

- [ ] **Step 4: Remove the remote reference**

Run:
```bash
git remote remove agent-factory-src
git remote -v
```
Expected: `agent-factory-src` gone from remote list.

- [ ] **Step 5: Verify subtree contents**

Run:
```bash
ls agent-factory/ | head -20
git log --oneline -3
```
Expected: agent-factory files visible, top commit is the vendor commit.

- [ ] **Step 6: No extra commit needed (subtree add already committed)**

The subtree add created the commit in step 3. Proceed to Task 3.

---

## Task 3: Post-merge verification and sanity checks

**Why:** Confirm the monorepo is healthy before building on top of it.

**Files:** Read-only checks.

- [ ] **Step 1: Verify key agent-factory files present**

Run:
```bash
ls agent-factory/.agent/ 2>/dev/null
ls agent-factory/server/ 2>/dev/null
ls agent-factory/CLAUDE.md 2>/dev/null
```
Expected: `.agent/` and `server/` directories exist, `agent-factory/CLAUDE.md` exists.

- [ ] **Step 2: Verify shadow-stack code is still intact**

Run:
```bash
ls server/index.js server/free-models-proxy.cjs bot/opencode-telegram-bridge.cjs
```
Expected: all three files listed, no errors.

- [ ] **Step 3: Check .git size did not explode**

Run:
```bash
du -sh .git/
```
Expected: under ~500MB (was 298MB pre-merge, `--squash` keeps growth modest).
If over 500MB: investigate with `git count-objects -v`. Do not proceed until understood.

- [ ] **Step 4: Leave original `/Users/work/agent-factory/` untouched for now**

Do not delete. It stays as a backup until end of plan (Task 21).

- [ ] **Step 5: No commit needed**

Proceed to Task 4.

---

## Task 4: Move `docs/plan-v2-2026-04-04.md` into `docs/plans/`

**Why:** Spec §4 layout puts plans under `docs/plans/`. Doing this early means `.state/current.yaml:plan.file` can reference the final path.

**Files:**
- Create dir: `docs/plans/`
- Move: `docs/plan-v2-2026-04-04.md` → `docs/plans/plan-v2-2026-04-04.md`

- [ ] **Step 1: Create target directory**

Run:
```bash
mkdir -p docs/plans docs/sessions docs/handoffs docs/services
ls docs/
```
Expected: `plans`, `sessions`, `handoffs`, `services`, `superpowers` all visible.

- [ ] **Step 2: Move plan-v2 via git**

Run:
```bash
git mv docs/plan-v2-2026-04-04.md docs/plans/plan-v2-2026-04-04.md
git status --short
```
Expected: `R  docs/plan-v2-2026-04-04.md -> docs/plans/plan-v2-2026-04-04.md`.

- [ ] **Step 3: Verify no references break**

Run:
```bash
grep -r "plan-v2-2026-04-04.md" --include="*.md" . 2>/dev/null | grep -v docs/plans/ | grep -v docs/superpowers/
```
Expected: only references in `handoff.md` or similar session notes (those are historical, leave them — they referenced the old path at the time).

- [ ] **Step 4: Commit**

Run:
```bash
git add -A
git commit -m "chore: move plan-v2 into docs/plans/ for state layer"
```
Expected: commit succeeds.

---

## Task 5: Create `.state/` skeleton files

**Why:** Creates the physical shape of the state layer so later tasks have concrete paths to reference. Content follows spec §5, §6, §8.

**Files:**
- Create: `.state/current.yaml`
- Create: `.state/session.md`
- Create: `.state/todo.md`

- [ ] **Step 1: Create `.state/current.yaml`**

Write file `.state/current.yaml` with this exact content (replace timestamp with current UTC time, replace commit hash with output of `git rev-parse --short HEAD`):

```yaml
version: 1
project: shadow-stack-local
updated: 2026-04-04T22:00:00Z
active_runtime: claude-code
lock_until: 2026-04-04T23:00:00Z

plan:
  file: docs/plans/plan-v2-2026-04-04.md
  phase: R0
  step: R0.0
  next: R0.1

session:
  file: .state/session.md
  started: 2026-04-04T22:00:00Z
  runtime_history:
    - { runtime: claude-code, at: 2026-04-04T22:00:00Z, action: "bootstrap state layer" }

handoff:
  file: handoff.md
  last_updated: 2026-04-04T21:00:00Z

memory:
  supermemory_dir: ~/.claude/projects/-Users-work-shadow-stack-local-1/memory/
  notebooks_dir: notebooks/
  last_save: null

todos:
  file: .state/todo.md

git:
  branch: feat/portable-state-layer
  last_commit: PLACEHOLDER
  auto_commit_state: true

services_registry: docs/SERVICES.md
```

After writing, replace `PLACEHOLDER` with:
```bash
git rev-parse --short HEAD
```

- [ ] **Step 2: Create `.state/session.md`**

Write file `.state/session.md` with this exact content:

```markdown
# Session 2026-04-04

## 22:00 · claude-code · runtime_open
Bootstrap of portable state layer begins. Plan: docs/superpowers/plans/2026-04-04-portable-state-layer.md

## 22:00 · claude-code · plan_step_advance
R0.0 · creating .state/ skeleton
```

- [ ] **Step 3: Create `.state/todo.md`**

Write file `.state/todo.md` with this exact content:

```markdown
# Todos — shadow-stack-local

## Phase R0.0 — Portable State Layer (active)
- [x] Task 1 — pre-flight
- [x] Task 2 — monorepo merge
- [x] Task 3 — post-merge verify
- [x] Task 4 — move plan-v2
- [ ] Task 5 — .state/ skeleton (in progress)
- [ ] Task 6 — bootstrap script
- [ ] Task 7-9 — validator script (TDD)
- [ ] Task 10-11 — install-hooks.sh + pre-commit
- [ ] Task 12 — SERVICES.md registry
- [ ] Task 13 — per-service pages
- [ ] Task 14 — runtime adapter docs
- [ ] Task 15-17 — CLAUDE.md / AGENTS.md / opencode.json updates
- [ ] Task 18-19 — bot extensions (TDD)
- [ ] Task 20 — end-to-end verification
- [ ] Task 21 — handoff + final commit

## Phase R0.1-R0.6 — ZeroClaw Control Center (next, from plan-v2)

## Blockers
- [ ] ChromaDB v1 → v2 API migration (memory-mcp.js)

## Backlog
- [ ] HuggingFace API key in Doppler
- [ ] Ralph Loop (Phase R5)
- [ ] Notebook LLM (Phase R3)
```

- [ ] **Step 4: Verify all three files exist and are non-empty**

Run:
```bash
ls -la .state/
wc -l .state/current.yaml .state/session.md .state/todo.md
```
Expected: 3 files, each with >0 lines.

- [ ] **Step 5: Commit**

Run:
```bash
git add .state/
git commit -m "feat(state): create .state/ skeleton (current.yaml, session.md, todo.md)"
```
Expected: commit succeeds.

---

## Task 6: Create `scripts/bootstrap-state.sh`

**Why:** Makes the state layer reproducible on fresh clones. Idempotent — safe to re-run. Per spec §15.

**Files:**
- Create: `scripts/bootstrap-state.sh` (executable)

- [ ] **Step 1: Write the script**

Write file `scripts/bootstrap-state.sh` with this exact content:

```bash
#!/usr/bin/env bash
# bootstrap-state.sh — idempotent setup of .state/ layer
# Safe to re-run: will not overwrite existing files.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

mkdir -p .state/runtimes docs/plans docs/sessions docs/handoffs docs/services

NOW="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
COMMIT="$(git rev-parse --short HEAD)"

if [ ! -f .state/current.yaml ]; then
  cat > .state/current.yaml <<EOF
version: 1
project: shadow-stack-local
updated: ${NOW}
active_runtime: null
lock_until: null

plan:
  file: docs/plans/plan-v2-2026-04-04.md
  phase: R0
  step: R0.0
  next: R0.1

session:
  file: .state/session.md
  started: ${NOW}
  runtime_history: []

handoff:
  file: handoff.md
  last_updated: null

memory:
  supermemory_dir: ~/.claude/projects/-Users-work-shadow-stack-local-1/memory/
  notebooks_dir: notebooks/
  last_save: null

todos:
  file: .state/todo.md

git:
  branch: ${BRANCH}
  last_commit: ${COMMIT}
  auto_commit_state: true

services_registry: docs/SERVICES.md
EOF
  echo "✅ created .state/current.yaml"
else
  echo "⏭  .state/current.yaml exists, skipping"
fi

if [ ! -f .state/session.md ]; then
  echo "# Session $(date -u +%Y-%m-%d)" > .state/session.md
  echo "" >> .state/session.md
  echo "✅ created .state/session.md"
else
  echo "⏭  .state/session.md exists, skipping"
fi

if [ ! -f .state/todo.md ]; then
  cat > .state/todo.md <<'EOF'
# Todos — shadow-stack-local

## Active

## Blockers

## Backlog
EOF
  echo "✅ created .state/todo.md"
else
  echo "⏭  .state/todo.md exists, skipping"
fi

echo ""
echo "✅ .state/ bootstrapped at ${NOW}"
```

- [ ] **Step 2: Make it executable**

Run:
```bash
chmod +x scripts/bootstrap-state.sh
ls -l scripts/bootstrap-state.sh
```
Expected: `-rwxr-xr-x` (executable bit set).

- [ ] **Step 3: Run it on an already-populated state (idempotency test)**

Run:
```bash
bash scripts/bootstrap-state.sh
```
Expected: three `⏭  ... exists, skipping` lines, then `✅ .state/ bootstrapped`. No files mutated.

- [ ] **Step 4: Verify no files were touched**

Run:
```bash
git status --short .state/
```
Expected: empty (no changes).

- [ ] **Step 5: Commit**

Run:
```bash
git add scripts/bootstrap-state.sh
git commit -m "feat(scripts): add bootstrap-state.sh (idempotent state layer setup)"
```
Expected: commit succeeds.

---

## Task 7: Write failing test for `validate-state.sh` (happy path)

**Why:** TDD — define correctness before implementation. Uses a simple bash test harness (no framework), asserting exit codes and output.

**Files:**
- Create: `tests/state/test-validate-state.sh`

- [ ] **Step 1: Create test directory**

Run:
```bash
mkdir -p tests/state
```

- [ ] **Step 2: Write the test harness**

Write file `tests/state/test-validate-state.sh` with this exact content:

```bash
#!/usr/bin/env bash
# Test harness for scripts/validate-state.sh
# Runs a sequence of cases and reports pass/fail counts.
set -uo pipefail

ROOT="$(git rev-parse --show-toplevel)"
VALIDATOR="$ROOT/scripts/validate-state.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

PASS=0
FAIL=0

assert() {
  local name="$1"
  local expected_exit="$2"
  local actual_exit="$3"
  if [ "$expected_exit" = "$actual_exit" ]; then
    echo "  ✅ $name"
    PASS=$((PASS+1))
  else
    echo "  ❌ $name (expected exit=$expected_exit, got $actual_exit)"
    FAIL=$((FAIL+1))
  fi
}

# Case 1: happy path (real project state)
cd "$ROOT"
bash "$VALIDATOR" >/dev/null 2>&1
assert "happy_path: real state validates" 0 $?

# Case 2: missing current.yaml
cd "$TMP"
git init -q .
mkdir -p .state
bash "$VALIDATOR" >/dev/null 2>&1
assert "missing_current_yaml: fails" 1 $?

# Case 3: invalid YAML in current.yaml
echo "this is: not: valid: yaml:" > "$TMP/.state/current.yaml"
touch "$TMP/.state/session.md"
bash "$VALIDATOR" >/dev/null 2>&1
assert "invalid_yaml: fails" 1 $?

# Case 4: missing required key (no 'git' section)
cat > "$TMP/.state/current.yaml" <<'EOF'
version: 1
project: test
plan:
  file: missing.md
session:
  file: .state/session.md
EOF
bash "$VALIDATOR" >/dev/null 2>&1
assert "missing_required_key_git: fails" 1 $?

echo ""
echo "Passed: $PASS / $((PASS+FAIL))"
[ $FAIL -eq 0 ]
```

- [ ] **Step 3: Make it executable**

Run:
```bash
chmod +x tests/state/test-validate-state.sh
```

- [ ] **Step 4: Run it — verify it FAILS because validator does not exist yet**

Run:
```bash
bash tests/state/test-validate-state.sh
```
Expected: all 4 cases report failure (validator file does not exist so every run errors), overall exit != 0. Output will show ❌ lines. This is expected TDD red.

- [ ] **Step 5: No commit — proceed to Task 8**

---

## Task 8: Implement `scripts/validate-state.sh` to make tests pass

**Why:** Minimal implementation that passes all 4 test cases.

**Files:**
- Create: `scripts/validate-state.sh` (executable)

- [ ] **Step 1: Write the validator**

Write file `scripts/validate-state.sh` with this exact content:

```bash
#!/usr/bin/env bash
# validate-state.sh — sanity check of .state/ and docs/SERVICES.md
# Exit 0 if valid, 1 otherwise. Prints errors to stderr.
set -uo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

ERRORS=0
err() { echo "❌ $1" >&2; ERRORS=$((ERRORS+1)); }

# 1. .state/current.yaml must exist
if [ ! -f .state/current.yaml ]; then
  err ".state/current.yaml missing"
else
  # 2. must parse as YAML
  if ! python3 -c "import yaml; yaml.safe_load(open('.state/current.yaml'))" 2>/dev/null; then
    err ".state/current.yaml is not valid YAML"
  else
    # 3. must contain required top-level keys
    for key in version project plan session git; do
      if ! python3 -c "
import yaml
d = yaml.safe_load(open('.state/current.yaml'))
import sys
sys.exit(0 if isinstance(d, dict) and '$key' in d else 1)
" 2>/dev/null; then
        err ".state/current.yaml missing required key: $key"
      fi
    done
  fi
fi

# 4. .state/session.md must exist
if [ ! -f .state/session.md ]; then
  err ".state/session.md missing"
fi

# 5. If docs/SERVICES.md exists, its YAML frontmatter must parse
if [ -f docs/SERVICES.md ]; then
  if ! python3 -c "
import sys, yaml
content = open('docs/SERVICES.md').read()
if not content.startswith('---'):
    sys.exit(2)
end = content.find('\n---', 3)
if end < 0:
    sys.exit(3)
yaml.safe_load(content[4:end])
" 2>/dev/null; then
    err "docs/SERVICES.md YAML frontmatter invalid or missing"
  fi
fi

# 6. If plan.file is set in current.yaml, that file must exist
if [ -f .state/current.yaml ]; then
  PLAN_FILE=$(python3 -c "
import yaml
try:
  d = yaml.safe_load(open('.state/current.yaml'))
  print(d.get('plan', {}).get('file', ''))
except Exception:
  pass
" 2>/dev/null || echo "")
  if [ -n "$PLAN_FILE" ] && [ ! -f "$PLAN_FILE" ]; then
    err "plan.file points to missing: $PLAN_FILE"
  fi
fi

if [ $ERRORS -gt 0 ]; then
  echo "" >&2
  echo "state validation failed with $ERRORS errors" >&2
  exit 1
fi

echo "✅ .state/ valid"
exit 0
```

- [ ] **Step 2: Make it executable**

Run:
```bash
chmod +x scripts/validate-state.sh
```

- [ ] **Step 3: Run the test harness — all 4 cases must pass**

Run:
```bash
bash tests/state/test-validate-state.sh
```
Expected: 4 ✅ lines, `Passed: 4 / 4`, exit 0.

- [ ] **Step 4: Also run validator directly on real project**

Run:
```bash
bash scripts/validate-state.sh
```
Expected: `✅ .state/ valid`, exit 0.

- [ ] **Step 5: Commit**

Run:
```bash
git add scripts/validate-state.sh tests/state/test-validate-state.sh
git commit -m "feat(scripts): validate-state.sh with bash test harness (TDD)"
```
Expected: commit succeeds.

---

## Task 9: Create `scripts/install-hooks.sh` + pre-commit hook

**Why:** Ensures every commit touching `.state/` or `docs/SERVICES.md` is validated. Idempotent installation.

**Files:**
- Create: `scripts/install-hooks.sh` (executable)
- Created by script: `.git/hooks/pre-commit` (executable)

- [ ] **Step 1: Write the installer**

Write file `scripts/install-hooks.sh` with this exact content:

```bash
#!/usr/bin/env bash
# install-hooks.sh — idempotent git hook installer for portable state layer
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
HOOK="$ROOT/.git/hooks/pre-commit"

cat > "$HOOK" <<'HOOK_EOF'
#!/usr/bin/env bash
# Auto-installed by scripts/install-hooks.sh
# Validates .state/ and docs/SERVICES.md on commits that touch them.
set -e
ROOT="$(git rev-parse --show-toplevel)"

# Only run validator if staged changes touch .state/ or docs/SERVICES.md
if git diff --cached --name-only | grep -qE '^\.state/|^docs/SERVICES\.md$'; then
  if ! bash "$ROOT/scripts/validate-state.sh"; then
    echo ""
    echo "Pre-commit blocked. Fix with: bash scripts/bootstrap-state.sh"
    exit 1
  fi
fi
HOOK_EOF

chmod +x "$HOOK"
echo "✅ pre-commit hook installed at $HOOK"
```

- [ ] **Step 2: Make installer executable and run it**

Run:
```bash
chmod +x scripts/install-hooks.sh
bash scripts/install-hooks.sh
ls -l .git/hooks/pre-commit
```
Expected: `✅ pre-commit hook installed at ...`, `-rwxr-xr-x` on the hook.

- [ ] **Step 3: Smoke test — commit that touches unrelated file should not trigger validator**

Run:
```bash
touch /tmp/smoke-unrelated.txt
cp /tmp/smoke-unrelated.txt smoke-unrelated.txt
git add smoke-unrelated.txt
git commit -m "test: unrelated file (should skip validator)"
```
Expected: commit succeeds. No `.state/` validation messages.

- [ ] **Step 4: Clean up the smoke file**

Run:
```bash
git rm smoke-unrelated.txt
git commit -m "test: remove smoke file"
```
Expected: both commits land.

- [ ] **Step 5: Commit installer script**

Run:
```bash
git add scripts/install-hooks.sh
git commit -m "feat(scripts): install-hooks.sh (idempotent pre-commit installer)"
```
Expected: commit succeeds.

---

## Task 10: Verify pre-commit hook rejects invalid state

**Why:** Integration test — the hook must actually block commits with broken state.

**Files:** Temporarily corrupts `.state/current.yaml`, then restores it.

- [ ] **Step 1: Back up current.yaml**

Run:
```bash
cp .state/current.yaml /tmp/current.yaml.bak
```

- [ ] **Step 2: Corrupt it and attempt a commit**

Run:
```bash
echo "this is: not: valid: yaml:::" >> .state/current.yaml
git add .state/current.yaml
git commit -m "test: should be rejected"
```
Expected: commit FAILS with `❌ .state/current.yaml is not valid YAML` and `Pre-commit blocked` message. Exit code non-zero.

- [ ] **Step 3: Restore from backup**

Run:
```bash
cp /tmp/current.yaml.bak .state/current.yaml
rm /tmp/current.yaml.bak
git diff .state/current.yaml
```
Expected: no diff — original content restored.

- [ ] **Step 4: Unstage the corrupted attempt**

Run:
```bash
git reset HEAD .state/current.yaml
git status --short
```
Expected: clean state.

- [ ] **Step 5: No commit — this was a destructive verification, nothing to land**

Proceed to Task 11.

---

## Task 11: Create `docs/services/_template.md` and `docs/SERVICES.md`

**Why:** Establishes the services registry. YAML frontmatter consumed by ZeroClaw, table consumed by humans. Content per spec §11.

**Files:**
- Create: `docs/services/_template.md`
- Create: `docs/SERVICES.md`

- [ ] **Step 1: Create the per-service template**

Write file `docs/services/_template.md` with this exact content:

```markdown
---
service: <name>
port: <N>
status: up|down|broken|planned|stopped
---

# <Service Name>

**Port:** `:<N>` · **Owner:** `<owner>` · **Entry:** `<path>`

## Purpose
One or two sentences: why this service exists and what it provides to the rest of the stack.

## Start

\`\`\`bash
<exact command, runnable from project root>
\`\`\`

## Health check

\`\`\`bash
curl http://127.0.0.1:<N>/health
\`\`\`

## Environment

| Var | Source | Required |
|---|---|---|
| `EXAMPLE_KEY` | Doppler | yes |

## Dependencies
- `<other-service>` — why this one depends on it

## Known issues
- (none)

## Fallback
What to do if this service is down.
```

- [ ] **Step 2: Create the SERVICES.md registry**

Write file `docs/SERVICES.md` with this exact content:

```markdown
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
  health-dashboard:
    port: 5175
    bind: 127.0.0.1
    process: node
    entry: health-dashboard/
    cwd: .
    health: http://127.0.0.1:5175/
    start: cd health-dashboard && npm run dev
    role: Vite dev server — health dashboard v5
    depends_on: [shadow-api]
    status: up
    owner: shadow-stack
    detail: services/health-dashboard.md
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
| 5 | health-dashboard | :5175 | shadow-stack | ✅ up | Vite dev server |
| 6 | ollama | :11434 | system | ✅ up | Local LLM runtime |
| 7 | omniroute | :20128 | agent-factory | ✅ up | Unified cloud cascade (30 models) |
| 8 | free-models-proxy | :20129 | shadow-stack | ✅ up | Proxy backend (18 models) |
| 9 | chromadb | :8000 | shadow-stack | 🔴 broken | v1/v2 API mismatch |

## How to edit

1. Edit YAML frontmatter above for structural changes (port, owner, depends_on, status).
2. Edit or create `docs/services/<name>.md` for per-service details.
3. Commit — pre-commit hook validates YAML frontmatter via `scripts/validate-state.sh`.

## Notes

- `owner` values `shadow-stack` and `agent-factory` refer to subdirectories of the monorepo, not separate repos.
- A service with `status: broken` is present in the stack but has a known blocker documented in `known_issue`.
- `depends_on` is informational only at v1 — no auto-ordered startup yet.
```

- [ ] **Step 3: Validate SERVICES.md parses**

Run:
```bash
bash scripts/validate-state.sh
```
Expected: `✅ .state/ valid` (includes SERVICES.md frontmatter check).

- [ ] **Step 4: Commit**

Run:
```bash
git add docs/SERVICES.md docs/services/_template.md
git commit -m "feat(docs): services registry with 9 services (SERVICES.md + template)"
```
Expected: commit succeeds through pre-commit hook.

---

## Task 12: Create 9 per-service detail pages

**Why:** Each service gets its own page following the template. Per spec §11, detail pages are shell-level at v1 — they fill in the fields, later tasks flesh them out.

**Files (9 new files):**
- `docs/services/shadow-api.md`
- `docs/services/shadow-router.md`
- `docs/services/telegram-bot.md`
- `docs/services/zeroclaw.md`
- `docs/services/health-dashboard.md`
- `docs/services/ollama.md`
- `docs/services/omniroute.md`
- `docs/services/free-models-proxy.md`
- `docs/services/chromadb.md`

- [ ] **Step 1: Create `docs/services/shadow-api.md`**

Content:
```markdown
---
service: shadow-api
port: 3001
status: up
---

# shadow-api

**Port:** `:3001` · **Owner:** shadow-stack · **Entry:** `server/index.js`

## Purpose
Main Express API. Exposes `/health`, `/ram` (RAM guard for Mac mini M1 constraints), metrics, and forwards `/api/cascade` requests to OmniRoute.

## Start

\`\`\`bash
node server/index.js
\`\`\`

## Health check

\`\`\`bash
curl http://127.0.0.1:3001/health
curl http://127.0.0.1:3001/ram
\`\`\`

## Environment

| Var | Source | Required |
|---|---|---|
| `PORT` | .env | no (default 3001) |
| `TELEGRAM_BOT_TOKEN` | Doppler | for alerts |

## Dependencies
- none (root of the stack)

## Known issues
- (none)

## Fallback
If down, ZeroClaw `/ram` endpoint can be used as a weaker substitute for RAM checks. Health dashboard will show all other services as unknown until shadow-api is back.
```

- [ ] **Step 2: Create `docs/services/shadow-router.md`**

Content:
```markdown
---
service: shadow-router
port: 3002
status: stopped
---

# shadow-router

**Port:** `:3002` · **Owner:** shadow-stack · **Entry:** `server/shadow-router.cjs`

## Purpose
Playwright CDP router — connects to Chrome via `--remote-debugging-port=9222` and dispatches browser-based tasks (claude/chatgpt/gemini/grok web UIs). On-demand only, not in default startup set.

## Start

\`\`\`bash
# Chrome must be running with CDP first:
open -a "Google Chrome" --args --remote-debugging-port=9222
node server/shadow-router.cjs
\`\`\`

## Health check

\`\`\`bash
curl http://127.0.0.1:3002/health
\`\`\`

## Environment

| Var | Source | Required |
|---|---|---|
| `CHROME_CDP_PORT` | env | no (default 9222) |

## Dependencies
- Chrome with CDP on `:9222`
- `server/lib/ram-guard` (rejects if free RAM < 400MB)

## Known issues
- Pages must be closed after each request to save RAM.

## Fallback
If shadow-router is unavailable or CDP fails, switch to OmniRoute `:20128` for model calls (no browser access, but lower RAM).
```

- [ ] **Step 3: Create `docs/services/telegram-bot.md`**

Content:
```markdown
---
service: telegram-bot
port: 4000
status: up
---

# telegram-bot

**Port:** `:4000` · **Owner:** shadow-stack · **Entry:** `bot/opencode-telegram-bridge.cjs`

## Purpose
Telegram bridge for the whole stack. Handles long-polling from `@shadowzzero_bot`, dispatches commands to ZeroClaw/shadow-api/OmniRoute. Also exposes `/state`, `/todo`, `/session` for portable state layer access.

## Start

\`\`\`bash
PORT=4000 node bot/opencode-telegram-bridge.cjs
\`\`\`

## Health check

\`\`\`bash
curl http://127.0.0.1:4000/health
\`\`\`

## Environment

| Var | Source | Required |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Doppler | yes |
| `TELEGRAM_CHAT_ID` | Doppler | yes |
| `TELEGRAM_ALLOWED_USERS` | Doppler | yes |

## Dependencies
- zeroclaw (:4111) — for `/task`, `/code`, `/ai` dispatch
- omniroute (:20128) — for direct LLM calls

## Known issues
- Polling 409 Conflict if webhook is active — run `deleteWebhook` first.

## Fallback
If Telegram API is down, bot becomes a no-op until API recovers.
```

- [ ] **Step 4: Create `docs/services/zeroclaw.md`**

Content:
```markdown
---
service: zeroclaw
port: 4111
status: up
---

# zeroclaw

**Port:** `:4111` · **Owner:** agent-factory · **Entry:** `agent-factory/server/zeroclaw/control-center.cjs`

## Purpose
Telegram Control Center (Phase R0 target). Dispatches tasks from Telegram to specific agents (claude-code, opencode, pi-coder, autoresearch). Falls back through OmniRoute when a CLI agent's usage is exhausted. Also serves as a lightweight local Ollama shortcut.

## Start

\`\`\`bash
cd agent-factory && node server/zeroclaw/control-center.cjs
\`\`\`

## Health check

\`\`\`bash
curl http://127.0.0.1:4111/health
curl -X POST http://127.0.0.1:4111/dispatch -d '{"cmd":"/ai","text":"ping"}' -H 'Content-Type: application/json'
\`\`\`

## Environment

| Var | Source | Required |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Doppler | yes |
| `TELEGRAM_ALLOWED_USERS` | Doppler | yes |
| `OMNIROUTER_API_KEY` | Doppler | yes |

## Dependencies
- ollama (:11434) — local-first shortcut
- omniroute (:20128) — fallback cascade
- telegram-bot (:4000) — upstream bridge

## Known issues
- R0 control-center is target state; the `:4111` daemon currently runs in a minimal form.

## Fallback
If zeroclaw is down, telegram-bot degrades to direct OmniRoute calls without agent dispatch.
```

- [ ] **Step 5: Create `docs/services/health-dashboard.md`**

Content:
```markdown
---
service: health-dashboard
port: 5175
status: up
---

# health-dashboard

**Port:** `:5175` · **Owner:** shadow-stack · **Entry:** `health-dashboard/`

## Purpose
Vite dev server rendering the Health Dashboard v5 (9 tabs per CLAUDE.md hard constraints). Shows RAM, services, providers, logs, state machine, phases, integrations.

## Start

\`\`\`bash
cd health-dashboard && npm run dev
\`\`\`

## Health check

\`\`\`bash
curl http://127.0.0.1:5175/
\`\`\`

## Environment

| Var | Source | Required |
|---|---|---|
| `VITE_API_URL` | .env | no (default http://localhost:3001) |

## Dependencies
- shadow-api (:3001) — data source for all tabs

## Known issues
- Dev-only; not deployed anywhere (Vercel explicitly forbidden per CLAUDE.md).

## Fallback
Static JSON snapshots in `data/` can be used offline.
```

- [ ] **Step 6: Create `docs/services/ollama.md`**

Content:
```markdown
---
service: ollama
port: 11434
status: up
---

# ollama

**Port:** `:11434` · **Owner:** system · **Entry:** system install

## Purpose
Local LLM runtime. On M1 8GB, runs small models only: `qwen2.5-coder:3b`, `llama3.2:3b`, `phi3:mini`. Accessed by ZeroClaw as local-first shortcut and by `free-models-proxy` as fallback.

## Start

\`\`\`bash
ollama serve
\`\`\`

## Health check

\`\`\`bash
curl http://127.0.0.1:11434/
curl http://127.0.0.1:11434/api/ps
\`\`\`

## Environment
None required.

## Dependencies
- none

## Known issues
- `qwen2.5:7b` takes 7.6GB RAM — only load when `free_mb > 6000`.
- Cloud models (`:671b-cloud`, `:480b-cloud`) require cloud endpoint, not local.
- Models persist in RAM unless `keep_alive: 0` is passed.

## Fallback
Cloud providers via OmniRoute `:20128` (Kiro/Groq/OpenRouter/Mistral).
```

- [ ] **Step 7: Create `docs/services/omniroute.md`**

Content:
```markdown
---
service: omniroute
port: 20128
status: up
---

# omniroute

**Port:** `:20128` · **Owner:** agent-factory · **Entry:** `agent-factory/server/omniroute`

## Purpose
Unified cloud LLM cascade. Exposes OpenAI-compatible `/v1/models` and `/v1/chat/completions` over 30 models: Kiro Sonnet (OAuth), Groq (7), OpenRouter (auto), Mistral (4), HuggingFace (5). Backed by `free-models-proxy` for model resolution.

## Start

\`\`\`bash
cd agent-factory && node server/omniroute
\`\`\`

## Health check

\`\`\`bash
curl http://127.0.0.1:20128/v1/models | jq '.data | length'
\`\`\`

## Environment

| Var | Source | Required |
|---|---|---|
| `KIRO_TOKEN` | Doppler | yes |
| `GROQ_API_KEY` | Doppler | yes |
| `OPENROUTER_API_KEY` | Doppler | yes |
| `MISTRAL_API_KEY` | Doppler | yes |

## Dependencies
- free-models-proxy (:20129) — backend resolver

## Known issues
- After restart, provider cache is lost — wait for ModelSync.
- Node 22 required (nvm use 22).

## Fallback
Direct call to `free-models-proxy :20129` bypasses OmniRoute's routing layer.
```

- [ ] **Step 8: Create `docs/services/free-models-proxy.md`**

Content:
```markdown
---
service: free-models-proxy
port: 20129
status: up
---

# free-models-proxy

**Port:** `:20129` · **Owner:** shadow-stack · **Entry:** `server/free-models-proxy.cjs`

## Purpose
OpenAI-compatible proxy fronting 18 free/cheap models with cascade fallback: Groq → Mistral → OpenRouter → Zen → Ollama. Acts as the backend resolver for OmniRoute and as an independent cascade endpoint for anything else.

## Start

\`\`\`bash
node server/free-models-proxy.cjs
\`\`\`

## Health check

\`\`\`bash
curl http://127.0.0.1:20129/v1/models | jq '.data | length'
\`\`\`

## Environment

| Var | Source | Required |
|---|---|---|
| `GROQ_API_KEY` | Doppler | yes |
| `MISTRAL_API_KEY` | Doppler | yes |
| `OPENROUTER_API_KEY` | Doppler | yes |
| `ZEN_API_KEY` | Doppler | optional (rate-limited anyway) |

## Dependencies
- ollama (:11434) — final fallback

## Known issues
- HuggingFace provider removed at v1 (requires API key not in Doppler yet).
- Zen rate-limited frequently.
- Mistral key in Doppler is expired, works only intermittently.

## Fallback
Direct provider calls (Groq SDK, etc.) bypass this layer.
```

- [ ] **Step 9: Create `docs/services/chromadb.md`**

Content:
```markdown
---
service: chromadb
port: 8000
status: broken
---

# chromadb

**Port:** `:8000` · **Owner:** shadow-stack · **Entry:** python venv at `.venv/`

## Purpose
Vector memory store for `scripts/memory-mcp.js`. Persistent storage of embeddings generated by `nomic-embed-text` via Ollama. Intended to back Phase R3 (Notebook LLM) and R4 (Supermemory namespaces).

## Start

\`\`\`bash
source .venv/bin/activate
chroma run --path memory/shadow_memory --port 8000
\`\`\`

## Health check

\`\`\`bash
curl http://127.0.0.1:8000/api/v2/heartbeat
\`\`\`

## Environment

| Var | Source | Required |
|---|---|---|
| `CHROMA_URL` | env | no (default http://localhost:8000) |
| `CHROMA_COLLECTION` | env | no (default shadow-stack-memory) |

## Dependencies
- ollama (:11434) — for nomic-embed-text embeddings
- python 3.14 in `.venv` with chromadb 1.5.5

## Known issues
- **BLOCKER**: `scripts/chroma.js` uses `/api/v1/` endpoints, ChromaDB 1.5.5 requires `/api/v2/`. Until fixed, `memory-mcp.js` `smartStore`/`smartRetrieve` return empty.
- Blocks: memory layer, Ralph Loop.

## Fallback
Use markdown-based notebooks (`notebooks/`) and the Claude Code global auto-memory system (`~/.claude/projects/.../memory/`) as substitutes.
```

- [ ] **Step 10: Verify all 9 files created and validator still passes**

Run:
```bash
ls docs/services/
bash scripts/validate-state.sh
```
Expected: 10 files listed (9 services + `_template.md`). Validator prints `✅ .state/ valid`.

- [ ] **Step 11: Commit**

Run:
```bash
git add docs/services/
git commit -m "feat(docs): per-service detail pages for all 9 services"
```
Expected: commit succeeds.

---

## Task 13: Create 4 runtime adapter docs in `.state/runtimes/`

**Why:** Each runtime's integration mechanism is documented so a human (or future agent) can set it up. Per spec §10.

**Files:**
- Create: `.state/runtimes/claude-code.md`
- Create: `.state/runtimes/opencode.md`
- Create: `.state/runtimes/zeroclaw.md`
- Create: `.state/runtimes/telegram.md`

- [ ] **Step 1: Create `.state/runtimes/claude-code.md`**

Content:
```markdown
# Runtime Adapter — Claude Code

## Read mechanism
`CLAUDE.md` in project root (see Task 15) begins with a header that instructs Claude to read `.state/current.yaml`, `.state/todo.md`, and `.state/session.md` before anything else. Claude uses its built-in Read tool.

## Write mechanism
Claude uses Write/Edit tools directly on `.state/*` files. No harness required.

## Lock handling
Claude reads `lock_until` from `current.yaml`. If held by another runtime and not expired, Claude asks the user in conversation whether to proceed (and overwrite the lock).

## Session open
1. Read `.state/current.yaml`
2. Check lock
3. Update `active_runtime: claude-code`, bump `lock_until`, append to `session.runtime_history`
4. Append `## HH:MM · claude-code · runtime_open` event to `.state/session.md`
5. Save `current.yaml`

## During session
- When plan step advances, update `current.yaml:plan.step` and append `plan_step_advance` event.
- When handoff.md is edited, append `handoff_updated` event.
- Todo changes are made by editing `.state/todo.md` directly (no internal copy).

## Session close
- Append `## HH:MM · claude-code · runtime_close` event to `session.md`
- `git add .state/ && git commit -m "state: claude-code session end at HH:MM"` if `auto_commit_state: true`
- Set `lock_until = now` to release
```

- [ ] **Step 2: Create `.state/runtimes/opencode.md`**

Content:
```markdown
# Runtime Adapter — OpenCode

## Read mechanism
`opencode.json` (Task 17) contains an `instructions` field that references `.state/current.yaml` as the first file to read. OpenCode's session system prompt surfaces this automatically.

## Write mechanism
OpenCode uses its bash tool to run `bash -c "..." > .state/session.md` style appends, and direct file writes for `current.yaml` and `todo.md`.

## Lock handling
When OpenCode starts a session, it reads `current.yaml` and warns in its first message if lock is held by another runtime.

## Session open
Same sequence as claude-code.md, substituting `opencode` for `claude-code`.

## During session
- OpenCode commits at each logical checkpoint (matches existing workflow from handoffs).
- Every commit should append a `git_commit` event to `session.md` (can be automated via post-commit hook in a later phase).

## Session close
Same as claude-code.md.
```

- [ ] **Step 3: Create `.state/runtimes/zeroclaw.md`**

Content:
```markdown
# Runtime Adapter — ZeroClaw

## Read mechanism
`agent-factory/server/zeroclaw/control-center.cjs` (Phase R0.2 work, not this plan) will parse `.state/current.yaml` at startup using `js-yaml`. It also parses `docs/SERVICES.md` YAML frontmatter for service dispatch and the `/agents` / `/status` commands.

## Write mechanism
CJS code:
\`\`\`js
const fs = require('fs');
const yaml = require('js-yaml');
const state = yaml.load(fs.readFileSync('.state/current.yaml', 'utf8'));
// mutate...
fs.writeFileSync('.state/current.yaml', yaml.dump(state));
fs.appendFileSync('.state/session.md', \`\n## \${hhmm} · zeroclaw · \${event}\n\`);
\`\`\`

## Lock handling
ZeroClaw rejects `/task` Telegram commands if lock is held by a runtime other than `zeroclaw` OR `telegram`. User can force with `/task --force`.

## Session open
ZeroClaw's daemon is long-running, so "session open" happens once at daemon start. Each `/task` command is a sub-session and appends its own `task_dispatched` event.

## During session
- Every `/task <description>` command appends an event to `session.md`.
- Usage tracker writes `fallback_fired` events when a CLI agent's usage is exhausted and the request falls back to OmniRoute.

## Session close
ZeroClaw runs until SIGTERM. On shutdown (handled by signal trap in `control-center.cjs`), it appends `runtime_close` and releases any lock it held.
```

- [ ] **Step 4: Create `.state/runtimes/telegram.md`**

Content:
```markdown
# Runtime Adapter — Telegram bot

## Read mechanism
The bot (`bot/opencode-telegram-bridge.cjs`, Task 19) is a thin layer over ZeroClaw's HTTP API on `:4111`. For state-layer access, it also reads `.state/*` files directly via Node `fs` — this is added in Task 19.

## Write mechanism
Direct file writes (`fs.writeFileSync`, `fs.appendFileSync`) for `.state/todo.md` and `.state/session.md`. Never mutates `current.yaml` directly (only via ZeroClaw).

## Commands (added in Task 19)
- `/state` — pretty-prints the key fields from `.state/current.yaml`
- `/todo` — shows current `.state/todo.md`; `/todo add <text>` appends an item
- `/session tail 10` — shows last 10 events from `.state/session.md`

## Lock handling
Read-mostly. For write operations (`/todo add`), it appends to `todo.md` without touching `current.yaml` locks.

## Session open / close
The bot is long-running. It does not open/close sessions per se — each command is logged with a `telegram_command` event appended to `session.md`.
```

- [ ] **Step 5: Verify and commit**

Run:
```bash
ls .state/runtimes/
bash scripts/validate-state.sh
git add .state/runtimes/
git commit -m "feat(state): runtime adapter docs for claude-code/opencode/zeroclaw/telegram"
```
Expected: 4 files listed, validator passes, commit succeeds.

---

## Task 14: Prepend state-layer header to `CLAUDE.md`

**Why:** This is what makes Claude Code actually read `.state/current.yaml` on open. Minimal intrusion (7 lines).

**Files:**
- Modify: `CLAUDE.md` (prepend header block above existing content)

- [ ] **Step 1: Read current CLAUDE.md first line to locate insertion point**

Run:
```bash
head -5 CLAUDE.md
```
Expected: existing content visible (first line is probably `# CLAUDE.md — Shadow Stack Local v6.0` or similar).

- [ ] **Step 2: Prepend the header block**

Create a temporary file with the new header plus the old content, then replace CLAUDE.md.

Run:
```bash
cat > /tmp/claude-md-header.txt <<'HEADER_EOF'
# Portable State Layer — READ FIRST

**Before anything else in this project, read these files in order:**

1. `.state/current.yaml` — active plan, session, lock, git state (YAML).
2. `.state/todo.md` — shared todos across all runtimes (markdown checklist).
3. `.state/session.md` — live append-only log of current session. Append a `## HH:MM · claude-code · <event>` line at each milestone.
4. `handoff.md` — last cross-session handoff (in project root).
5. `docs/SERVICES.md` — service registry (ports, owners, health URLs, fallback).

**When finishing work in this project:** append a `runtime_close` event to `.state/session.md` and commit `.state/` if `git.auto_commit_state: true` in `current.yaml`.

**If another runtime holds the lock** (see `.state/current.yaml:lock_until`), ask the user before proceeding.

---

HEADER_EOF

cat /tmp/claude-md-header.txt CLAUDE.md > /tmp/claude-md-new.txt
mv /tmp/claude-md-new.txt CLAUDE.md
rm /tmp/claude-md-header.txt
```

- [ ] **Step 3: Verify the header is in place**

Run:
```bash
head -20 CLAUDE.md
```
Expected: first line is `# Portable State Layer — READ FIRST`, followed by the 5-step list.

- [ ] **Step 4: Verify the original content is still there**

Run:
```bash
grep -c "PROJECT OVERVIEW" CLAUDE.md
grep -c "AGENT PERMISSIONS" CLAUDE.md
```
Expected: both return `1` (original sections still present).

- [ ] **Step 5: Commit**

Run:
```bash
git add CLAUDE.md
git commit -m "docs(claude): prepend portable state layer header to CLAUDE.md"
```
Expected: commit succeeds.

---

## Task 15: Prepend identical header to `AGENTS.md`

**Why:** Any agent (including non-Claude ones that read `AGENTS.md` per convention) gets the same instructions.

**Files:**
- Modify: `AGENTS.md` (prepend same header)

- [ ] **Step 1: Verify AGENTS.md exists**

Run:
```bash
ls AGENTS.md && head -3 AGENTS.md
```
Expected: file exists, content visible.

- [ ] **Step 2: Prepend the same header block**

Run:
```bash
cat > /tmp/agents-md-header.txt <<'HEADER_EOF'
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

HEADER_EOF

cat /tmp/agents-md-header.txt AGENTS.md > /tmp/agents-md-new.txt
mv /tmp/agents-md-new.txt AGENTS.md
rm /tmp/agents-md-header.txt
```

- [ ] **Step 3: Verify**

Run:
```bash
head -15 AGENTS.md
```
Expected: same header as CLAUDE.md, existing content preserved below.

- [ ] **Step 4: Commit**

Run:
```bash
git add AGENTS.md
git commit -m "docs(agents): prepend portable state layer header to AGENTS.md"
```
Expected: commit succeeds.

---

## Task 16: Add state-layer pointer to `opencode.json`

**Why:** OpenCode reads `opencode.json` at session start; adding an `instructions` field (or updating an existing one) injects the state-layer protocol into its system prompt.

**Files:**
- Modify: `/Users/work/.config/opencode/opencode.json`

**Note:** This file lives in user config, not the repo. It was fixed in the previous session (handoff 2026-04-04b). We add one field, do not touch providers.

- [ ] **Step 1: Back up current opencode.json**

Run:
```bash
cp /Users/work/.config/opencode/opencode.json /Users/work/.config/opencode/opencode.json.bak-state-layer
ls -la /Users/work/.config/opencode/opencode.json*
```
Expected: backup created alongside the original.

- [ ] **Step 2: Inspect current structure**

Run:
```bash
python3 -c "import json; d=json.load(open('/Users/work/.config/opencode/opencode.json')); print(list(d.keys()))"
```
Expected: list of top-level keys. Note whether `instructions` already exists.

- [ ] **Step 3: Add or append instructions field**

Run:
```bash
python3 <<'PY'
import json
p = '/Users/work/.config/opencode/opencode.json'
d = json.load(open(p))
preamble = (
    "PORTABLE STATE LAYER — read first in any shadow-stack_local_1 session: "
    ".state/current.yaml (active plan/session/lock/git), .state/todo.md (shared todos), "
    ".state/session.md (append `## HH:MM · opencode · <event>` at milestones), "
    "handoff.md, docs/SERVICES.md. On session end append runtime_close event "
    "and commit .state/ if git.auto_commit_state is true."
)
existing = d.get('instructions')
if isinstance(existing, str) and 'PORTABLE STATE LAYER' not in existing:
    d['instructions'] = preamble + "\n\n" + existing
elif not existing:
    d['instructions'] = preamble
else:
    print("instructions already contains state layer preamble, skipping")
json.dump(d, open(p, 'w'), indent=2)
print("✅ opencode.json updated")
PY
```
Expected: `✅ opencode.json updated` OR `instructions already contains state layer preamble, skipping`.

- [ ] **Step 4: Validate JSON is still valid**

Run:
```bash
python3 -c "import json; json.load(open('/Users/work/.config/opencode/opencode.json')); print('✅ valid JSON')"
```
Expected: `✅ valid JSON`.

- [ ] **Step 5: No git commit — this file is not in the repo**

Note this change in the handoff (Task 21).

---

## Task 17: Write failing tests for bot state-reading helpers

**Why:** TDD for the bot extension. The helpers are pure (read files, format strings), so they are testable without Telegram.

**Files:**
- Create: `tests/bot/test-state-helpers.cjs`

- [ ] **Step 1: Ensure `js-yaml` is available**

Run:
```bash
node -e "console.log(require.resolve('js-yaml'))" 2>&1
```
If this prints a path → already installed, proceed to step 2.
If it errors → run `npm install js-yaml --save` and retry.

- [ ] **Step 2: Create test directory**

Run:
```bash
mkdir -p tests/bot
```

- [ ] **Step 3: Write the test file**

Write file `tests/bot/test-state-helpers.cjs` with this exact content:

```javascript
// tests/bot/test-state-helpers.cjs
// Tests the state-reading helpers used by the telegram bot.
// Uses built-in assert — no test framework.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  readCurrentState,
  formatStateMessage,
  readTodos,
  tailSession,
} = require('../../bot/state-helpers.cjs');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'state-helpers-'));
const stateDir = path.join(tmp, '.state');
fs.mkdirSync(stateDir, { recursive: true });

// Fixture: current.yaml
fs.writeFileSync(
  path.join(stateDir, 'current.yaml'),
  `version: 1
project: test-proj
updated: 2026-04-04T22:00:00Z
active_runtime: claude-code
plan:
  file: docs/plans/p.md
  phase: R0
  step: R0.0
  next: R0.1
session:
  file: .state/session.md
  started: 2026-04-04T22:00:00Z
handoff:
  file: handoff.md
git:
  branch: feat/test
  last_commit: abc1234
  auto_commit_state: true
`
);

fs.writeFileSync(
  path.join(stateDir, 'todo.md'),
  '# Todos\n\n- [x] done\n- [ ] pending\n'
);

fs.writeFileSync(
  path.join(stateDir, 'session.md'),
  [
    '# Session 2026-04-04',
    '',
    '## 22:00 · claude-code · runtime_open',
    'bootstrap',
    '',
    '## 22:15 · claude-code · plan_step_advance',
    'R0.0',
    '',
    '## 22:30 · opencode · git_commit',
    'abc1234',
  ].join('\n')
);

// Test 1: readCurrentState returns parsed object with expected fields
{
  const state = readCurrentState(tmp);
  assert.strictEqual(state.project, 'test-proj');
  assert.strictEqual(state.active_runtime, 'claude-code');
  assert.strictEqual(state.plan.step, 'R0.0');
  console.log('  ✅ readCurrentState parses YAML');
}

// Test 2: readCurrentState returns null when file missing
{
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'empty-'));
  const state = readCurrentState(empty);
  assert.strictEqual(state, null);
  fs.rmSync(empty, { recursive: true, force: true });
  console.log('  ✅ readCurrentState returns null when missing');
}

// Test 3: formatStateMessage contains key fields
{
  const state = readCurrentState(tmp);
  const msg = formatStateMessage(state);
  assert.ok(msg.includes('test-proj'));
  assert.ok(msg.includes('claude-code'));
  assert.ok(msg.includes('R0.0'));
  assert.ok(msg.includes('abc1234'));
  console.log('  ✅ formatStateMessage includes project/runtime/step/commit');
}

// Test 4: formatStateMessage handles null
{
  const msg = formatStateMessage(null);
  assert.ok(msg.includes('not found'));
  console.log('  ✅ formatStateMessage handles null');
}

// Test 5: readTodos returns file contents
{
  const todos = readTodos(tmp);
  assert.ok(todos.includes('- [x] done'));
  assert.ok(todos.includes('- [ ] pending'));
  console.log('  ✅ readTodos returns file contents');
}

// Test 6: tailSession returns last N event headings
{
  const tail = tailSession(tmp, 2);
  assert.ok(tail.includes('plan_step_advance'));
  assert.ok(tail.includes('git_commit'));
  assert.ok(!tail.includes('runtime_open'));
  console.log('  ✅ tailSession returns last 2 events');
}

// Test 7: tailSession with n larger than available returns all
{
  const tail = tailSession(tmp, 100);
  assert.ok(tail.includes('runtime_open'));
  assert.ok(tail.includes('plan_step_advance'));
  assert.ok(tail.includes('git_commit'));
  console.log('  ✅ tailSession caps at available count');
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log('');
console.log('All tests passed.');
```

- [ ] **Step 4: Run the test — expect failure because `bot/state-helpers.cjs` does not exist**

Run:
```bash
node tests/bot/test-state-helpers.cjs
```
Expected: fails with `Cannot find module '../../bot/state-helpers.cjs'`. This is the expected TDD red state.

- [ ] **Step 5: No commit — implement in Task 18**

---

## Task 18: Implement `bot/state-helpers.cjs` to make tests pass

**Why:** Minimal implementation of the 4 helper functions used by the test file. These become the primitives for the `/state`, `/todo`, `/session` bot commands in Task 19.

**Files:**
- Create: `bot/state-helpers.cjs`

- [ ] **Step 1: Write the helpers**

Write file `bot/state-helpers.cjs` with this exact content:

```javascript
// bot/state-helpers.cjs
// Pure helpers that read .state/ files for the telegram bot.
// No Telegram dependency — takes project root as parameter for testability.

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function stateDirOf(projectRoot) {
  return path.join(projectRoot, '.state');
}

function readCurrentState(projectRoot) {
  const file = path.join(stateDirOf(projectRoot), 'current.yaml');
  if (!fs.existsSync(file)) return null;
  try {
    return yaml.load(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return null;
  }
}

function formatStateMessage(state) {
  if (!state) return '❌ .state/current.yaml not found or invalid';
  const lines = [
    `📍 Project: ${state.project || '?'}`,
    `🏃 Runtime: ${state.active_runtime || 'none'}`,
    `📋 Plan: ${(state.plan && state.plan.phase) || '?'} / ${(state.plan && state.plan.step) || '?'}`,
    `⏭  Next: ${(state.plan && state.plan.next) || '?'}`,
    `🌳 Git: ${(state.git && state.git.branch) || '?'}@${(state.git && state.git.last_commit) || '?'}`,
    `🕐 Updated: ${state.updated || '?'}`,
  ];
  return lines.join('\n');
}

function readTodos(projectRoot) {
  const file = path.join(stateDirOf(projectRoot), 'todo.md');
  if (!fs.existsSync(file)) return '(empty)';
  return fs.readFileSync(file, 'utf8');
}

function tailSession(projectRoot, n) {
  const file = path.join(stateDirOf(projectRoot), 'session.md');
  if (!fs.existsSync(file)) return '(empty)';
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  // Group: each heading `## HH:MM · runtime · event` plus following content until next heading
  const chunks = [];
  let current = null;
  for (const line of lines) {
    if (/^## \d{2}:\d{2} · /.test(line)) {
      if (current) chunks.push(current.join('\n'));
      current = [line];
    } else if (current) {
      current.push(line);
    }
  }
  if (current) chunks.push(current.join('\n'));
  if (chunks.length === 0) return '(no events yet)';
  return chunks.slice(-n).join('\n\n');
}

function appendSessionEvent(projectRoot, runtime, event, body) {
  const file = path.join(stateDirOf(projectRoot), 'session.md');
  const hhmm = new Date().toISOString().slice(11, 16);
  const block = `\n## ${hhmm} · ${runtime} · ${event}\n${body || ''}\n`;
  fs.appendFileSync(file, block);
}

module.exports = {
  readCurrentState,
  formatStateMessage,
  readTodos,
  tailSession,
  appendSessionEvent,
};
```

- [ ] **Step 2: Run tests — all 7 must pass**

Run:
```bash
node tests/bot/test-state-helpers.cjs
```
Expected: 7 ✅ lines, then `All tests passed.`, exit 0.

- [ ] **Step 3: Commit**

Run:
```bash
git add bot/state-helpers.cjs tests/bot/test-state-helpers.cjs
git commit -m "feat(bot): state-helpers.cjs with TDD coverage (7 cases)"
```
Expected: commit succeeds.

---

## Task 19: Wire `/state`, `/todo`, `/session` commands into the bot

**Why:** Makes the state layer reachable from Telegram. Minimum viable wiring — reads from `.state/`, replies with formatted text. `/todo add <text>` writes back.

**Files:**
- Modify: `bot/opencode-telegram-bridge.cjs`

- [ ] **Step 1: Locate where existing commands are dispatched**

Run:
```bash
grep -n "bot.onText\|bot.on('message'\|case '/" bot/opencode-telegram-bridge.cjs | head -20
```
Expected: list of existing command wirings. Note the pattern used (likely `bot.onText(/^\/command/, handler)` or similar).

- [ ] **Step 2: Read the top of the file to find require statements**

Run:
```bash
head -30 bot/opencode-telegram-bridge.cjs
```
Expected: see existing `const X = require(...)` lines. Note the line number after which to insert new requires.

- [ ] **Step 3: Add require for state-helpers at the top of existing requires**

Use Edit to insert after the last existing `require` in the top block:

```javascript
const stateHelpers = require('./state-helpers.cjs');
const PROJECT_ROOT = require('path').resolve(__dirname, '..');
```

(Exact insertion point depends on file contents from step 2. If unsure, put it after the first block of requires, before any non-require statement.)

- [ ] **Step 4: Add three command handlers**

Find a location near other `bot.onText(...)` handlers and add these three handlers. Adapt to the bot library in use (`node-telegram-bot-api` is standard; handler signature is `(msg, match) => ...`):

```javascript
// /state — show current portable state
bot.onText(/^\/state$/, async (msg) => {
  try {
    const state = stateHelpers.readCurrentState(PROJECT_ROOT);
    const text = stateHelpers.formatStateMessage(state);
    await bot.sendMessage(msg.chat.id, '```\n' + text + '\n```', { parse_mode: 'Markdown' });
  } catch (e) {
    await bot.sendMessage(msg.chat.id, '❌ /state failed: ' + e.message);
  }
});

// /todo — show .state/todo.md or add an item with "/todo add <text>"
bot.onText(/^\/todo(?:\s+add\s+(.+))?$/, async (msg, match) => {
  try {
    const addText = match[1];
    if (addText) {
      const fs = require('fs');
      const path = require('path');
      const todoFile = path.join(PROJECT_ROOT, '.state', 'todo.md');
      fs.appendFileSync(todoFile, `\n- [ ] ${addText}\n`);
      stateHelpers.appendSessionEvent(PROJECT_ROOT, 'telegram', 'todo_added', addText);
      await bot.sendMessage(msg.chat.id, `✅ Added: ${addText}`);
    } else {
      const text = stateHelpers.readTodos(PROJECT_ROOT);
      const truncated = text.length > 3500 ? text.slice(0, 3500) + '\n...(truncated)' : text;
      await bot.sendMessage(msg.chat.id, '```\n' + truncated + '\n```', { parse_mode: 'Markdown' });
    }
  } catch (e) {
    await bot.sendMessage(msg.chat.id, '❌ /todo failed: ' + e.message);
  }
});

// /session — tail last N events from .state/session.md (default 10)
bot.onText(/^\/session(?:\s+tail\s+(\d+))?$/, async (msg, match) => {
  try {
    const n = match[1] ? parseInt(match[1], 10) : 10;
    const text = stateHelpers.tailSession(PROJECT_ROOT, n);
    const truncated = text.length > 3500 ? text.slice(0, 3500) + '\n...(truncated)' : text;
    await bot.sendMessage(msg.chat.id, '```\n' + truncated + '\n```', { parse_mode: 'Markdown' });
  } catch (e) {
    await bot.sendMessage(msg.chat.id, '❌ /session failed: ' + e.message);
  }
});
```

If the bot file uses a different library or a switch/case dispatcher, adapt the handler registration accordingly, keeping the logic identical.

- [ ] **Step 5: Syntax-check the file**

Run:
```bash
node --check bot/opencode-telegram-bridge.cjs
```
Expected: no output (syntax OK). If errors → fix and re-check.

- [ ] **Step 6: Quick integration sanity (start bot, then stop)**

Run:
```bash
timeout 5 node bot/opencode-telegram-bridge.cjs 2>&1 | head -20 || true
```
Expected: bot prints its startup logs without crashing. Acceptable if it prints "bot running on :4000" or similar before timeout kills it. If there are require errors for `./state-helpers.cjs` → fix path.

- [ ] **Step 7: Commit**

Run:
```bash
git add bot/opencode-telegram-bridge.cjs
git commit -m "feat(bot): /state /todo /session commands backed by .state/ layer"
```
Expected: commit succeeds.

---

## Task 20: End-to-end verification against spec §18 success criteria

**Why:** Closing the loop — every one of the 12 acceptance criteria from the spec must be checked off.

**Files:** Read-only verification; no writes except `.state/session.md` logging.

- [ ] **Step 1: Verify criterion 1 (vendor commit exists)**

Run:
```bash
git log --oneline | grep -i "vendor agent-factory"
```
Expected: one commit line matches.

- [ ] **Step 2: Verify criterion 2 (agent-factory subdirectory)**

Run:
```bash
ls agent-factory/ | head -5
```
Expected: files present.

- [ ] **Step 3: Verify criterion 3 (current.yaml valid + active_runtime set)**

Run:
```bash
bash scripts/validate-state.sh
python3 -c "import yaml; d=yaml.safe_load(open('.state/current.yaml')); assert d['active_runtime'], 'active_runtime empty'; print('✅ active_runtime =', d['active_runtime'])"
```
Expected: validator passes, active_runtime is printed.

- [ ] **Step 4: Verify criterion 4 (session.md has runtime_open)**

Run:
```bash
grep -c "runtime_open" .state/session.md
```
Expected: ≥ 1.

- [ ] **Step 5: Verify criterion 5 (SERVICES.md frontmatter has 9 services)**

Run:
```bash
python3 <<'PY'
import yaml
content = open('docs/SERVICES.md').read()
end = content.find('\n---', 3)
fm = yaml.safe_load(content[4:end])
assert len(fm['services']) == 9, f"expected 9, got {len(fm['services'])}"
print('✅ 9 services in registry:', list(fm['services'].keys()))
PY
```
Expected: prints `✅ 9 services in registry: [...]`.

- [ ] **Step 6: Verify criterion 6 (per-service pages exist for all 9)**

Run:
```bash
for name in shadow-api shadow-router telegram-bot zeroclaw health-dashboard ollama omniroute free-models-proxy chromadb; do
  [ -f "docs/services/${name}.md" ] && echo "✅ $name" || echo "❌ $name MISSING"
done
```
Expected: 9 ✅ lines.

- [ ] **Step 7: Verify criterion 7 (CLAUDE.md and AGENTS.md have header)**

Run:
```bash
head -1 CLAUDE.md
head -1 AGENTS.md
```
Expected: both print `# Portable State Layer — READ FIRST`.

- [ ] **Step 8: Verify criterion 8 (opencode.json has state layer preamble)**

Run:
```bash
python3 -c "
import json
d = json.load(open('/Users/work/.config/opencode/opencode.json'))
inst = d.get('instructions', '')
assert 'PORTABLE STATE LAYER' in inst, 'missing preamble'
print('✅ opencode.json has state layer preamble')
"
```
Expected: `✅ opencode.json has state layer preamble`.

- [ ] **Step 9: Verify criterion 9 (bot helpers tests pass)**

Run:
```bash
node tests/bot/test-state-helpers.cjs
```
Expected: 7 ✅, `All tests passed.`

- [ ] **Step 10: Verify criterion 10 (scripts are idempotent)**

Run:
```bash
bash scripts/bootstrap-state.sh
bash scripts/bootstrap-state.sh
bash scripts/install-hooks.sh
bash scripts/install-hooks.sh
```
Expected: each invocation succeeds, no errors, no file corruption. `git status --short` afterwards should be empty.

- [ ] **Step 11: Verify criterion 11 (pre-commit hook blocks invalid state)**

Run:
```bash
cp .state/current.yaml /tmp/ok.yaml
echo "this: is: invalid:" >> .state/current.yaml
git add .state/current.yaml
git commit -m "test: should fail" || echo "✅ hook blocked as expected"
cp /tmp/ok.yaml .state/current.yaml
git reset HEAD .state/current.yaml
rm /tmp/ok.yaml
```
Expected: `✅ hook blocked as expected` printed; state restored; no bogus commit.

- [ ] **Step 12: Verify criterion 12 (manual cross-runtime test)**

This is a human-in-the-loop step. Document in session.md for the user to do manually:

```bash
cat >> .state/session.md <<'EOF'

## HH:MM · claude-code · verification_complete
Spec §18 criteria 1-11 automated-verified. Criterion 12 (cross-runtime test):
user should switch to OpenCode, observe that .state/current.yaml and .state/session.md
reflect the claude-code session. Not executable in this plan.
EOF
```
(Replace `HH:MM` with current time.)

- [ ] **Step 13: Run full validator one more time**

Run:
```bash
bash scripts/validate-state.sh
```
Expected: `✅ .state/ valid`.

- [ ] **Step 14: Commit verification log entry**

Run:
```bash
git add .state/session.md
git commit -m "chore(state): end-to-end verification against spec §18"
```
Expected: commit succeeds.

---

## Task 21: Update `handoff.md` and final commit

**Why:** Spec §9.3 requires handoff update at session close. This is the last commit of the plan.

**Files:**
- Modify: `handoff.md` (append section)

- [ ] **Step 1: Append a new section to handoff.md**

Run:
```bash
cat >> handoff.md <<'EOF'

---

## Session 2026-04-04c: Portable State Layer + monorepo merge (R0.0)

**What changed:**
- **Monorepo:** `agent-factory` vendored into `shadow-stack_local_1/agent-factory/` via `git subtree add --squash`. Both previously-separate repos now share one history, one branch, one `.state/`. Source `/Users/work/agent-factory/` remains on disk as backup — move to Trash once monorepo is validated through one real work session.
- **`.state/` layer:** new directory with `current.yaml`, `session.md`, `todo.md`, `runtimes/*.md`. Consumed by all runtimes per spec `docs/superpowers/specs/2026-04-04-portable-state-layer-design.md`.
- **Services registry:** `docs/SERVICES.md` with YAML frontmatter (9 services) + markdown table, plus `docs/services/<name>.md` per service. Registry is read by ZeroClaw and Telegram bot.
- **Scripts:** `scripts/bootstrap-state.sh` (idempotent setup), `scripts/validate-state.sh` (YAML + file checks), `scripts/install-hooks.sh` (installs pre-commit hook). Tests in `tests/state/` and `tests/bot/`.
- **Hooks:** git pre-commit now validates `.state/` and `docs/SERVICES.md` whenever staged changes touch them.
- **Runtime integration:**
  - `CLAUDE.md` and `AGENTS.md` prepended with portable state layer header (5-step read list).
  - `opencode.json` (~/.config/opencode/) gained `instructions` preamble referencing `.state/`.
  - `bot/opencode-telegram-bridge.cjs` gained `/state`, `/todo`, `/session` commands backed by `bot/state-helpers.cjs` (7 unit tests, TDD).
- **Plan moved:** `docs/plan-v2-2026-04-04.md` → `docs/plans/plan-v2-2026-04-04.md`.

**Why this solution:**
- Monorepo eliminates the cross-repo sync problem entirely rather than papering over it with rsync/hooks.
- `.state/` is the only source of truth for active work — the fragmentation between runtimes (Claude Code, OpenCode, ZeroClaw, Telegram) was the real pain point.
- YAML frontmatter in `SERVICES.md` means documentation and runtime consume the same file — no drift possible.
- TDD on `validate-state.sh` and bot helpers because these are the only places with real logic; everything else is configuration and markdown.

**What we did NOT touch:**
- `server/` internals (existing shadow-stack code).
- `server/free-models-proxy.cjs` (already fixed in prior session).
- ChromaDB v1/v2 migration (tracked as blocker in `.state/todo.md`).
- ZeroClaw control-center parsing of `.state/` — that is R0.2, not R0.0.
- `/Users/work/agent-factory/` source directory — left as backup.

**Tests:**
- `bash tests/state/test-validate-state.sh` → 4 cases pass.
- `node tests/bot/test-state-helpers.cjs` → 7 cases pass.
- `bash scripts/validate-state.sh` → `✅ .state/ valid`.
- Pre-commit hook rejection verified manually (invalid YAML blocked).

**Known issues / pitfalls:**
- macOS `com.apple.provenance` attribute can block `rm -rf` on directories created by sandboxed apps; use Finder → Trash (as with `deer-flow` earlier).
- The `git subtree add --squash` flattens agent-factory history — only the vendor commit is visible in `git log` for files under `agent-factory/`. Use `git log --follow` for deeper history if needed.
- `opencode.json` lives in `~/.config/opencode/`, not the repo; changes there are not tracked by git and must be re-applied on a fresh machine. A backup was saved as `opencode.json.bak-state-layer`.
- `.state/current.yaml` `lock_until` is advisory only — two runtimes CAN race each other, they just warn first. Hard enforcement is deferred.
EOF
```

- [ ] **Step 2: Update `.state/current.yaml` plan step to mark R0.0 complete**

Run:
```bash
python3 <<'PY'
import yaml
with open('.state/current.yaml') as f:
    d = yaml.safe_load(f)
d['plan']['step'] = 'R0.1'
d['plan']['next'] = 'R0.2'
d['handoff']['last_updated'] = '2026-04-04T23:00:00Z'
d['updated'] = '2026-04-04T23:00:00Z'
with open('.state/current.yaml', 'w') as f:
    yaml.dump(d, f, default_flow_style=False, sort_keys=False)
print('✅ plan advanced to R0.1')
PY
```
Expected: `✅ plan advanced to R0.1`.

- [ ] **Step 3: Append closing event to session.md**

Run:
```bash
cat >> .state/session.md <<'EOF'

## 23:00 · claude-code · handoff_updated
R0.0 complete. Portable state layer + monorepo merge landed. Next: R0.1 (ZeroClaw config.toml).

## 23:00 · claude-code · plan_step_advance
R0.0 → R0.1

## 23:00 · claude-code · runtime_close
Session end. 21 tasks complete.
EOF
```

- [ ] **Step 4: Final commit**

Run:
```bash
git add handoff.md .state/current.yaml .state/session.md
git commit -m "docs(handoff): R0.0 complete — portable state layer + monorepo merge"
```
Expected: commit succeeds through pre-commit validator.

- [ ] **Step 5: Verify the branch has everything**

Run:
```bash
git log --oneline feat/portable-state-layer | head -30
git status
```
Expected: ~20 commits on the feature branch, status clean.

- [ ] **Step 6: Print final success message**

Run:
```bash
echo ""
echo "════════════════════════════════════════════"
echo "  R0.0 COMPLETE"
echo "════════════════════════════════════════════"
echo "Branch: feat/portable-state-layer"
echo "Commits: $(git rev-list --count main..HEAD 2>/dev/null || git rev-list --count HEAD)"
echo ""
echo "Next: merge feat/portable-state-layer → main branch"
echo "      then begin Phase R0.1 (ZeroClaw config.toml)"
echo "════════════════════════════════════════════"
```
Expected: summary block printed.

---

## Spec Coverage Review (self-check)

Mapping from spec sections to tasks (spec: `docs/superpowers/specs/2026-04-04-portable-state-layer-design.md`):

| Spec § | Requirement | Task |
|---|---|---|
| §1 Context | — (motivation) | — |
| §2 Goals 1-6 | All six goals | Tasks 2, 5, 6, 11, 14-19 |
| §3 Non-goals | Not implemented (by design) | §17 lists them, nothing to do |
| §4 Architecture | File layout | Tasks 2, 4, 5, 11, 12, 13 |
| §5 current.yaml schema | Exact fields | Task 5 (initial), Task 6 (template), Task 21 (update) |
| §6 session.md format | Append-only + regex-parseable | Tasks 5, 18 (tailSession), 19, 20, 21 |
| §7 Events 1-8 | Logged on occurrence | Tasks 5 (1, 4), 18 (appendSessionEvent primitive), 19 (todo_added via telegram), 21 (plan_step_advance, handoff_updated, runtime_close). Events 3, 6, 7, 8 are stubbed per spec §7 — plan intentionally leaves those to a later phase. |
| §8 todo.md format | Markdown checklist | Task 5, Task 6, Task 19 (/todo add) |
| §9 Runtime contract | Open/during/close lifecycle | Task 13 (documentation), Tasks 14-19 (implementation per runtime) |
| §10 4 runtime adapters | 4 MD files | Task 13 |
| §11 SERVICES.md registry | YAML + table + 9 services | Tasks 11, 12 |
| §12 Monorepo merge | git subtree add --squash | Tasks 1, 2, 3 |
| §13 Minimal intrusion | 5 files touched with minimal edits | Tasks 14, 15, 16, 19 |
| §14 Validation | Pre-commit hook | Tasks 7, 8, 9, 10 |
| §15 Bootstrap | bootstrap-state.sh | Task 6 |
| §16 Integration with plan-v2 | R0.0 prefixes R0.1-R0.6 | Task 4 (move plan), Task 21 (mark R0.0 done, advance to R0.1) |
| §17 Non-implementations | Explicitly not done | — (verified by scope check) |
| §18 Success criteria 1-12 | All 12 | Task 20 (each step corresponds to one criterion) |
| §19 Open questions | Not blocking | — |

**Gaps identified during self-review:** Events 3 (git_commit), 6 (ram_critical), 7 (fallback_fired), 8 (service_state_change) are listed in spec §7 but spec itself says "Events 6/7/8 require hooks that don't exist yet — deferred to phase 2 of this spec and stub-logged manually until then". Event 3 (git_commit) could be added via post-commit hook but is out of R0.0 scope. No gap — spec explicitly defers these.

**Placeholder scan:** Searched plan for TBD/TODO/FIXME/XXX/"implement later"/"add appropriate" — none found (the `TODO` tokens that appear are literal task/todo file content, not placeholders).

**Type/signature consistency:** `readCurrentState`, `formatStateMessage`, `readTodos`, `tailSession`, `appendSessionEvent` — names identical in Task 17 tests, Task 18 implementation, Task 19 wiring. No drift.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-04-portable-state-layer.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Required sub-skill: `superpowers:subagent-driven-development`.

**2. Inline Execution** — Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints.

**Which approach?**

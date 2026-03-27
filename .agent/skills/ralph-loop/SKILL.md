# Ralph Loop — Methodology

> Autonomous development cycle for Shadow Stack via OpenCode.

## Core Concept

The agent receives the same high-level prompt each iteration, works on ONE task, verifies results, updates state files, and continues until the completion marker `<promise>DONE</promise>` appears.

## Rules

1. **One task per iteration** — pick the next uncompleted PRD element by risk/dependency priority.
2. **Implement one logical chunk** — no multi-task batching.
3. **Verify immediately** — run `npm run typecheck && npm run lint && npm run test` after every change.
4. **Fix before moving on** — if any check fails, fix in the same iteration.
5. **Update state files** — `progress.txt` and `.agent/decisions.md` must reflect current state.
6. **One small git commit** — atomic commits with clear messages.
7. **Stop condition** — output `<promise>DONE</promise>` ONLY when all PRD items have `passes: true` AND all checks are green.

## PRD Format

Each task in `PRD.md` follows this structure:

```markdown
### T-ID: Title
- **Phase:** X
- **Description:** What to build
- **Depends on:** [list of task IDs]
- **Verify:** `command to run`
- **passes: false
```

Agent changes `passes: false` to `passes: true` only after verify command succeeds.

## Completion Criteria

- All PRD tasks have `passes: true`
- `npm run typecheck` exits 0
- `npm run lint` exits 0
- `npm run test` exits 0
- `npm run smoke` exits 0 (if server is running)
- `git diff --stat` shows expected changes for last task only

## Iteration Template

1. Read `progress.txt` → find next task
2. Read `git diff` → understand current state
3. Write mini-plan in `.agent/decisions.md`
4. Implement ONE change
5. Run verify commands
6. Fix if red
7. Update `progress.txt`
8. Update `PRD.md` (set `passes: true`)
9. Git commit
10. If all done → `<promise>DONE</promise>`

## Modes

- **HITL** (Human In The Loop): One iteration, human reviews before next.
- **AFK** (Away From Keyboard): 5-10 iterations autonomously, stop on `<promise>DONE</promise>` or iteration limit.

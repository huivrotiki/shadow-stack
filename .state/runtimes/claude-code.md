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

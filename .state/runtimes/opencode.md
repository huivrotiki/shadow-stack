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

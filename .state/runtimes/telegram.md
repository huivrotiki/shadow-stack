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

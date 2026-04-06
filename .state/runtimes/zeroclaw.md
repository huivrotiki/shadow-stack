# Runtime Adapter — ZeroClaw

## Read mechanism
`agent-factory/server/zeroclaw/control-center.cjs` (Phase R0.2 work, not this plan) will parse `.state/current.yaml` at startup using `js-yaml`. It also parses `docs/SERVICES.md` YAML frontmatter for service dispatch and the `/agents` / `/status` commands.

## Write mechanism
CJS code:
```js
const fs = require('fs');
const yaml = require('js-yaml');
const state = yaml.load(fs.readFileSync('.state/current.yaml', 'utf8'));
// mutate...
fs.writeFileSync('.state/current.yaml', yaml.dump(state));
fs.appendFileSync('.state/session.md', `\n## ${hhmm} · zeroclaw · ${event}\n`);
```

## Lock handling
ZeroClaw rejects `/task` Telegram commands if lock is held by a runtime other than `zeroclaw` OR `telegram`. User can force with `/task --force`.

## Session open
ZeroClaw's daemon is long-running, so "session open" happens once at daemon start. Each `/task` command is a sub-session and appends its own `task_dispatched` event.

## During session
- Every `/task <description>` command appends an event to `session.md`.
- Usage tracker writes `fallback_fired` events when a CLI agent's usage is exhausted and the request falls back to OmniRoute.

## Session close
ZeroClaw runs until SIGTERM. On shutdown (handled by signal trap in `control-center.cjs`), it appends `runtime_close` and releases any lock it held.

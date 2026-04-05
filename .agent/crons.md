# Shadow Stack — Crons & Heartbeats Registry

Every scheduled task and periodic check lives here. No hidden cron jobs.

## Crons (scheduled)

| name | schedule | command | purpose | owner |
|---|---|---|---|---|
| *(none registered yet — add rows as crons are created)* | | | | |

### How to register a cron

1. Pick a tool: **launchd** (macOS native), **pm2-cron** (process-level), or **node-cron** (in-app).
2. Add a row above with: `name · cron-expression · command · purpose · owner-runtime`.
3. Commit the actual job file alongside this registry:
   - launchd → `~/Library/LaunchAgents/com.shadowstack.<name>.plist`
   - pm2-cron → entry in `ecosystem.config.cjs` with `cron_restart`
   - node-cron → `scripts/crons/<name>.cjs` started by shadow-api
4. Heartbeat each run to `data/heartbeats.jsonl` (see below).

## Heartbeats (liveness signals)

Every long-running service should emit a heartbeat to `data/heartbeats.jsonl` every 60s:

```json
{"ts": 1775373537990, "service": "shadow-api", "pid": 12345, "free_mb": 1024, "status": "ok"}
```

### Required services

| service | port | interval | heartbeat key | owner |
|---|---|---|---|---|
| shadow-api | 3001 | 60s | `shadow-api` | pm2 |
| shadow-bot | 4000 | 60s | `shadow-bot` | pm2 |
| zeroclaw-http | 3001/api/zeroclaw | 60s | `zeroclaw` | shadow-api |
| free-models-proxy | 20129 | 60s | `free-proxy` | standalone |
| ollama | 11434 | 300s | `ollama` | system |

### Heartbeat writer (any runtime)

```js
const fs = require('fs');
const os = require('os');
function heartbeat(service, extra = {}) {
  const line = JSON.stringify({
    ts: Date.now(),
    service,
    pid: process.pid,
    free_mb: Math.round(os.freemem() / 1024 / 1024),
    status: 'ok',
    ...extra,
  });
  fs.appendFileSync('data/heartbeats.jsonl', line + '\n');
}
// call heartbeat('shadow-api') every 60s via setInterval
```

### Heartbeat monitor (Telegram alert)

A single cron (TODO: register it) tails `data/heartbeats.jsonl`, groups by `service`,
and if any required service hasn't reported in > 3 × its interval, sends a Telegram
alert via the bot `/ping` endpoint.

## Rules

- **No silent scheduling.** If it runs periodically, it belongs in this file.
- **Every cron logs to `data/crons.log`** (gitignored).
- **Every heartbeat writes one line to `data/heartbeats.jsonl`** (gitignored, rotates at 10MB).
- **Missed heartbeats trigger alerts**, not restarts. Humans decide what to restart.
- **Crons never hold secrets in their command string** — read from env via Doppler.

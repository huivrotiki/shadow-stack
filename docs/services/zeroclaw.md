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

```bash
cd agent-factory && node server/zeroclaw/control-center.cjs
```

## Health check

```bash
curl http://127.0.0.1:4111/health
curl -X POST http://127.0.0.1:4111/dispatch -d '{"cmd":"/ai","text":"ping"}' -H 'Content-Type: application/json'
```

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

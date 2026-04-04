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

```bash
PORT=4000 node bot/opencode-telegram-bridge.cjs
```

## Health check

```bash
curl http://127.0.0.1:4000/health
```

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

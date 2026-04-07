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

```bash
node server/index.js
```

## Health check

```bash
curl http://127.0.0.1:3001/health
curl http://127.0.0.1:3001/ram
```

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

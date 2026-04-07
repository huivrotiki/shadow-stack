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

```bash
cd health-dashboard && npm run dev
```

## Health check

```bash
curl http://127.0.0.1:5175/
```

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

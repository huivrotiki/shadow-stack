---
service: shadow-router
port: 3002
status: stopped
---

# shadow-router

**Port:** `:3002` · **Owner:** shadow-stack · **Entry:** `server/shadow-router.cjs`

## Purpose
Playwright CDP router — connects to Chrome via `--remote-debugging-port=9222` and dispatches browser-based tasks (claude/chatgpt/gemini/grok web UIs). On-demand only, not in default startup set.

## Start

```bash
# Chrome must be running with CDP first:
open -a "Google Chrome" --args --remote-debugging-port=9222
node server/shadow-router.cjs
```

## Health check

```bash
curl http://127.0.0.1:3002/health
```

## Environment

| Var | Source | Required |
|---|---|---|
| `CHROME_CDP_PORT` | env | no (default 9222) |

## Dependencies
- Chrome with CDP on `:9222`
- `server/lib/ram-guard` (rejects if free RAM < 400MB)

## Known issues
- Pages must be closed after each request to save RAM.

## Fallback
If shadow-router is unavailable or CDP fails, switch to OmniRoute `:20128` for model calls (no browser access, but lower RAM).

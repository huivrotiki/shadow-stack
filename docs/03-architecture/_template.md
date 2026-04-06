---
service: <name>
port: <N>
status: up|down|broken|planned|stopped
---

# <Service Name>

**Port:** `:<N>` · **Owner:** `<owner>` · **Entry:** `<path>`

## Purpose
One or two sentences: why this service exists and what it provides to the rest of the stack.

## Start

```bash
<exact command, runnable from project root>
```

## Health check

```bash
curl http://127.0.0.1:<N>/health
```

## Environment

| Var | Source | Required |
|---|---|---|
| `EXAMPLE_KEY` | Doppler | yes |

## Dependencies
- `<other-service>` — why this one depends on it

## Known issues
- (none)

## Fallback
What to do if this service is down.

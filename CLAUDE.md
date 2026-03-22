# Shadow Stack — CLAUDE.md

## Meta-Escalation Rule

When stuck after 3 retries on any task:

```
metaEscalate("описание проблемы, что пробовал, почему не работает")
```

**Chain:** Perplexity API → GPT-4o (OpenRouter) → Telegram human
**Endpoint:** `POST /api/meta-escalate { "problem": "..." }`
**Telegram:** `/escalate <описание проблемы>`

### When to escalate:
- All providers in fallback cascade failed
- Unknown error after 3 retry attempts
- Build/deploy failure that can't be auto-fixed
- Architecture decision requiring human judgement

### When NOT to escalate:
- Missing env vars (just log the error)
- Known transient errors (429, 5xx — retry handles these)
- Simple validation errors (Zod catches these)

## Project Structure

- Root: Electron + Vite widget (main.cjs, preload.cjs)
- `shadow-stack-widget-1/`: Next.js + Express backend
- Auto-Router: `shadow-stack-widget-1/server/auto-router/`
- Telegram webhook: `shadow-stack-widget-1/app/api/telegram-webhook/route.ts`

## Constraints

- Mac M1 8GB — no Docker
- ESM only, Node 22
- Zero-cost first: Ollama → Antigravity → OpenRouter → paid
- Never hardcode secrets — use `process.env`
- `.env` is in `.gitignore`

## Dev Servers

See `.claude/launch.json` for all configurations.
- Orchestrator: port 3000 (Next.js) + 3001 (Express)
- Telegram Bot: port 4000
- Vite Widget: port 5175
- Auto-Router Diagram: port 5174

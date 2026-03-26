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
- Context overflow (`prompt too large`) — use /clear + reload
- API billing error — check OPENROUTER_API_KEY credits

### When NOT to escalate:
- Missing env vars (just log the error)
- Known transient errors (429, 5xx — retry handles these)
- Simple validation errors (Zod catches these)

## Project Structure

- Root: Electron + Vite widget (main.cjs, preload.cjs)
- `shadow-stack-widget-1/`: Next.js + Express backend
- Auto-Router: `shadow-stack-widget-1/server/auto-router/`
- Telegram webhook: `shadow-stack-widget-1/app/api/telegram-webhook/route.ts`
- Health Dashboard: `health-dashboard/index.html` → deployed to Vercel
- API endpoints: `health-dashboard/api/logs.js`, `health-dashboard/api/metrics.js`
- CI/CD: `.github/workflows/deploy-dashboard.yml`

## Constraints

- Mac M1 8GB — no Docker
- ESM only, Node 22
- Zero-cost first: Ollama → Antigravity → OpenRouter → paid
- Never hardcode secrets — use `process.env`
- `.env` is in `.gitignore`
- Doppler project: **serpent**, config: **dev**
- Vercel project: `prj_Orgqrko5v8qktQBxsiBE8aytcyn4`, org: `team_i0a6gu42TZarDmXcGIgxf5TS`

## Dev Servers

See `.claude/launch.json` for all configurations.
- Orchestrator: port 3000 (Next.js) + 3001 (Express)
- Telegram Bot: port 4000
- Vite Widget: port 5175
- Auto-Router Diagram: port 5174
- OpenClaw Gateway: port 18789

## Session v4.1 — Done (2026-03-26)

- ✅ `health-dashboard/` deployed to Vercel
- ✅ `api/logs.js` + `api/metrics.js` serverless functions created
- ✅ `deploy-dashboard.yml` GitHub Actions workflow (push → Vercel + Telegram)
- ✅ `vercel.json` routing config added
- ✅ Doppler project: serpent/dev (26 secrets)
- ✅ Agent prompts self-upgraded via Ralph Loop (IDENTITY.md + AGENTS.md backup)
- ✅ Dashboard v4.1: Phase 6 CI/CD + new integrations (Comet ML, Claude Code, GitHub Actions)
- ⏳ GitHub Secrets: DOPPLER_TOKEN + VERCEL_TOKEN need to be added manually
- ⏳ Telegram deploy notifications: pending secrets setup

## Context Overflow Recovery

When `prompt too large` error occurs:
1. Run `/clear` in OpenClaw
2. Read this CLAUDE.md for full context
3. Continue from `Session v4.1 — Done` section
4. Next task: verify GitHub Secrets → test push → confirm Telegram notification

## API Billing Recovery

When billing error occurs:
1. Check `doppler secrets --project serpent --config dev | grep API_KEY`
2. Top up OpenRouter credits at openrouter.ai/credits
3. Or switch to Ollama local: `ollama run qwen2.5:7b`

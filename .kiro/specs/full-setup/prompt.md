Read .kiro/steering/shadow-stack.md first.

Recall Supermemory context (call both):
- mcp__mcp-supermemory-ai__recall("shadow stack current state services ports")
- mcp__mcp-supermemory-ai__recall("ecosystem dotenv hardcode PM2 setup")

Then read in order (no skipping):
1. .state/current.yaml → check lock_until
2. .state/todo.md → next open task
3. handoff.md → last known state
4. docs/SERVICES.md → service registry

---

# Mission: Shadow Stack — Full Operational Setup
Runtime: Kiro | Project: ~/shadow-stack_local_1/ | Date: 2026-04-05

## Phase 1 — Secrets & Environment
doppler run --project serpent --config dev -- doppler secrets

Verify ALL present:
- TELEGRAM_BOT_TOKEN
- TELEGRAM_CHAT_ID
- FREE_PROXY_BASE_URL (must be http://localhost:20129/v1)
- FREE_PROXY_API_KEY
- LITELLM_MASTER_KEY
- OPENROUTER_API_KEY
- ANTHROPIC_API_KEY

Missing secret → tell me. Never add it yourself. Hardcode = reject (Rule #2).

## Phase 2 — Fix ecosystem.config.cjs
Current violation: `require('dotenv').config({ path: '/Users/work/...' })` — Rule #2 breach.

Plan:
- Remove dotenv line
- Keep three processes unchanged:
  shadow-api    → server/index.js          (port 3001)
  shadow-bot    → bot/opencode-telegram-bridge.cjs (port 4000)
  litellm-proxy → litellm --model qwen2.5-coder:3b --port 4001
- Keep max_memory_restart: '500M' on each

SHOW PLAN → WAIT FOR MY CONFIRMATION → THEN IMPLEMENT.

## Phase 3 — Launch via PM2
After ecosystem fix:

1. Delete webhook (409 prevention):
doppler run --project serpent --config dev -- node -e "
  const token = process.env.TELEGRAM_BOT_TOKEN;
  require('https').get(
    \`https://api.telegram.org/bot\${token}/deleteWebhook?drop_pending_updates=true\`,
    r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>console.log(d)); }
  );
"

2. Start stack:
doppler run --project serpent --config dev -- pm2 start ecosystem.config.cjs

3. Verify:
pm2 status
pm2 logs shadow-bot --lines 30 --nostream

Expected: all 3 processes online, bot logs show "Bot started".

## Phase 4 — Smoke Tests
curl http://localhost:3001/health
curl http://localhost:3001/ram
curl http://localhost:4000/health
curl http://localhost:20128/health
curl http://localhost:20128/v1/models
curl http://localhost:4111/api/tags
curl http://localhost:4001/health

Expected: 200 OK or { status: "ok" } each.
If any fail → check pm2 logs <name>, describe error, propose fix.

## Phase 5 — Update CLAUDE.md
Add after "Port: :4000" in TELEGRAM BOT section:

```
Script: bot/opencode-telegram-bridge.cjs
PM2 name: shadow-bot
Engine: ZeroClaw (:4111) — движок вызова моделей внутри бота

### PM2 процессы (все три обязательны)
| Name          | Script                            | Port |
|---------------|-----------------------------------|------|
| shadow-api    | server/index.js                   | 3001 |
| shadow-bot    | bot/opencode-telegram-bridge.cjs  | 4000 |
| litellm-proxy | litellm qwen2.5-coder:3b          | 4001 |

### Обязательные секреты (Doppler)
TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
FREE_PROXY_BASE_URL=http://localhost:20129/v1,
FREE_PROXY_API_KEY, LITELLM_MASTER_KEY
```

Then commit:
git add CLAUDE.md ecosystem.config.cjs
git commit -m "fix: remove dotenv hardcode from ecosystem; docs: update TELEGRAM BOT section"

## Phase 6 — Memory & Handoff

1. Store in Supermemory:
mcp__mcp-supermemory-ai__memory(
  "Shadow Stack full setup complete 2026-04-05. Services: shadow-api :3001, shadow-bot :4000, litellm-proxy :4001, OmniRoute :20128, ZeroClaw :4111. ecosystem.config.cjs fixed (dotenv removed). CLAUDE.md TELEGRAM BOT updated."
)

2. Append to .state/session.md:
## HH:MM · Kiro · setup_complete — all 5 services online, ecosystem fixed, CLAUDE.md updated

3. Update handoff.md:
## Handoff 2026-04-05 (Kiro)
Выполнен: полный setup Shadow Stack
Изменения: ecosystem.config.cjs (dotenv убран), CLAUDE.md (TELEGRAM BOT секция)
Сервисы: shadow-api :3001 ✅ shadow-bot :4000 ✅ litellm-proxy :4001 ✅ OmniRoute :20128 ✅ ZeroClaw :4111 ✅
Следующий шаг: OmniRoute prod cascade, health-dashboard в PM2

4. git add .state/ handoff.md
   git commit -m "chore: session state + handoff after full setup"

5. ⚠️ git push — ASK ME FIRST.

---

## Success Checklist
- [ ] pm2 status → 3 processes online
- [ ] shadow-bot logs — нет 409 Conflict
- [ ] curl :20128/v1/models → список моделей
- [ ] curl :4111/api/tags → qwen2.5-coder:3b есть
- [ ] ecosystem.config.cjs — нет dotenv строки
- [ ] CLAUDE.md — TELEGRAM BOT секция обновлена
- [ ] handoff.md — обновлён
- [ ] Supermemory — факты записаны через mcp__mcp-supermemory-ai__memory

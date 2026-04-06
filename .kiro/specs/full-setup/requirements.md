# Full Operational Setup — Requirements

## REQ-1: Secrets validation
WHEN running setup
THE SYSTEM shall verify all required Doppler secrets exist:
TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, FREE_PROXY_BASE_URL,
FREE_PROXY_API_KEY, LITELLM_MASTER_KEY, OPENROUTER_API_KEY, ANTHROPIC_API_KEY
IF any secret is missing THEN notify user, do NOT add it automatically

## REQ-2: ecosystem.config.cjs cleanup
WHEN ecosystem.config.cjs contains hardcoded dotenv path
THE SYSTEM shall remove the `require('dotenv')` line
KEEPING all three PM2 processes intact (shadow-api, shadow-bot, litellm-proxy)
KEEPING max_memory_restart: '500M' on each process

## REQ-3: PM2 stack launch
WHEN ecosystem.config.cjs is clean
THE SYSTEM shall:
1. Delete Telegram webhook (prevent 409)
2. Start stack: doppler run --project serpent --config dev -- pm2 start ecosystem.config.cjs
3. Verify all 3 processes show online in pm2 status

## REQ-4: Smoke tests
WHEN PM2 stack is running
THE SYSTEM shall curl each service and report status:
:3001/health, :3001/ram, :4000/health, :20128/health,
:20128/v1/models, :4111/api/tags, :4001/health

## REQ-5: CLAUDE.md update
WHEN all services are confirmed online
THE SYSTEM shall update TELEGRAM BOT section in CLAUDE.md
THEN commit: ecosystem.config.cjs + CLAUDE.md

## REQ-6: Memory & Handoff
WHEN setup is complete
THE SYSTEM shall:
- Store facts in Supermemory via mcp__mcp-supermemory-ai__memory
- Update .state/session.md (append milestone line)
- Update handoff.md
- Commit .state/ + handoff.md
- ASK USER before git push

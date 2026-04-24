# Shadow Stack v6.0

> Multi-LLM routing + autonomous dev orchestration on Mac mini M1

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│ Telegram Bot │────▶│  Express API │────▶│   Ollama     │
│    :4000     │     │    :3001     │     │   :11434     │
└─────────────┘     └──────┬───────┘     └──────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
     ┌──────────────┐ ┌─────────┐ ┌──────────┐
     │Shadow Router │ │OmniRoute│ │OpenRouter│
     │   :3002      │ │ :20130  │ │  (cloud) │
     │(Playwright)  │ │         │ │          │
     └──────────────┘ └─────────┘ └──────────┘
```

## Services

| Service | Port | File |
|---------|------|------|
| Express API | 3001 | `server/index.js` |
| Shadow Router | 3002 | `server/shadow-router.cjs` |
| Telegram Bot | 4000 | `bot/opencode-telegram-bridge.cjs` |
| Health Dashboard | 5176 | `health-dashboard/index.html` |
| OmniRoute | 20130 | unified cloud cascade |
| Ollama | 11434 | local LLM runtime |

## Quick Start

```bash
# Install dependencies
npm install

# Start all services via PM2
npx pm2 start ecosystem.config.cjs

# Or start manually
node server/index.js &          # API
PORT=4000 node bot/opencode-telegram-bridge.cjs &  # Bot
```

## Routing Cascade

1. **Ollama 3B** (local, free) → qwen2.5:3b
2. **Ollama 7B** (local, free) → qwen2.5:7b
3. **OpenRouter** (cloud) → claude-3-haiku
4. **Claude** (cloud) → claude-3-5-sonnet

Configuration: `zeroclaw.config.json`

## RAM Guard

Mac mini M1 has 8GB RAM. Before browser tasks:

```bash
curl http://localhost:3001/ram
```

- `>400MB` free → all providers available
- `200-400MB` → ollama-3b only, skip browser
- `<200MB` → ABORT

## Key Directories

```
server/          # Express API + routing engine + providers
server/lib/      # Core modules: config, logger, metrics, ram-guard, router-engine
bot/             # Telegram bot (primary control interface)
health-dashboard/ # Terminal-style monitoring UI (9 tabs)
src/widget/      # Extracted from widget-1: AI models, agent cards, telegram commands
scripts/         # Start scripts, smoke tests, Python RALPH loop
docs/            # SQL migrations, integration docs
.agent/skills/   # Agent skill definitions
```

## Secrets

All secrets managed via [Doppler](https://dashboard.doppler.com):

```bash
doppler run --project serpent --config dev -- node server/index.js
```

Never hardcode tokens in source files.

## Development

```bash
npm run dev       # Vite dev server (dashboard)
npm run build     # Production build
npm test          # Run tests
```

## License

Private

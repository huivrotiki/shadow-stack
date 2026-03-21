# Handoff — Shadow Stack Widget v3.2

**Дата:** 2026-03-21
**Stack:** Vite 8 + React 19 + Tailwind v4 + Electron 41 + Node 22

---

## Shadow Stack Steps Status

| Step | Title                     | Status         | Notes                        |
| ---- | ------------------------- | -------------- | ---------------------------- |
| 0    | Разведка и аудит          | ✅ Passed      | System audit complete        |
| 0.5  | Провайдеры и MCP скиллы   | ✅ Passed      | 115 skills, Ollama available |
| 1    | Homebrew, Node.js, Python | ✅ Passed      | Node 22.22.1, Python 3.14.3  |
| 2    | Ollama + модели           | ✅ Passed      | llama3.2:latest              |
| 3    | OpenClaw Agent            | ✅ Passed      | v1.2.27                      |
| 4    | NeMo Agent Toolkit        | ✅ Passed      | nemotoolkit installed        |
| 5    | OpenCode SDK              | ✅ Passed      | @opencode-ai/sdk configured  |
| 6    | Vercel AI SDK v4+         | ✅ Passed      | ai @ai-sdk/openai installed  |
| 7    | Playwright MCP            | ✅ Passed      | playwright ready             |
| 8    | Supabase + pgvector       | ✅ Added to UI | Docker + pgvector            |
| 9    | Langfuse (Docker)         | ✅ Added to UI | docker-compose               |
| 10   | Tailscale VPN             | ✅ Added to UI | Homebrew                     |
| 11   | Telegram Bot              | ✅ Added to UI | node-telegram-bot-api        |

---

## Package Corrections (2026-03-21)

### Step 6 — Fixed

```bash
# Correct packages (v4+)
npm install ai @ai-sdk/openai
```

### Step 7 — Fixed

```bash
# Correct package
npm install -g @playwright/mcp@latest
npx playwright install chromium
```

---

## Commands

```bash
cd ~/shadow-stack-widget

# GUI
npm run start

# Headless
npm run headless -- --step=0
npm run headless -- --all
npm run headless -- --all --debug
```

---

## Debug

```bash
tail -f /tmp/shadow-widget.log
SHADOW_LOG=/path/to/log npm run headless -- --debug
```

---

## Known Issues

1. **concurrently SIGTERM** — запускать Vite и Electron отдельно или через background
2. **Electron в CLI** — не работает с `npm run start` напрямую, используй:
   ```bash
   npm run dev > /dev/null 2>&1 &
   sleep 3 && VITE_DEV_SERVER_URL=http://127.0.0.1:5175 ./node_modules/.bin/electron .
   ```

---

## Ollama Status

- Port: 11434
- Running: `brew services list | grep ollama`
- Models: llama3.2:latest (2.0 GB), qwen3-coder:30b, smollm2:135m

---

## Next Steps (8-11)

### Step 8 — Supabase + pgvector

```bash
# Local Supabase or Docker
docker pull supabase/postgres:15.1.0.117
# Enable pgvector extension
```

### Step 9 — Langfuse (Docker)

```bash
docker run \
  -e DATABASE_URL=postgresql://postgres:postgres@localhost:5432/langfuse \
  -p 3000:3000 \
  ghcr.io/langfuse/langfuse:latest
```

### Step 10 — Tailscale VPN

```bash
brew install --cask tailscale
tailscale up
```

### Step 11 — Telegram Bot

```bash
npm install node-telegram-bot-api
# Configure TG_BOT_TOKEN in .env
```

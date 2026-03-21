# Handoff — Shadow Stack Widget v3.2

**Date:** 2026-03-21
**Stack:** Vite 8 + React 19 + Tailwind v4 + Electron 41 + Node 22

---

## Project Status

| Component  | Status     | Notes                                   |
| ---------- | ---------- | --------------------------------------- |
| Widget GUI | ✅ Running | Port 5175                               |
| Electron   | ✅ Running | PID 41613                               |
| Ollama     | ✅ Running | 6 models installed                      |
| CI/CD      | ✅ Working | Cross-platform (macOS, Ubuntu, Windows) |

---

## Shadow Stack Steps Status

| Step | Title                     | Status    | Notes                            |
| ---- | ------------------------- | --------- | -------------------------------- |
| 0    | Разведка и аудит          | ✅ Passed | System audit complete            |
| 0.5  | Провайдеры и MCP скиллы   | ✅ Passed | 115 skills, Ollama available     |
| 1    | Homebrew, Node.js, Python | ✅ Passed | Node 22.22.1, Python 3.14.3      |
| 2    | Ollama + модели           | ✅ Passed | llama3.2, mistral, phi3, qwen2.5 |
| 3    | OpenClaw Agent            | ✅ Passed | v1.2.27                          |
| 4    | NeMo Agent Toolkit        | ✅ Passed | nemotoolkit installed            |
| 5    | OpenCode SDK              | ✅ Passed | @opencode-ai/sdk configured      |
| 6    | Vercel AI SDK v4+         | ✅ Passed | ai @ai-sdk/openai                |
| 7    | Playwright MCP            | ✅ Passed | @playwright/mcp@latest           |
| 8    | Supabase + pgvector       | ✅ Added  | Docker + pgvector                |
| 9    | Langfuse                  | ✅ Added  | docker-compose                   |
| 10   | Tailscale VPN             | ✅ Added  | Homebrew                         |
| 11   | Telegram Bot              | ✅ Added  | node-telegram-bot-api            |

---

## Package Corrections (2026-03-21)

### Step 6 — Correct

```bash
npm install ai @ai-sdk/openai
```

### Step 7 — Correct

```bash
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

1. **Electron single-instance lock** — Kill zombie processes before restart:

   ```bash
   pkill -f "Electron" 2>/dev/null; sleep 2
   lsof -ti:5175 | xargs kill -9 2>/dev/null
   ```

2. **Browser fallback** — When running in browser (not Electron), bash commands show instructions instead of executing. Run `npm run start` for real execution.

---

## Ollama Models

| Model           | Size   | Status |
| --------------- | ------ | ------ |
| qwen2.5:3b      | 1.9 GB | ✅     |
| mistral         | 4.4 GB | ✅     |
| phi3            | 2.2 GB | ✅     |
| llama3.2        | 2.0 GB | ✅     |
| qwen3-coder:30b | 18 GB  | ✅     |
| smollm2:135m    | 270 MB | ✅     |

---

## GitHub

**Repo:** https://github.com/huivrotiki/shadow-stack-widget

**Tag:** v1.0.0 (pushed)

**CI:** Cross-platform (macOS, Ubuntu, Windows) + Node 20, 22

---

## Files Modified in This Session

| File                     | Changes                                              |
| ------------------------ | ---------------------------------------------------- |
| main.cjs                 | Electron fix: show:false, ready-to-show, debug logs  |
| src/App.jsx              | Browser fallback, Steps 8-11 added, dynamic progress |
| AGENTS.md                | Package corrections, Steps 8-11 status               |
| SKILL.md                 | Updated package names                                |
| HANDOFF.md               | This file                                            |
| README.md                | CI badge, cross-platform badge                       |
| .github/workflows/ci.yml | Cross-platform CI (macOS, Ubuntu, Windows)           |

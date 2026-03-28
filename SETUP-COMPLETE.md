# 🚀 Shadow Stack — Setup Complete

**Date:** 2026-03-27
**Status:** ✅ All components configured

## What Was Done

### 1. ✅ OpenCode Configuration
- Created `opencode.json` with full configuration
- Added provider configurations (Anthropic, Google, OpenAI)
- Added MCP servers (Vercel, Tailscale, Filesystem, Memory)
- Added custom commands (/next, /block, /test, /fix, /deploy, /status, /commit)
- Added agents (shadow-planner, shadow-reviewer)
- Added permissions and compaction settings

### 2. ✅ Tailscale Integration
- Created `docs/tailscale-integration.md` with full documentation
- Added Tailscale MCP server configuration
- Created `.opencode/skills/tailscale-ops/SKILL.md`
- Created `scripts/vps-setup.sh` for VPS setup
- Updated `.env.example` with Tailscale variables
- Added Tailscale section to security-check skill

### 3. ✅ Skills Created (10 total)
```
.opencode/skills/
├── ralph-loop/SKILL.md      — RALPH cycle (Retrieve, Act, Learn, Persist, Handoff)
├── security-check/SKILL.md  — Security audit (secrets, eval, endpoints, SQL, Tailscale)
├── tailscale-ops/SKILL.md   — Tailscale network management
├── memory-store/SKILL.md    — Store knowledge in ChromaDB
├── memory-retrieve/SKILL.md — Retrieve knowledge from ChromaDB
├── shadow-generate/SKILL.md — Cascade text generation
├── ram-guard/SKILL.md       — RAM monitoring on M1 8GB
├── test-runner/SKILL.md     — Run tests with ✅/❌ format
├── git-commit/SKILL.md      — Safe git commits (no secrets)
└── telegram-report/SKILL.md — Telegram formatted reports
```

### 4. ✅ Cascade System Fixed
- Added `cleanEnv()` function to strip quotes from API keys
- Applied `cleanEnv()` to all provider keys (Groq, OpenRouter, Gemini, OpenAI)
- Added error logging in cascade catch block
- Cascade now working: `/ai 2+2` → "2 + 2 = 4" via Groq (661ms)

### 5. ✅ Services Running
```
✅ Bot: http://localhost:4000/health — polling active
✅ Express API: http://localhost:3001/health — online
✅ Cascade: POST /api/cascade — working (Groq provider)
✅ Dashboard: http://localhost:5176 — online
✅ OpenClaw: http://localhost:18789 — live
✅ Ollama: http://localhost:11434 — running
```

## Next Steps (Manual)

### 1. Tailscale Setup
```bash
# On VPS:
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up --ssh --accept-routes --hostname=shadow-stack-vps
sudo systemctl disable ssh
sudo ufw default deny incoming
sudo ufw allow in on tailscale0
sudo ufw enable

# On MacBook:
brew install tailscale
sudo tailscaled
tailscale up --hostname=shadow-macbook
```

### 2. Add Tailscale Keys to .env
```bash
# Add to .env:
TAILSCALE_OAUTH_CLIENT_ID=your_client_id
TAILSCALE_OAUTH_CLIENT_SECRET=your_client_secret
TAILSCALE_TAILNET=your_tailnet.ts.net
```

### 3. Setup VPS
```bash
# From MacBook:
tailscale ssh ubuntu@shadow-stack-vps < scripts/vps-setup.sh
```

### 4. Optional: Aperture AI Gateway
```bash
# Sign up at: https://tailscale.com/blog/aperture-self-serve
# Add to .env:
APERTURE_URL=https://aperture.tailscale.com/v1
TAILSCALE_IDENTITY_TOKEN=your_token
```

## Test Commands

```bash
# Test cascade
curl -s -X POST http://localhost:3001/api/cascade -H "Content-Type: application/json" -d '{"prompt":"2+2"}'

# Test bot health
curl -s http://localhost:4000/health

# Test Express API
curl -s http://localhost:3001/health

# Test OpenCode skills
opencode → /skills → should show 10 skills
```

## Telegram Commands

```
🟢 Local:    /route /models
☁️ Cloud:    /gemini /groq /deep /nvidia /kimi /mini /alibaba /openai
🌐 Browser:  /chatgpt /copilot /manus /kimi-web /claude /deepseek /grok /comet
🤖 Group:    /ask-gpt /ask-deepseek
⚡ Cascade:  /ai /warm
💎 Paid:     /premium
🔧 System:   /status /ram /openclaw /clean /sync /deploy /restart /ping /escalate
```

## Architecture

```
Telegram → Bot (:4000) → Cascade → Providers
              │                    │
              └→ Express (:3001)   ├→ Gemini (free)
                  │                ├→ Groq (free)
                  ├→ /api/route    ├→ OpenRouter (free)
                  ├→ /api/cascade  ├→ Alibaba
                  ├→ /api/logs     ├→ Ollama (local)
                  └→ /api/health   └→ Telegram bots (free)
```

---

**Everything is ready for Tailscale integration and VPS deployment!**

# Shadow Stack — Full Phases Plan

> **Version:** 5.1
> **Last updated:** 2026-03-27
> **Hardware:** Mac mini M1 8GB RAM, Berlin
> **Repo:** github.com/huivrotiki/shadow-stack

---

## Architecture

```
Telegram → Bot (:4000) → Auto-Router (:3001) → Providers
                                    │
                          Shadow Router (:3002) → Browsers (CDP :9222)
                                    │
                          Dashboard (:5176) ← SSE /api/logs
                                    │
                          Vercel (production)
```

**Services:**

| Service | Port | Status |
|---------|------|--------|
| Express API | 3001 | ✅ |
| Telegram Bot | 4000 | ✅ |
| Shadow Router | 3002 | ✅ |
| Dashboard (static) | 5176 | ✅ |
| OpenClaw | 18789 | ✅ |
| Ollama | 11434 | ✅ |

---

## Phase 1: Auto-Router + Telegram ✅ COMPLETE

**Commit range:** `c4a78d68` → `6aea6f44`

- [x] Auto-Router state machine + 7 providers + Zod schemas
- [x] Telegram webhook full rewrite
- [x] Dashboard 8-tab interactive HTML v3
- [x] SKILL.md + documentation
- [x] Telegram polling with IP workaround (149.154.166.110)

---

## Phase 2: Antigravity + OpenCode Fallback ✅ COMPLETE

**Commit range:** continued from Phase 1

- [x] Antigravity Gemini provider (OpenCode proxy, $0)
- [x] Usage tracking (in-memory, hourly reset, per-provider limits)
- [x] Extended cascade: Ollama → Antigravity → OpenRouter → Kimi → Claude
- [x] Quota-aware routing (90% threshold auto-switch)
- [x] /test-router, /usage Telegram commands
- [x] GET /api/auto-router/usage endpoint
- [x] Dashboard quota monitor with interactive bars

---

## Phase 3: Meta-Escalation + Browser Agents ✅ COMPLETE

**Key commit:** `f87756cd`

- [x] server/auto-router/metaEscalate.ts — 3-tier chain (Perplexity → GPT-4o → Human)
- [x] POST /api/meta-escalate endpoint
- [x] fallback.ts → metaEscalate() on cascade exhaustion
- [x] auto-router.ts → meta-escalation route added
- [x] Telegram /escalate command
- [x] CLAUDE.md — meta-escalation rules
- [x] SKILL.md — meta-escalation docs + API endpoints
- [x] Dashboard: meta-escalation status panel (v5.1)

---

## Phase 4: Observability + 16 Providers ✅ COMPLETE

**Key commit:** `b9af2e17`

### Infrastructure
- [x] server/api/logs.js — SSE streaming (`GET /api/logs`), circular buffer (100 events), pushLog(), heartbeat 5s
- [x] server/lib/supabase.js — router_logs insert (silent fail if unconfigured)
- [x] `GET /api/logs/stats` — retry metrics per provider
- [x] `POST /api/logs` — external log push (bot → server)

### Dashboard
- [x] Tab 7 — live log tail via EventSource (color-coded by route)
- [x] Pause/Clear buttons
- [x] SSE connection status indicator
- [x] Retry counters in quota bars (fetch /api/logs/stats)

### 16 Bot Commands

**🟢 Local (0$, fast):**
- `/route` — auto-router (Ollama qwen2.5:3b → OpenRouter fallback)

**☁️ Cloud free:**
- `/gemini` — Google Gemini 2.0 Flash (1500/day)
- `/groq` — Groq Llama 3.3 70B (30/min)
- `/deep` — Step-3.5 Flash 256K (free via OpenRouter)
- `/nvidia` — Nemotron 120B (free via OpenRouter)
- `/kimi` — Moonshot Kimi (free via OpenRouter)
- `/mini` — Minimax M2.5 (free via OpenRouter)

**🌐 Browser (Shadow Router :3002):**
- `/chatgpt` → chatgpt.com
- `/copilot` → copilot.microsoft.com
- `/manus` → manus.im
- `/kimi-web` → kimi.moonshot.ai

**🤖 Group bots:**
- `/ask-gpt` → @chatgpt_gidbot (group -1002107442654)
- `/ask-deepseek` → @deepseek_gidbot

**💎 Paid:**
- `/premium` — Claude Sonnet via OpenRouter

### Security
- [x] npm audit run (57 vuln — vercel→undici transitive dep, not exploitable locally)
- [x] .env.example updated with all new keys

---

## Phase 5: Go-Live (target 2026-04-05) 🔜

- [ ] RUNBOOK.md — start/stop/debug/deploy instructions
- [ ] AGENTS.md finalized
- [ ] Smoke test: /ping /status /deploy /gemini /groq /deep
- [ ] Vercel prod deploy → production URL in README
- [ ] Telegram webhook → production URL
- [ ] Supabase table `router_logs` created (SQL in README)
- [ ] Google Drive sync (shadow-gdrive-sync.sh + cron)
- [ ] Ralph Loop installed (.agent/ralph/)

---

## Supabase Setup

```sql
CREATE TABLE router_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  route text,
  model text,
  latency_ms int,
  status text,
  message_preview text,
  user_id text
);
```

**Env vars:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`

---

## Known Issues

| Issue | Severity | Status |
|-------|----------|--------|
| npm audit 57 vuln (vercel→undici) | low | won't fix (transitive, local only) |
| Telegram 409 if multiple polling sessions | medium | close old session first |
| Bot token logged in /tmp/bot.log | medium | mask in future version |
| Free RAM < 400MB blocks Shadow Router browser | high | clean with /clean command |

---

## Routing Diagram

```
Telegram message
       │
       ▼
  Command?
  ├─ /chatgpt /copilot /manus → Shadow Router :3002 (Playwright)
  ├─ /ask-gpt /ask-deepseek  → forward to group -1002107442654
  ├─ /gemini /groq            → direct API
  ├─ /deep /nvidia /kimi /mini → OpenRouter free
  ├─ /premium                 → Claude Sonnet
  ├─ /deploy                  → Vercel CLI
  └─ text (no command)        → Ollama :11434 (local, $0)
```

---

**Go-live target:** 2026-04-05
**Last updated:** 2026-03-27

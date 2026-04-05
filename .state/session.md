# Session 2026-04-04

## 20:29 · claude-code · runtime_open
Bootstrap of portable state layer begins. Plan: docs/superpowers/plans/2026-04-04-portable-state-layer.md

## 20:29 · claude-code · plan_step_advance
R0.0 · creating .state/ skeleton

## 20:42 · claude-code · verification_complete
Spec §18 criteria 1-11 automated-verified. Criterion 12 (cross-runtime test):
user should switch to OpenCode, observe that .state/current.yaml and .state/session.md
reflect the claude-code session. Not executable in this plan.

## 23:00 · claude-code · handoff_updated
R0.0 complete. Portable state layer + monorepo merge landed. Next: R0.1 (ZeroClaw config.toml).

## 23:00 · claude-code · plan_step_advance
R0.0 → R0.1

## 23:00 · claude-code · runtime_close
Session end. 21 tasks complete.

## 23:17 · opencode · runtime_open
Project load + service restart. Shadow API restarted with latest code (PID 1388→new). All core services verified.

## 23:17 · opencode · service_status
✅ Shadow API :3001, ✅ Bot :4000, ✅ ZeroClaw :4111, ✅ Dashboard :5175, ✅ Ollama :11434 (7 models), ✅ Free Models Proxy :20129 (18 models). ⚠️ Bot token invalid. ❌ ChromaDB :8000 (known broken), ❌ Omniroute :20128, ❌ OpenClaw :18789.
## 01:30 · opencode · handoff_updated — OpenClaw/DeerFlow removed, cascade-provider added

## 00:10 · claude-code · review_and_cleanup
Сопоставление opencode-сессии с реальностью:
- bot bridge: /api/route → /api/cascade/query (2 вхождения)
- удалён scripts/openclaw-wizard.cjs
- Supermemory обновлён: DeerFlow удалён, cascade-provider зафиксирован (3 записи)
- PRD.md создан для Ralph Loop (6 tasks, R0.2–R2)
- Безопасность: tracked файлы чисты; .claude/settings.local.json (gitignored) содержит GH PAT + 2 Telegram токена — требуют ротации
- Добавлено глобальное правило: NotebookLM 489988c4 подтягивать при каждом SessionStart

## 00:10 · claude-code · runtime_close
Handoff + commit + push. Следующий шаг: Ralph Loop Task 1 (cascade-provider live test).

---

# Session 2026-04-05b

## 02:10 · claude-code · runtime_open
Continuation: security cleanup + dependency patches. Context: user requested autonomous fix of leaked tokens (.claude/settings.local.json) and 7 Dependabot alerts.

## 02:25 · claude-code · security_fix
Scrubbed 9 allow-entries from .claude/settings.local.json containing GH PAT (ghp_w1e…) and 2 Telegram bot tokens (8298265295:*). File is gitignored globally — no git-history exposure. Tokens flagged for user-side revocation.

## 02:40 · claude-code · dependency_audit
npm audit root: 10 vulns (2 critical, 2 high, 5 moderate, 1 low). Root cause: node-telegram-bot-api@0.67.0 → @cypress/request-promise@5 → request-promise-core → deprecated request@2.88.2 (pulls form-data@2.3.3 CRITICAL, qs@6.5.5, tough-cookie@2.5.0). npm audit fix proposed downgrade to 0.63.0 (semver major, worse). Chose overrides strategy.

## 02:55 · claude-code · dependency_patch
Commit f99a2101: package.json overrides block + electron ^41.0.3→^41.1.0 + health-dashboard-v5 vite ^5→^7. Overrides: @xmldom/xmldom ^0.8.12, form-data@<2.5.4→2.5.4, tough-cookie@<4.1.3→^4.1.3, qs@<6.14.1→^6.14.1, request→npm:@cypress/request@^3.0.10 (drop-in Cypress fork), lodash ^4.18.1. Also removed stale "setup:openclaw" script entry. Smoke: new TelegramBot() works via aliased fork. npm audit = 0 vulns both trees.

## 03:05 · claude-code · push
f99a2101 → origin/feat/portable-state-layer. GitHub default-branch warning persists (branch not merged to main yet).

## 03:15 · claude-code · bot_rotation_initiated
User requested switch to new bot @shadowzzero_bot. User posted new token in chat by mistake → immediately revoked via BotFather per my warning. Old bot 8298265295 still in Doppler + .env — pending replacement with fresh token generation.

## 03:15 · claude-code · runtime_close
Safe state committed. New bot token to be injected by user directly into Doppler (never via chat). OpenCode handoff prompt delivered to user.

---

# Session 2026-04-05c

## 00:30 · opencode · runtime_open
Continuation: update opencode providers + cascade. Branch: feat/portable-state-layer @ b773b157.

## 00:34 · opencode · cascade_fix
- Removed broken OmniRoute :20128 from opencode.json enabled_providers (was DOWN: better-sqlite3/M1)
- Added shadow-cascade provider pointing to free-proxy :20129 (16 working models)
- Updated free-proxy model list: removed kiro/* (OmniRoute dependency), corrected openrouter/qwen3.6 model name (qwen3.6-plus-preview:free → qwen3.6-plus:free, preview expired Apr 3)
- Updated free-models-proxy.cjs: MODEL_MAP without kiro/*, CASCADE_CHAIN starts with openrouter/qwen3.6
- Updated cascade-provider.cjs: default model kiro/sonnet → openrouter/qwen3.6, TASK_MODEL defaults updated
- Default model: free-proxy/kiro/sonnet → shadow-cascade/openrouter/qwen3.6
- Small model: ollama/qwen2.5-coder:3b → shadow-cascade/ollama/qwen2.5-coder
- Verified: cascade query returns {"ok":true,"text":"Four","model":"openrouter/qwen3.6","latency":6316,"provider":"free-proxy"}

## 00:47 · opencode · shadow_ultimate_cascade
- Renamed provider: shadow-cascade → shadow-ultimate-cascade
- Added 8 Copilot models: gpt-5.4, gpt-5.4-mini, gpt-5.3-codex, claude-sonnet-4.6, claude-haiku-4.5, claude-opus-4.6, gemini-2.5-pro, grok-code-fast-1
- Added 2 Zen models: mimo-pro, mimo-omni
- Added 2 Gemini models: flash, flash-lite, pro
- Added 2 DeepSeek models: v3, r1 (via HuggingFace Inference API)
- Total: 31 models, 11-step cascade chain
- Cascade chain: openrouter/qwen3.6 → zen/big-pickle → openrouter/nemotron → gemini/flash → copilot/gpt-5.4-mini → openrouter/step-flash → deepseek/v3 → copilot/gpt-5.3-codex → groq/llama-3.3-70b → ollama/qwen2.5-coder → ollama/llama3.2
- Ralph Loop tests: all 5 passed ✅ (health, models, chat query 8.8s, fast query 6.7s, 31 models)

---

# Session 2026-04-05d — Ralph Loop: Shadow Ultimate Cascade Fix

## 00:30 · opencode · runtime_open
Ralph Loop R0.3: Fix shadow-ultimate-cascade init error.

## 00:32 · opencode · service_verify
All services UP: free-proxy :20129 (31 models), shadow-api :3001, ollama :11434 (7 models), zeroclaw :4111. RAM: 543MB safe.

## 00:33 · opencode · cascade_tests
- or-qwen3.6 → "Pong!" (6.8s, free-proxy) ✅
- chat route → ollama/qwen2.5-coder:3b fallback (10.6s) ✅
- /api/cascade/health → freeProxy=true, ollama=true ✅
- /api/cascade/models → 31 models ✅

## 00:34 · opencode · root_cause
FREE_PROXY_API_KEY not set in Doppler → opencode provider init fails.
Global opencode.json used `${...}` syntax (wrong) → fixed to `{env:...}`.

## 00:35 · opencode · doppler_fix
Added FREE_PROXY_API_KEY to Doppler (serpent/dev): `shadow-free-proxy-local-dev-key-<timestamp>`

## 00:36 · opencode · config_fix
- Global `~/.config/opencode/opencode.json`: `${FREE_PROXY_API_KEY}` → `{env:FREE_PROXY_API_KEY}` (shadow-ultimate-cascade + free-proxy)
- Local `opencode.json`: already correct `{env:FREE_PROXY_API_KEY}` format

## 00:37 · opencode · state_update
Updated .state/todo.md (Phase R0.3 complete) + .state/session.md (this log).

---

# Session 2026-04-05f — Ralph Loop R0.4: Cloud-Only Auto-Routing

## 02:00 · opencode · runtime_open
R0.4: Fix shadow-ultimate-cascade auto model + cloud-only stack.

## 02:05 · opencode · GITHUB_TOKEN_updated
New token `ghp_aEagy6j...` added to Doppler (serpent/dev).

## 02:10 · opencode · free-proxy_rebuilt
- Removed dead models (Zen, Groq, Gemini, HF, Mistral — no API keys)
- Kept 17 working: OpenRouter FREE (5) + Copilot (8) + Ollama (3)
- Auto-routing: 5 categories (code, fast, research, creative, translate)
- Adaptive timeout: 60s Ollama, 30s cloud

## 02:15 · opencode · tests_passed
- ping → fast → or-step-flash (3.3s) ✅
- sortArray на JS → code → or-qwen3.6 (15.8s) ✅
- cascade auto query → "pong!" ✅

## 02:20 · opencode · config_updated
- Local opencode.json: 17 models, default=auto
- Global opencode.json: synced, 17 models, default=auto

## 02:25 · opencode · committed
- `0d05c908` feat(cascade): cloud-only auto-routing with 17 working models
- `eb8c66bd` docs: handoff 2026-04-05f

## 02:30 · opencode · runtime_close
Handoff updated. Ready for git push.

## 09:00 · claude-code · runtime_open
Session 2026-04-05j. User approved Full MVP (C): restore opencode.json + ZeroClaw HTTP + planner + bot wiring + score retry + global config.

## 09:05 · claude-code · opencode_json_restored
git restore opencode.json — shadow/auto + 17 models + MCP + Pre-Step Ritual returned (7→195 lines). Hardcoded dev apiKey (proxy has no auth).

## 09:10 · claude-code · zeroclaw_http_wrapper
Created server/lib/zeroclaw-http.cjs (CJS + dynamic ESM import of ZeroClaw.js). Routes: /api/zeroclaw/{execute,plan,execute-plan,state,state/:id,health}. Mounted in server/index.js.

## 09:15 · claude-code · zeroclaw_planner
Created server/lib/zeroclaw-planner.cjs — regex intent classifier (code/research/translate/summarize/creative/chat) + decomposer (numbered list / then-connector). Fixed Cyrillic \b word-boundary bug.

## 09:20 · claude-code · bot_rewired
bot/opencode-telegram-bridge.cjs: handleRoute + main prompt handler now POST /api/zeroclaw/execute instead of /api/cascade/query. Bot calls ZeroClaw Master Orchestrator.

## 09:25 · claude-code · score_retry
ZeroClaw.js execute() accepts min_score; if score < threshold and more models remain, advance to next model; keeps bestResult and returns degraded:true as final fallback.

## 09:30 · claude-code · global_config
Appended OpenCode+ZeroClaw lifecycle protocol to ~/.claude/CLAUDE.md (OPEN/SAVE/COMMIT/PUSH/ZEROCLAW CALLS/role split). Added same protocol to opencode.json instructions[].

## 09:35 · claude-code · runtime_drift_found
pid 30103 on :3001 is pm2 agent-api from /Users/work/agent-factory/, NOT shadow-stack_local_1/server/index.js. My edits NOT active at runtime until pm2 reloads from correct ecosystem. NEXT: user-approved `pm2 delete all && pm2 start /Users/work/shadow-stack_local_1/ecosystem.config.cjs`.

## 10:03 · Kiro · setup_complete — all services online (except OmniRoute: file missing), CLAUDE.md updated

## 10:49 · Kiro · handoff_and_commit
Коммит 8ae9ef1e: zeroclaw-http + planner, opencode.json restored, ecosystem fix, score retry.
handoff.md обновлён. Следующий шаг: pm2 reload из shadow-stack_local_1 + Task 1 cascade live test.

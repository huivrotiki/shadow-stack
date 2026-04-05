# Handoff [2026-04-05s3] — Kiro · 17:30 UTC+2

**Branch:** feat/portable-state-layer  
**Commit:** 03ff6140  
**Runtime:** Kiro CLI  
**PR:** https://github.com/huivrotiki/shadow-stack/pull/6 (OPEN — push blocked, gh token expired)

---

## 📍 СТАТУС

```
Phase: R1 / Omni Router — operational
RAM: ~299 MB → WARNING tier (cloud-only, no browser/CDP)
Active tier: shadow/auto → omni-sonnet (kr/claude-sonnet-4.5) → gr-llama70b → ...
```

---

## ✅ Что сделано в этой сессии

| Файл | Изменение |
|---|---|
| `server/free-models-proxy.cjs` | omniroute models → `kr/claude-sonnet-4.5` / `kr/claude-haiku-4.5`, dropped `omni-gpt4o`, added `stream: false` + `providerOrder` pinning |
| `knowledge/VERCEL_AI_GATEWAY.md` | создан — полный reference: ключ, AI SDK, примеры, модели, мониторинг |
| `handoff.md` | обновлён (этот файл) |

**Commits this session:**
- `99d4d03f` — API keys status (deepseek/anthropic no credits, vercel OIDC)
- `24d4a6c2` — proxy kr/ models + vercel gateway docs
- `03ff6140` — handoff session 3

---

## 🔑 API Keys (Doppler: serpent/dev)

| Ключ | Статус | Примечание |
|---|---|---|
| OPENROUTER_API_KEY | ✅ | |
| GROQ_API_KEY | ✅ | inject via `doppler run` |
| MISTRAL_API_KEY | ✅ | inject via `doppler run` |
| GEMINI_API_KEY | ✅ | inject via `doppler run` |
| HF_API_KEY | ✅ | inject via `doppler run` |
| OMNIROUTE_KEY | ✅ | KiroAI, kr/claude-sonnet-4.5 |
| DEEPSEEK_API_KEY | ❌ | 402 — нужно пополнить |
| ANTHROPIC_API_KEY | ❌ | 400 — нужно пополнить |
| AI_GATEWAY_API_KEY | ❌ | нужен Personal Access Token (не vcp_/vck_) → https://vercel.com/account/settings/tokens |
| OPENAI_API_KEY | ❌ | quota exceeded |
| ALIBABA_API_KEY | ⚠️ | intl endpoint auth fails |

---

## 🔧 Сервисы (последнее известное состояние)

| Сервис | Порт | PM2 | Статус |
|---|---|---|---|
| free-models-proxy | 20129 | 16 | ✅ online (doppler run) |
| omniroute-kiro | 20130 | 12 | ✅ online |
| agent-api | 3001 | 1 | ✅ online |
| agent-bot | 4000 | 2 | ✅ online |
| zeroclaw | 4111 | 3 | standby |
| omni-endpoint | 20128 | — | ready, not started (`npm run omni`) |

---

## CASCADE_CHAIN (текущий)

```
omni-sonnet → gr-llama70b → gr-llama8b → ms-small → gem-2.5-flash
→ or-gpt-oss120 → or-llama70b → ol-gpt-oss20 → ol-qwen2.5-coder
```

---

## 🚧 Блокеры

1. **GitHub token expired** — `git push` заблокирован. Fix: `gh auth login`
2. **Vercel AI Gateway** — нужен Personal Access Token (не project/CI token):
   - Создать: https://vercel.com/account/settings/tokens → "Full Account"
   - Сохранить: `doppler secrets set AI_GATEWAY_API_KEY=<token> --project serpent --config dev`
3. **ts-node/nodemon** не в devDeps → `npm run omni` не запустится без `npm i -D ts-node nodemon`
4. **ChromaDB v1→v2** — `scripts/memory-mcp.js` (перенесено из предыдущих сессий)
5. **GitGuardian** — FAILED: 6 secrets in 161 commits (исторические, не блокируют работу)

---

## 📋 Next Tasks (по приоритету)

1. `gh auth login` → `git push origin feat/portable-state-layer` → merge PR#6
2. Vercel AI Gateway: создать Personal Access Token → doppler set → тест `vg-sonnet`
3. `npm i -D ts-node nodemon` → `npm run omni` → тест `:20128`
4. Добавить `GEMINI_API_KEY_2` / `GEMINI_API_KEY_3` (2й/3й Google аккаунт = +3000 req/day free)
5. Fix ChromaDB v2 в `scripts/memory-mcp.js`
6. R0.2 — ZeroClaw Control Center (следующий по плану)

---

## 🚀 Первая команда новой сессии

```bash
curl http://localhost:3001/ram && \
lsof -i :20129 -i :20130 | grep LISTEN && \
pm2 ls && \
git -C ~/shadow-stack_local_1 log --oneline -3
```

## ⚠️ Перезапуск прокси (ВАЖНО — только через doppler)

```bash
cd ~/shadow-stack_local_1
pm2 delete free-models-proxy
doppler run --project serpent --config dev -- pm2 start server/free-models-proxy.cjs --name free-models-proxy
```

---

## 📊 RALPH: READ → PLAN → EXEC → TEST → COMMIT → UPDATE → SYNC ✅

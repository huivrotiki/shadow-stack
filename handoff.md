# Handoff — 2026-04-05 (session 2)

## Status: ✅ FULLY OPERATIONAL

## Active Services
| Service | Port | PM2 ID | Status |
|---|---|---|---|
| free-models-proxy | 20129 | 14 | online (doppler run → pm2 start) |
| omniroute-kiro | 20130 | 12 | online |
| agent-api | - | 1 | online |
| agent-bot | - | 2 | online |
| zeroclaw | - | 3 | online |

> ⚠️ PM2 ID changed: 13 → 14 (re-created via doppler run to inject all keys)

## Working Providers (RALPH loop verified)
| Model ID | Provider | Latency | Status |
|---|---|---|---|
| omni-sonnet | KiroAI OmniRoute | ~2s (timeout 25s) | ✅ |
| gr-llama70b | Groq | 0.3s | ✅ |
| gr-llama8b | Groq | 0.1s | ✅ |
| ms-small | Mistral | 0.4s | ✅ |
| gem-2.5-flash | Gemini | 0.6s | ✅ |
| hf-qwen72b | HuggingFace Router | 1.6s | ✅ |
| or-gpt-oss120, or-llama70b | OpenRouter free | 2–7s | ✅ |
| ol-gpt-oss20 | Ollama cloud | ~12s | ⚠️ unstable |
| ali-qwen-* | Alibaba | - | ❌ intl key invalid |
| or-step-flash | OpenRouter | - | ❌ removed from cascade |

## CASCADE_CHAIN (updated)
```
omni-sonnet → gr-llama70b → gr-llama8b → ms-small → gem-2.5-flash
→ or-gpt-oss120 → or-llama70b → ol-gpt-oss20 → ol-qwen2.5-coder
```

## API Keys in Doppler (serpent/dev)
| Key | Status |
|---|---|
| OPENROUTER_API_KEY | ✅ |
| GROQ_API_KEY | ✅ (now injected via doppler run) |
| MISTRAL_API_KEY | ✅ (now injected via doppler run) |
| GEMINI_API_KEY | ✅ (now injected via doppler run) |
| HF_API_KEY | ✅ (now injected via doppler run) |
| ALIBABA_API_KEY | ⚠️ key present, intl endpoint auth fails |
| AI_SDK_GATEWAY_KEY | ⏳ needs credit card at vercel.com/~/ai-gateway |
| ANTHROPIC_API_KEY | ❌ no credits |
| DEEPSEEK_API_KEY | ❌ no balance |
| OPENAI_API_KEY | ❌ quota exceeded |
| OMNIROUTE_KEY | ✅ |

## Root Cause Fixed This Session
**Problem:** `pm2 restart 13` did NOT re-read Doppler env → GROQ/MISTRAL/GEMINI/HF keys were empty
**Fix:** `pm2 delete 13` + `doppler run --project serpent --config dev -- pm2 start server/free-models-proxy.cjs`

## Key Changes (commit 3ebed92b)
1. omniroute timeout 15s → 25s
2. CASCADE_CHAIN: removed dead `or-step-flash`, added `gr-llama8b` + `gem-2.5-flash` + `or-llama70b`
3. Added alibaba provider + ali-qwen-* models
4. llm-gateway: DAILY_LIMITS + dailyCount tracking

## Next Tasks
1. **auto research settings** — настройка шаблона в omnirouter
2. **Activate Vercel AI Gateway** — add card at https://vercel.com/oleksii-barsuk-s-projects/~/ai-gateway
3. **Alibaba key** — get CN-format key or use dashscope.aliyuncs.com endpoint
4. **git push** — branch feat/portable-state-layer ahead of origin

## First Command for New Session
```bash
lsof -i :20129 -i :20130 | grep LISTEN && pm2 ls && git -C ~/shadow-stack_local_1 log --oneline -3
```

## Restart Command (IMPORTANT — must use doppler)
```bash
cd ~/shadow-stack_local_1
pm2 delete free-models-proxy
doppler run --project serpent --config dev -- pm2 start server/free-models-proxy.cjs --name free-models-proxy
```

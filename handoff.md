# Handoff — 2026-04-05n

## Status: ✅ FULLY OPERATIONAL

## Active Services
| Service | Port | PM2 ID | Status |
|---|---|---|---|
| free-models-proxy | 20129 | 13 | online (doppler run) |
| omniroute-kiro | 20130 | 12 | online (ecosystem config) |
| agent-api | - | 1 | online |
| agent-bot | - | 2 | online |
| zeroclaw | - | 3 | online |

## Working Providers (tested 3x)
| Model ID | Provider | Avg Latency |
|---|---|---|
| omni-sonnet/haiku | KiroAI OmniRoute | ~0s (cached) |
| gr-llama70b, gr-llama8b | Groq | 0.2s |
| gr-qwen3-32b, gr-kimi-k2 | Groq | 0.3–1s |
| gr-gpt-oss120, gr-gpt-oss20 | Groq | 0.2s |
| gr-compound, gr-llama4 | Groq | 0.2s |
| ms-small, ms-medium, ms-large | Mistral | 0.4–1.2s |
| ms-codestral | Mistral | 0.4s |
| ol-gpt-oss20 | Ollama cloud | 0.7s |
| ol-deepseek-v3 | Ollama cloud | 2s |
| ol-qwen3-coder | Ollama cloud | 0.9s |
| or-qwen3.6, or-step-flash | OpenRouter free | 2–7s |
| hf-qwen72b | HuggingFace Router | 1s |
| gem-2.5-flash | Google Gemini | 0.9s |
| auto | → openrouter/qwen3.6 | 5s |

## API Keys in Doppler (serpent/dev)
| Key | Status |
|---|---|
| OPENROUTER_API_KEY | ✅ working |
| GROQ_API_KEY | ✅ working |
| MISTRAL_API_KEY | ✅ working (updated) |
| GEMINI_API_KEY | ✅ working (new key) |
| HF_API_KEY | ✅ working (router endpoint) |
| AI_SDK_GATEWAY_KEY | ⏳ needs credit card at vercel.com/~/ai-gateway |
| ANTHROPIC_API_KEY | ❌ no credits |
| DEEPSEEK_API_KEY | ❌ no balance |
| OPENAI_API_KEY | ❌ quota exceeded |
| OMNIROUTE_KEY | ✅ working |

## Key Fixes This Session
1. SSE streaming fix (writeSSE + echo model id) for opencode AI SDK compat
2. Tier-first routing: copilot→openrouter→ollama (score = circuit breaker only)
3. provider-scores.json reset (removed ollama bias)
4. Groq key added → 8 new fast models
5. Mistral key added → small/medium/large/codestral
6. HuggingFace endpoint fixed: api-inference → router.huggingface.co
7. Ollama cloud models: gpt-oss:20b, deepseek-v3.1:671b, qwen3-coder:480b
8. Vercel AI Gateway added (255 models, needs card to activate)
9. PM2 autostart via launchd configured
10. opencode.json updated with omni/shadow/vercel-gw providers

## Next Tasks
1. **Activate Vercel AI Gateway** — add card at https://vercel.com/oleksii-barsuk-s-projects/~/ai-gateway
2. **ZeroClaw orchestrator** — check pm2 drift, reconcile cwd
3. **Claude Code via proxy** — /v1/messages shim on :20130
4. **git pull --rebase** — branch is 5 commits ahead of origin

## First Command for New Session
```bash
lsof -i :20129 -i :20130 | grep LISTEN && pm2 ls && git -C ~/shadow-stack_local_1 log --oneline -3
```

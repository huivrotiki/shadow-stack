# Shadow Stack Architecture — Updated 2026-04-24

## System Overview

```
User (OpenCode/ZeroClaw)
         ↓
Shadow Free Proxy (:20129) — 140 models
         ↓
Gateway (Task Router + Cascade Chain)
         ↓
Provider Layer (17 providers, 140 models)
```

---

## Models

### Count: 140 total
- **139 models** via `auto` routing
- **1 super model** `barsuk` (alias for `auto`)

### Default Model
- **OpenCode:** `shadow/barsuk` (set in opencode.json:5-6)
- **Autoresearch:** `barsuk` (loop.js:39, evaluate.js:7)

---

## Barsuk Super Model

### Definition (server/free-models-proxy.cjs:443-446)
```javascript
const MODEL_MAP = {
  'auto':   { provider: 'auto', model: 'auto', priority: 0, isRouter: true },
  'barsuk': { provider: 'auto', model: 'auto', priority: 0, isRouter: true, 
              description: 'Barsuk Super Model (all 139 models via auto-router)' },
  ...
};
```

### Routing Logic (server/free-models-proxy.cjs:682-685)
```javascript
if (model === 'auto' || model === 'barsuk') {
  return handleGatewayRoute(req, res, messages, stream);
}
```

---

## Cascade Chain (24 models, Tier 0-5)

See `docs/BARSUK_MODEL.md` for full details.

### Quick Reference:
- **Tier 0:** gm-flash, kc-*, omni-sonnet (fastest free)
- **Tier 1:** kc-claude-haiku, omni-sonnet (KiroAI Claude)
- **Tier 2:** gr-llama8b (261ms), gr-llama70b, gr-qwen3-32b
- **Tier 3-4:** gem-2.5-flash, or-*, nv-*, fw-*, co-*
- **Tier 5:** ol-qwen2.5-coder (local Ollama)

---

## Providers (17 total)

| Provider | Models | API Key Required |
|-----------|--------|-------------------|
| OmniRoute (KiroAI) | 33 free models | No (free tier) |
| Groq LPU | 14 models | No (free tier) |
| OpenRouter | 13 models | No (free tier) |
| HuggingFace | 5 models | No (free tier) |
| NVIDIA NIM | 6 models | No ($5000 free credits) |
| Fireworks | 2 models | No ($1 daily credit) |
| OpenAI | 5 models | Yes |
| Anthropic | 3 models | Yes |
| Together | 6 models | Yes ($5 signup) |
| Vercel (Zen) | 12 models | Yes (paid) |
| Mistral | 4 models | No (free tier) |
| Cerebras | 1 model | No (free tier) |
| Cohere | 3 models | No (trial) |
| AI/ML API | 4 models | No (free tier) |
| Cloudflare | 4 models | No (10K neurons/day) |
| Ollama (local) | 6 models | No (local) |

---

## Gateway Components

### 1. Task Router (server/lib/llm-gateway.cjs)
- Determines task type: `chat`, `reasoning`, `code`
- Routes to appropriate provider based on task

### 2. Provider Scorer
- Calculates score: `latency + success_rate + usage_ratio`
- Updates `data/provider-scores.json`

### 3. Memory Layer
- Stores decisions in `data/gateway-memory.json`
- Remembers successful model choices
- Tracks rate-limited providers

### 4. Self-healing
- On 429: fallback to next in cascade
- On 500: retry with different provider
- On 404: skip deprecated models

---

## Autoresearch Integration

### Files:
- `autoresearch/loop.js` — main loop (uses `barsuk`)
- `autoresearch/evaluate.js` — metric evaluation (uses `barsuk`)
- `autoresearch/train.py` — SYSTEM_PROMPT for training

### Recent Fixes (commits `4955335c`, `869f9828`):
- Changed from hardcoded `gr-llama8b` → `barsuk`
- Increased delay: 2s → 5s (avoid rate limits)
- Result: No more 429 errors ✅

---

## Health Check

```bash
curl http://localhost:20129/health
# {"status":"ok","models":140,"cascade":[...24 models],"uptime":"1200s"}
```

---

## Recent Commits (2026-04-24)

| Hash | Description |
|------|-------------|
| `47676199` | feat(barsuk): add barsuk super model (140 models), set as default |
| `e6d38319` | chore(handoff): final session summary — auto model setup, 139 models |
| `869f9828` | fix(autoresearch): use auto model in evaluate.js |
| `4955335c` | fix(autoresearch): use auto model instead of hardcoded gr-llama8b |
| `d14cb5f9` | chore(handoff): session 2026-04-24 — auto model setup |
| `83c03f07` | chore(handoff): add autoresearch test results |
| `c071db0c` | feat(config): update models list with all 139 proxy models |
| `42a9ab4a` | fix(config): remove shadow-last-auto model |

---

**✅ Architecture doc updated: 2026-04-24 01:45**

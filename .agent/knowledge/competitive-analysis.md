# Competitive Analysis: Shadow Stack vs Analogues (2026)

## 1. LiteLLM (litellm.ai)
**What they do better:**
- Massive provider coverage (100+ LLM providers).
- Mature enterprise features: Virtual Keys, Team Management, Spend Tracking via Postgres.
- Sub-millisecond proxy overhead via optional Go sidecar architecture.

**Ideas to steal:**
- **Sidecar performance model**: Offload hot-path (request forwarding, timeouts) to a lightweight sidecar, keep Python for control plane.
- **Unified SDK**: `from litellm import completion` — single import for all providers.

**Comparison with Shadow Stack:**
| Feature | LiteLLM | Shadow Stack |
|---------|----------|---------------|
| Language | Python + Go sidecar | Node.js + Bash |
| State | Postgres + Redis | `.state/` (YAML + JSONL) |
| Observability | Spend tracking, Admin UI | `data/heartbeats.jsonl` |
| Local Models | Ollama/vLLM native | Ollama + Barsuk (Free Proxy) |

---

## 2. RouteLLM (lm-sys/RouteLLM)
**What they do better:**
- Research-grade routing based on Chatbot Arena real-world votes.
- Reduces costs by >85% while maintaining 95% GPT-4 performance.
- Formalized cost-quality tradeoff with calibrated thresholds.

**Ideas to steal:**
- **Arena.ai Integration**: Use Arena leaderboard data to dynamically adjust Cascade Router weights.
- **Threshold Calibration**: Let users set "I want 90% of GPT-4 quality" and auto-select cheapest model.

**Comparison with Shadow Stack:**
| Feature | RouteLLM | Shadow Stack |
|---------|----------|---------------|
| Routing Basis | Arena votes / Preference data | Cascade Tiers (1-6) + Self-healing |
| Target | Research / Benchmarking | Production (Mac mini M1) |
| Output | Router model file | Live HTTP :20129 proxy |

---

## 3. Dify.ai
**What they do better:**
- Visual Low-Code builder for RAG pipelines and agentic workflows.
- Built-in dataset management and prompt debugging UI.
- Quick deployment for non-developers.

**Ideas to steal:**
- **Visual Debugging**: Even for a code-first stack, a visual trace of agent steps (like Dify's canvas) is useful.
- **Dataset Management**: Easy UI for curating datasets for fine-tuning or evaluation.

**Comparison with Shadow Stack:**
| Feature | Dify.ai | Shadow Stack |
|---------|----------|---------------|
| Target User | No-code / Business users | Developers / CLI-first |
| Deployment | Docker Compose | PM2 / Pinokio (1-click) |
| Memory | RAG + Conversation History | Supermemory MCP + Obsidian + NotebookLM |

---

## 4. Langfuse (langfuse.com)
**What they do better:**
- Deep OpenTelemetry (OTEL) native support.
- Prompt versioning, A/B experiments, and CI/CD eval blocking.
- Self-hosted option with MIT license (acquired by ClickHouse in Jan 2026).

**Ideas to steal:**
- **OTEL Trace exporter**: Export Shadow Stack traces to standard OTEL collectors.
- **Eval blocking**: Fail CI/CD if eval scores regress (integrate with `autoresearch/evaluate.js`).

**Status in Shadow Stack:**
- Currently `[ ]` in DoD Level 3 (Memory).
- Need to implement `Langfuse` or `AgentOps` integration for Phase 6.

---

## 5. RelayPlane (relayplane.com)
**What they do better:**
- Node.js native (npm install, no Docker).
- Per-request cost tracking built-in.
- Complexity-based routing (Simple vs Complex tasks).

**Ideas to steal:**
- **Identify "Simple" tasks**: Automatically route simple queries (e.g., "fix typo") to cheapest models.
- **Zero-infra**: No database required for basic operation.

**Comparison:**
| Feature | RelayPlane | Shadow Stack |
|---------|----------|---------------|
| Install | `npm i relayplane` | `git clone` + `npm install` |
| Routing | Complexity-based | Cascade Tiers + Arena.ai scores |
| Cost Data | Per-request | Cascade stats (future) |

---

## 6. OpenRouter (openrouter.ai)
**What they do better:**
- Cloud-native unified API (no self-hosting required).
- Massive model catalog with automatic fallbacks.

**Ideas to steal:**
- **Fallback UX**: If Shadow Stack local fails, fallback to OpenRouter cloud API seamlessly.

---

## Summary: What Shadow Stack should adopt (Priority)
1. **Arena.ai feedback loop** (RouteLLM idea) → Update Cascade Router KPI weights.
2. **Cost tracking per request** (RelayPlane/LiteLLM idea) → Add to `data/provider-scores.json`.
3. **Observability** (Langfuse idea) → Phase 6 goal.
4. **Sidecar for performance** (LiteLLM idea) → Long-term optimization for M1.

*Updated: 2026-04-24 (Ralph Loop v2.0, LOOP_1)*

---
title: Cascade Router
date: 2026-04-24
tags: [concept, routing]
---

# Cascade Router

6-tier model routing with self-healing. Runs on :20129 (free-models-proxy).

## Tiers

1. **Tier 1** — Browser automation (gemini-browser, groq-browser, etc.)
2. **Tier 2** — API direct (gemini, openrouter)
3. **Tier 3** — Telegram CDP (manus-browser, etc.)
4. **Tier 4** — Local Ollama (ollama-3b, ollama-7b)
5. **Tier 5** — Fallback (perplexity, copilot)
6. **Tier 6** — Emergency local (ollama)

## Self-Healing

- Detects failures via latency/success rate
- Auto-drops unhealthy providers
- Re-ranks on each request

## Config

- Script: `server/free-models-proxy.cjs`
- OpenCode config: `opencode.json` → `provider.shadow`

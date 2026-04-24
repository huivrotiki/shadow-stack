---
title: Shadow Stack
date: 2026-04-24
tags: [concept, architecture]
---

# Shadow Stack

Local-first AI agentic system running on Mac mini M1 (8GB).

## Core Components

- [[Barsuk]] — Super model (140+ models via free-models-proxy :20129)
- [[ZeroClaw]] — Orchestrator (HTTP API :3001)
- [[Cascade Router]] — 6-tier routing with self-healing
- [[RAM Guard]] — Memory pressure monitor (400MB/200MB thresholds)
- [[OpenCode Plugins]] — Phase 5.2 native plugins

## Architecture Layers

1. **Portable State Layer** (`.state/`) — cross-runtime state
2. **Agent Mesh** (Barsuk + Cascade) — model routing
3. **Memory System** — Supermemory MCP + NotebookLM + Obsidian (this vault)
4. **Runtime Coordination** — OpenCode + ZeroClaw + Telegram Bot

## Key Files

- `.state/current.yaml` — phase tracking
- `.state/session.md` — session log
- `handoff.md` — session handoff document
- `.agent/soul.md` — identity & values
- `.agent/crons.md` — periodic tasks registry

## Ссылки
- [[Barsuk]]
- [[ZeroClaw]]
- [[Cascade Router]]
- [[RAM Guard]]
- [[OpenCode Plugins]]
- [[Pinokio]]
- [[Arena-AI]]
- [[Shadow-Stack-Integration]]

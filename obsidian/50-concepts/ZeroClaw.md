---
title: ZeroClaw
date: 2026-04-24
tags: [concept, orchestrator]
---

# ZeroClaw

Orchestrator for Shadow Stack. HTTP API on port :3001.

## API Endpoints

- `POST /api/zeroclaw/execute` — single instruction execution
- `POST /api/zeroclaw/plan` — multi-step goal planning
- `POST /api/zeroclaw/execute-plan` — execute generated plan
- `GET /api/zeroclaw/state/:task_id` — task state
- `GET /api/zeroclaw/health` — health check

## Role

- Plans complex tasks
- Routes to OpenCode or providers via [[Cascade Router]]
- Manages multi-step goals
- Reports via Telegram Bot

## Integration

- Bridge plugin: `.opencode/plugins/zeroclaw-bridge.ts` (to be created in Phase 5.3)
- Config: `server/lib/zeroclaw-http.cjs`

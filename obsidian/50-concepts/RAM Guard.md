---
title: RAM Guard
date: 2026-04-24
tags: [concept, safety]
---

# RAM Guard

Memory pressure monitor for Mac mini M1 (8GB total).

## Thresholds

| free_mb | Action |
|---------|--------|
| > 400 | All providers available |
| 200-400 | Ollama 7B + local, skip browser |
| < 200 | 🔴 ABORT — only UI tasks |

## Implementation

- **Endpoint**: `GET /ram` (server/index.js)
- **Check**: `vm_stat` → Pages free + inactive → MB
- **Hook**: `tool.execute.before` in ram-guard.ts plugin

## Plugin (Phase 5.2)

File: `.opencode/plugins/ram-guard.ts` (to be created in Phase 5.3)

- Hooks into `tool.execute.before`
- Aborts if RAM < 200MB
- Restricts cloud tools if RAM < 400MB

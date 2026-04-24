---
title: OpenCode Plugins
date: 2026-04-24
tags: [concept, plugins, phase5.2]
---

# OpenCode Plugins

Phase 5.2 — Native OpenCode plugins for Shadow Stack.

## Created Plugins (Phase 5.2)

| Plugin | File | Purpose |
|--------|------|---------|
| vercel-deploy | `.opencode/plugins/vercel-deploy.ts` | Deploy to Vercel via CLI |
| env-protection | `.opencode/plugins/env-protection.ts` | Block secrets in commits |
| react-validator | `.opencode/plugins/react-validator.ts` | Check React best practices |

## Plugin Architecture

- **Location**: `.opencode/plugins/` (project) or `~/.config/opencode/plugins/` (global)
- **Format**: Async function exporting hooks + tools
- **Registration**: `opencode.json` → `"plugin": [...]`
- **Dependencies**: `@opencode-ai/plugin` in `.opencode/package.json`

## Adapter Pattern (Phase 5.2 design)

- **Source of truth**: `.agent/skills/*/SKILL.md` (23 skills)
- **Meta-loader**: `shadow-stack-adapter.ts` (reads SKILL.md, registers tools)
- **Benefit**: Single source, no duplication, hot-reload

## Phase 5.3 — Plugin Marketplace

Next: Create npm registry `@shadow-stack/plugin-*` for distribution.

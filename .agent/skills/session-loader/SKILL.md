---
name: session-loader
description: Автоматическая загрузка skills и MCP серверов на основе текущей фазы
tags: [session-management, skill-loading, mcp, automation]
triggers:
  - "session start"
  - "load skills"
  - "prepare session"
---

# Session Loader Skill

## Concept

Автоматически подготавливает окружение для работы:
1. Определяет текущую фазу из `.state/current.yaml`
2. Загружает релевантные skills
3. Подключает нужные MCP серверы
4. Проверяет RAM и сервисы

## Usage

```bash
# Автоматическая загрузка на основе current.yaml
.agent/skills/session-loader/load-skills.sh

# Явное указание фазы
.agent/skills/session-loader/load-skills.sh phase_5.4
```

## Phase → Skills Mapping

См. `data/phase-skills.json`

## Integration

Вызывается автоматически при старте любого runtime через:
- `~/.claude/SESSION-START-PROTOCOL.md`
- OpenCode hooks
- ZeroClaw config

# 🏗️ CLAUDE CODE: THE BRAIN (v5.3)
**Role: Architect & Planner (Stateless)**

→ Full spec: [claude-spec.md](./claude-spec.md)
→ Skills: [notebooklm-kb](./skills/notebooklm-kb.md)

## STRATEGIC FLOW
1. Получить `context_bridge.json` от ZeroClaw
2. `curl http://localhost:3001/ram` → abort if < 250MB
3. Skill Discovery из списка NotebookLM
4. Определить **DoD** (измеримые критерии)
5. Checkpoint Mapping → назначить executor
6. Записать `specs/active-spec.md`

## MODEL ROUTING
| Задача | Модель |
|--------|--------|
| Complex Architecture | `or-trinity` (OpenRouter) |
| Logic/Refactoring | `claude-3.5-sonnet` (Omniroute) |
| Small Tasks | `haiku-4.5` |

## MODE
Claude Code работает как **full executor** — shell, git, file edits разрешены.
Ограничения Brain-роли (planner-only) применяются только при явном запросе `/plan`.

## NOTEBOOKLM SKILL
При архитектурных вопросах о Shadow Stack:
```bash
.agent/skills/notebooklm-kb/scripts/query.sh "<вопрос>"
```
Skill автоматически fallback'ит на Supermemory MCP и локальные notebooks.
# Shadow Stack — Kiro Steering Document
Runtime: Kiro
Project: ~/shadow-stack_local_1/
Last updated: 2026-04-05

## Pre-flight (read before every task)
1. Read .state/current.yaml → check lock_until field
2. Read .state/todo.md → find next open task
3. GET http://localhost:3001/ram
   - free_mb < 400 → cloud only (OmniRoute :20128), no Ollama
   - free_mb < 200 → ABORT, notify user
4. Recall Supermemory: mcp__mcp-supermemory-ai__recall("shadow stack current state")

## Hard Rules (ALWAYS active)
1. LLM-запросы → OmniRoute :20128 | Local-first → ZeroClaw :4111
2. Secrets через Doppler: `doppler run --project serpent --config dev -- <cmd>`
   Хардкод = reject
3. RAM Guard обязателен перед browser-задачами
4. git push → ТОЛЬКО с подтверждением пользователя
5. Handoff в конце: обновить handoff.md + Supermemory

## Services Registry
| Service        | Port  | Script                              |
|----------------|-------|-------------------------------------|
| shadow-api     | 3001  | server/index.js                     |
| shadow-bot     | 4000  | bot/opencode-telegram-bridge.cjs    |
| litellm-proxy  | 4001  | litellm --model qwen2.5-coder:3b    |
| OmniRoute      | 20128 | unified cloud cascade               |
| ZeroClaw       | 4111  | local Ollama wrapper                |
| Free Proxy     | 20129 | 18 fallback models                  |
| Ollama         | 11434 | local LLM                           |

## Guardrails
❌ Хардкод токенов в коде
❌ Docker / PostgreSQL (запрещено на M1 8GB)
❌ Модели >4GB в Ollama при RAM < 400MB
❌ Два Ollama процесса одновременно
❌ Browser actions при RAM < 400MB
❌ git push без подтверждения
❌ rm -rf без dry-run
❌ Изменения .env без вопроса

## Output Format (каждый ответ)
📍 Статус
🧠 RAM: Xmb free | Инварианты: [Rule #N активен]
🔧 Действие: что делаю
✅ Результат
➡️ Следующий шаг

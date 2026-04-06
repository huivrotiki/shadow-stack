# Shadow Stack — Kiro Steering Document
# Last updated: 2026-04-05k | Runtime: Kiro
Project: ~/shadow-stack_local_1/ | Branch: feat/portable-state-layer

## 🎯 Pre-flight (каждую задачу)
1. `cat .state/current.yaml | grep lock_until` → заблокировано → ABORT
2. `cat .state/todo.md` → взять первую открытую задачу
3. `curl localhost:3001/ram` → free_mb < 400 → cloud only | < 200 → ABORT
4. `mcp__mcp-supermemory-ai__recall("shadow stack current state")`

## ⚖️ Hard Rules
1. **LLM** → OmniRoute:20130 | Local → ZeroClaw:4111
2. **Secrets** → `doppler run --project serpent --config dev -- <cmd>`
3. **RAM Guard** → browser tasks требуют проверки перед запуском
4. **git push** → ТОЛЬКО после `user: confirm push? y/N`
5. **Handoff** → обновить handoff.md + Supermemory в КОНЦЕ сессии

## 🎛️ Combo Skills (OmniRoute)

### COMBO-1: Technical Auditor `/combo audit`
**Когда:** ревью кода, анализ логов, diff файлов
**Модель:** `ms-small` (точность > скорость)
```yaml
steps: [parse, cross_ref, refactor]
output: технический чеклист — критические ошибки → оптимизации → fixed_code
model: ms-small
max_tokens: 800
```

### COMBO-2: Agentic Architect `/combo arch`
**Когда:** новый микросервис, структура проекта, ТЗ
**Модель:** `gr-llama70b` (системная логика)
```yaml
steps: [expand, stack, filetree]
output: "🧱 Стек | 📁 Структура | ⚙️ Компоненты"
model: gr-llama70b
max_tokens: 1200
```

### COMBO-3: Content Orchestrator `/combo brand`
**Когда:** описания продуктов, Telegram-посты, AGENTS.md
**Модель:** `omni-sonnet` (эстетика + лаконичность)
```yaml
steps: [visual, copy, meta]
output: "концепт + техническое описание. Тон: экспертный, минималистичный"
model: omni-sonnet
max_tokens: 600
```

## 🛠️ Services Registry
| Service           | Port  | Script                           |
|-------------------|-------|----------------------------------|
| shadow-api        | 3001  | server/index.js                  |
| agent-bot         | 4000  | bot/opencode-telegram-bridge.cjs |
| zeroclaw-control  | 4111  | (внутри agent-bot)               |
| OmniRoute         | 20130 | omniroute (pm2: omniroute-kiro)  |
| free-models-proxy | 20129 | server/free-models-proxy.cjs     |
| sub-kiro          | 20131 | server/sub-agent.cjs             |
| Ollama            | 11434 | local LLM (RAM guard required)   |

## Cascade Chain (16 провайдеров)
omni-sonnet → gr-llama70b → gr-qwen3-32b → cb-llama70b → gem-2.5-flash
→ ms-small → or-nemotron → sn-llama70b → or-step-flash → hf-llama8b
→ nv-llama70b → fw-llama70b → co-command-r → hf-qwen72b → hf-llama70b
→ ol-qwen2.5-coder

## 🚫 Guardrails
❌ Хардкод токенов ❌ Docker/PostgreSQL (M1 8GB)
❌ >4GB модели при RAM<400 ❌ 2+ Ollama процесса
❌ git push без confirm ❌ синхронный I/O в server/

## 🔄 Output Format (ОБЯЗАТЕЛЬНО)
```
📍 Статус: [task] 🎛️ Combo: [audit|arch|brand|none]
🧠 RAM: Xmb | Инварианты: [Rule #N]
🔧 Действие: что делаю + команда
✅ Результат: [stdout]
➡️ Следующий шаг: [todo или handoff]
```

## MASTER PROMPT V2.0 — 5 HARD RULES

1. **Единый каскад**: любой LLM-запрос → OmniRoute :20130. Local-first Ollama → ZeroClaw :4111. Всё остальное — нарушение.
2. **Secrets через Doppler**: `doppler run --project serpent --config dev -- <cmd>`. Хардкод = reject.
3. **Notebook-first memory**: перед задачей читать `notebooks/{project}/INDEX.md`, после — сохранять summary через `memory.save()`.
4. **RAM Guard**: free_mb < 400 → только cloud (OmniRoute). < 200 → ABORT + Telegram alert.
5. **Handoff в конце**: обновлять `handoff.md` + пушить ключевые факты в Supermemory (соответствующий namespace).

Детали — в `docs/workflow-rules.md`.

---

# Agent Factory — Master Config

> Единственный источник правды для Claude Code в этом репозитории.
> Правила делегации → `.claude/rules/routing.md` (не дублировать здесь).

---

## RALPH Cycle (обязателен для каждой задачи)

```
0-A → 0-B → 0-C → 0-D → R → A → L → P → H
```

### Pre-Step Ritual (обязателен перед каждым шагом)

> Нельзя выполнять ни один шаг без этого ритуала.
> Порядок жёсткий: NotebookLM → Skills → Context Assembly → Execution.

**0-A — NotebookLM Query**
```bash
python3 agent-factory/scripts/notebooklm-query.py \
  --query "{task_instruction}" \
  --step-id "{step_id}" \
  --limit 3 \
  --output ".agent/context/step-{step_id}-nlm.json"
```
Notebook: `489988c4-0293-44f4-b7c7-ea1f86a08410`
Если недоступен → fallback в `data/gateway-memory.json` (keyword search).
Применяется ко ВСЕМ шагам: coding, planning, research, audit, optimize.

**0-B — Skill Loading**
- `coding` → `_base` + `executor`
- `reasoning/research` → `_base` + `researcher` + `notebooklm`
- `plan` → `_base` + `orchestrator`
- `audit` → `_base` + `auditor`
- `optimize` → `_base` + `executor` + `auditor` + `autoresearch`

**0-C — Context Assembly**
Собери: NotebookLM output + active-skills.md + memory decisions + git log + files list

**0-D — Pre-Step Log**
Записать в `factory/logs/log.json` статус готовности.

### RALPH Steps (после Pre-Step Ritual)

```
R — Retrieve    : Прочитать agent-factory-kb.md + Supermemory (тег: agent-factory)
A — Act         : Выполнить задачу согласно плану
L — Learn       : Зафиксировать что сработало / что нет
P — Persist     : Сохранить в Supermemory + обновить SESSION.md
H — Handoff     : Передать следующему агенту с контекстом
```

---

## Pre-flight Checklist (перед любой задачей)

1. Прочитать `.agent/knowledge/agent-factory-kb.md`
2. Запросить Supermemory: `memory-retrieve [tag: agent-factory]`
3. Проверить RAM: `vm_stat | grep free` → если < 400MB — только облако
4. Проверить квоты провайдеров → если > 90% → переключить каскад
5. Открыть `todo.md` → взять первую незаконченную задачу

---

## RAM Guard (M1 8GB)

| RAM free | Разрешено |
|----------|-----------|
| > 400MB  | Все провайдеры (Ollama + облако) |
| 200–400MB | Только облако (OpenRouter, Claude API) |
| < 200MB  | ABORT — сообщить в Telegram, подождать |

```bash
# Проверка перед запуском тяжёлой модели
FREE_MB=$(vm_stat | awk '/free/ {printf "%d", $3*4096/1048576}')
[ "$FREE_MB" -lt 400 ] && echo "⚠️ RAM LOW: ${FREE_MB}MB" && exit 1
```

**Ollama правило:** `OLLAMA_MAX_LOADED_MODELS=1` — одна модель одновременно.

---

## 12-Tier LLM Routing (приоритет по порядку)

```
1.  Claude 3.7 Sonnet (omniroute)       — сложный код, архитектура
2.  Claude 3.5 Haiku (omniroute)        — быстрые задачи
3.  Gemini 2.0 Flash (openrouter free)  — ресёрч, длинный контекст
4.  Gemini 1.5 Flash (openrouter free)  — лёгкие задачи
5.  Qwen2.5-Coder 7B (openrouter free)  — код средней сложности
6.  Llama 3.3 70B (openrouter free)     — планирование, контент
7.  OmniRoute :20128 (search)           — автономный ресёрч/анализ
8.  OmniRoute :20128                    — unified cascade (30 моделей)
9.  shadow-coder (ollama local)         — оффлайн код (qwen2.5-coder:3b)
10. shadow-general (ollama local)       — оффлайн контент (llama3.2:3b)
11. ZeroClaw :4111                      — прокси к Ollama (ультра-лёгкий)
12. n8n :5678                           — emergency workflow автоматизация
```

**Pre-flight:** `curl -fsS http://127.0.0.1:20128/v1/models` — OmniRoute должен отвечать.
**Квоты:** anthropic > 90% → пропустить. openrouter > 90% → пропустить.
**Детали делегации:** → `.claude/rules/routing.md`

---

## 5 Agent Roles

### Orchestrator
- Читает PRD, создаёт todo.md, делегирует агентам
- Никогда не пишет код напрямую
- При блокировке → немедленный запрос человеку через Telegram

### Researcher
- Веб-парсинг, NotebookLM RAG, дайджесты
- Инструменты: OmniRoute (search), Perplexity, browser CDP
- Выход: structured_research.md

### Planner
- Декомпозиция задач на микро-шаги
- Формат: todo.md (каждый шаг = Definition of Done)
- Не начинает кодинг

### Executor
- Pre-Step Ritual: 0-A → 0-B → 0-C → 0-D (обязателен)
- Ralph Loop: R → A → L → P → H
- read PRD → pick task → implement → test → commit → repeat
- Лимит контекста → суммаризация через shadow-general → передача следующему

### Auditor
- QA + безопасность + проверка каскада (tag: cascade_bug)
- Стоп-фразы: "я не знаю", "попробуй сам", "это сложно"
- Коммит только после прохождения Auditor check

---

## Code Style

- Node.js: CJS (`require/module.exports`), не ESM
- Отступы: 2 пробела
- Комментарии: русский для архитектурных решений, английский для кода
- Логи: `log.json` в `factory/logs/`
- Никаких `console.log` в продакшне → `logger.info()`

---

## Правило неостанавливаемости

> Ни одна задача не пропускается. Если все провайдеры недоступны →
> обязательный запрос человеку через Telegram (@huivrotiki).
> Ждать ответа, не придумывать решения самостоятельно.

---

## Проект

- **Репо:** https://github.com/huivrotiki/agent-factory
- **Телеграм бот:** `/build "описание"` → автогенерация сайта → деплой Netlify
- **Деплой:** Netlify (только, без Vercel/Railway на старте)
- **Шаблоны:** landing-page (HTML+Tailwind CDN), react-spa, portfolio, business

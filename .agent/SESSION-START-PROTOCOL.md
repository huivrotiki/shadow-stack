# Session Start Protocol — Global Config

> Этот файл читается ВСЕМИ runtime'ами (OpenCode, Claude Code, ZeroClaw, Kiro, Antigravity) перед началом работы.

## Обязательный протокол начала сессии

### 1. Supermemory Recall (ВСЕГДА ПЕРВЫМ)

```bash
# Вызвать через MCP или API
mcp__mcp-supermemory-ai__recall "Shadow Stack architecture, current phase, blockers"
```

**Цель:** Загрузить контекст из прошлых сессий, архитектурные решения, известные проблемы.

### 2. NotebookLM Query — Общий план

```bash
~/.venv/notebooklm/bin/notebooklm ask "Какой общий план развития Shadow Stack? Какие фазы выполнены, какие остались?"
```

**Цель:** Понять big picture, текущий прогресс, приоритеты.

### 3. NotebookLM Query — Ближайшая фаза

```bash
~/.venv/notebooklm/bin/notebooklm ask "Что нужно сделать в следующей фазе? Какие конкретные шаги?"
```

**Цель:** Получить детальный план ближайшей работы.

### 4. Skill Loader — Подключение нужных skills

```bash
# Автоматически загрузить skills на основе фазы
.agent/skills/session-loader/load-skills.sh <phase>
```

**Что делает:**
- Читает `.state/current.yaml` → определяет текущую фазу
- Загружает метаданные всех skills из `.agent/skills/*/SKILL.md`
- Активирует только релевантные skills для текущей фазы
- Подключает нужные MCP серверы

### 5. MCP Connection Check

```bash
# Проверить статус MCP серверов
opencode mcp list
```

**Обязательные MCP:**
- Supermemory: ✅ connected
- Vercel (опционально): ⚠️ needs auth

### 6. Plan Check

```bash
# Проверить наличие плана
if [ ! -f ".state/current.yaml" ]; then
  echo "⚠️  План отсутствует — начинаю планирование"
  # Вызвать NotebookLM для создания плана
  ~/.venv/notebooklm/bin/notebooklm ask "Создай детальный план для текущей фазы Shadow Stack"
  # Записать в .state/current.yaml
fi
```

### 7. Execution Start

```bash
# Только после выполнения шагов 1-6
echo "## $(date -u +%H:%M) · $RUNTIME · session_start" >> .state/session.md
# Приступить к работе
```

---

## Структура Session Loader Skill

```
.agent/skills/session-loader/
├── SKILL.md              # Метаданные
├── load-skills.sh        # Главный скрипт
├── check-mcp.sh          # Проверка MCP
└── data/
    └── phase-skills.json # Маппинг фаз → skills
```

### phase-skills.json

```json
{
  "phase_5.2": {
    "skills": ["notebooklm-kb", "skillful", "vibeguard"],
    "mcp": ["supermemory"]
  },
  "phase_5.3": {
    "skills": ["cli-anything", "ui-dashboard-designer", "notebooklm-kb"],
    "mcp": ["supermemory"]
  },
  "phase_6": {
    "skills": ["chromadb-migration", "notebooklm-kb"],
    "mcp": ["supermemory", "chromadb"]
  }
}
```

---

## Интеграция с runtime'ами

### OpenCode

Добавить в `~/.config/opencode/hooks/session-start.sh`:
```bash
#!/bin/bash
source ~/.claude/SESSION-START-PROTOCOL.md
```

### Claude Code

Добавить в `.claude/launch.json`:
```json
{
  "preSessionScript": "~/.claude/SESSION-START-PROTOCOL.md"
}
```

### ZeroClaw

Добавить в `agent-factory/.agent/zeroclaw/config.toml`:
```toml
[session]
pre_start_script = "~/.claude/SESSION-START-PROTOCOL.md"
```

### Kiro / Antigravity

Добавить в `.kiro/hooks/session-start.md`:
```markdown
# Session Start Hook
Execute: ~/.claude/SESSION-START-PROTOCOL.md
```

---

## Fallback Strategy

Если NotebookLM CLI не работает:
1. Открыть Web UI: https://notebooklm.google.com/notebook/489988c4-0293-44f4-b7c7-ea1f86a08410
2. Использовать локальный fallback: `.agent/skills/notebooklm-kb/scripts/fallback-search.sh`
3. Читать `handoff.md` и `.state/current.yaml` напрямую

Если Supermemory MCP не работает:
1. Проверить auth: `opencode mcp auth supermemory`
2. Использовать локальную память: `notebooks/shadow-stack/`
3. Читать `.agent/decisions.md`

---

## Пример полного цикла

```bash
# 1. Supermemory
mcp__mcp-supermemory-ai__recall "Shadow Stack current state"

# 2. NotebookLM — общий план
~/.venv/notebooklm/bin/notebooklm ask "Общий план Shadow Stack?"

# 3. NotebookLM — ближайшая фаза
~/.venv/notebooklm/bin/notebooklm ask "Что делать в Phase 5.4?"

# 4. Load skills
.agent/skills/session-loader/load-skills.sh phase_5.4

# 5. Check MCP
opencode mcp list

# 6. Check plan
cat .state/current.yaml

# 7. Start work
echo "## $(date -u +%H:%M) · opencode · session_start" >> .state/session.md
# → Приступить к Phase 5.4
```

---

## Обязательные правила

1. **НИКОГДА не пропускать шаги 1-3** (Supermemory + NotebookLM queries)
2. **ВСЕГДА проверять MCP статус** перед работой
3. **ВСЕГДА логировать session_start** в `.state/session.md`
4. **Если плана нет** — сначала планирование, потом execution
5. **Между фазами** — обновлять `handoff.md` и `.state/current.yaml`

---

## Время выполнения протокола

- Supermemory recall: ~2-3 секунды
- NotebookLM queries (2x): ~10-15 секунд
- Skill loading: ~1-2 секунды
- MCP check: ~1 секунда
- **Total:** ~15-20 секунд

**Это инвестиция в качество работы — не пропускать!**

---

## Supermemory Indexing (Automatic)

### Skills & MCP Registry

**File:** `.agent/SKILLS-MCP-REGISTRY.md`

При каждом старте сессии, Supermemory автоматически индексирует:
- 24 skills с описаниями и тегами
- 2 MCP сервера (статус, endpoints)
- Phase → Skills mapping
- Usage примеры

**Query примеры:**
```
"Какие skills для работы с памятью?"
→ notebooklm-kb, memory-store, memory-retrieve, memory, kb

"Какие skills для генерации?"
→ cli-anything, ui-dashboard-designer

"Какие MCP серверы доступны?"
→ Supermemory (connected), Vercel (needs auth)

"Какие skills для Phase 6?"
→ chromadb-migration, notebooklm-kb, memory
```

### Автоматическое обновление

При добавлении нового skill:
1. Создать `.agent/skills/<name>/SKILL.md`
2. Обновить `.agent/SKILLS-MCP-REGISTRY.md`
3. Commit → Supermemory автоматически переиндексирует

### Глобальное правило

**Для всех runtime'ов (OpenCode, Claude Code, ZeroClaw, Kiro, Antigravity):**

При старте сессии:
1. Supermemory recall → загрузить контекст
2. NotebookLM query → получить план
3. **Supermemory recall "skills registry"** → увидеть доступные skills
4. Session Loader → загрузить релевантные skills
5. Start work

**Это обеспечивает:**
- Быстрый доступ к списку skills
- Автоматический выбор релевантных skills
- Единый источник истины для всех runtime'ов

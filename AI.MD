# AI.MD — Master AI Rules & Session Protocol

> **Главный файл правил работы ИИ в проекте Shadow Stack**
> 
> Этот файл определяет обязательные протоколы для всех AI runtime (OpenCode, Claude Code, ZeroClaw, Telegram bot)

---

## 📋 ОБЯЗАТЕЛЬНЫЙ ПРОТОКОЛ ПЕРЕД КАЖДОЙ ФАЗОЙ

### 1. Memory First (ВСЕГДА)

Перед началом любой нетривиальной задачи:

```javascript
// 1. Supermemory — долгосрочная память
const context = await supermemory.search(taskDescription, { limit: 3 });

// 2. NotebookLM — база знаний проекта
const bestPractices = await notebooklm.ask(taskDescription);

// 3. Анализ доступных навыков
const relevantSkills = await findRelevantSkills(taskDescription);

// 4. Проверка MCP серверов
const mcpTools = await listAvailableMCPTools();
```

### 2. Session Start Protocol

При открытии сессии (автоматически через `scripts/session-context-loader.sh`):

1. ✅ Прочитать `.state/current.yaml` — активный runtime, lock
2. ✅ Прочитать `handoff.md` — последняя сессия
3. ✅ Прочитать `.state/session.md` — текущая сессия
4. ✅ Прочитать `.state/todo.md` — открытые задачи
5. ✅ Прочитать `AI.MD` (этот файл) — правила работы
6. ✅ Вызвать Supermemory — загрузить контекст проекта
7. ✅ Вызвать NotebookLM — загрузить активный notebook
8. ✅ Проверить RAM — определить доступные модели

### 3. Ralph Loop Integration

Каждая фаза Ralph Loop должна включать:

```
IDLE → [MEMORY CHECK] → READ → [SKILL DISCOVERY] → PLAN → [MCP CHECK] → EXEC → TEST → COMMIT → [MEMORY SAVE] → SYNC
```

**Новые шаги:**
- **[MEMORY CHECK]** — вызов Supermemory + NotebookLM
- **[SKILL DISCOVERY]** — поиск релевантных навыков
- **[MCP CHECK]** — проверка доступных MCP инструментов
- **[MEMORY SAVE]** — сохранение результатов в Supermemory

---

## 🧠 MEMORY INTEGRATION

### Supermemory (долгосрочная память)

**Когда вызывать:**
- Перед началом сложной задачи
- При встрече с известной проблемой
- После решения нетривиального бага

**Как вызывать:**
```bash
# Поиск
mcp__mcp-supermemory-ai__recall "описание задачи"

# Сохранение
mcp__mcp-supermemory-ai__memory "решение проблемы" --tags "bug,fix,shadow-stack"
```

### NotebookLM (база знаний)

**Когда вызывать:**
- Вопросы по архитектуре Shadow Stack
- Вопросы по LLM mesh / agent-factory
- Вопросы по NVIDIA / OpenClaw / Claude Code

**Как вызывать:**
```bash
~/.venv/notebooklm/bin/notebooklm ask "вопрос"
```

**Fallback:** Если NotebookLM недоступен → использовать Supermemory MCP

---

## 🔌 SKILLS & PLUGINS

### Автоматическое определение навыков

Перед каждой задачей проверять:

1. **Доступные skills** в `.agent/skills/`
2. **GitHub skills cache** в `~/.cache/zeroclaw-skills`
3. **MCP servers** в `.kiro/settings/mcp.json`

### Приоритет навыков

1. **Встроенные skills** (`.agent/skills/`) — высший приоритет
2. **GitHub skills** (кэшированные) — средний приоритет
3. **MCP tools** — используются по необходимости

### Примеры использования

```javascript
// Определение релевантных навыков
const skills = await glob('.agent/skills/*/SKILL.md');
const relevant = skills.filter(s => matchesTask(s, taskDescription));

// Загрузка skill
const skillContent = await read(relevant[0]);
// Применение инструкций из skill
```

---

## 🎯 MCP SERVERS

### Обязательные MCP серверы

1. **mcp-supermemory-ai** — долгосрочная память
   - URL: `https://mcp.supermemory.ai/mcp`
   - Auth: OAuth (SUPERMEMORY_API_KEY)

2. **filesystem** — доступ к файлам
   - Paths: `shadow-stack_local_1`, `agent-factory`

3. **kapture-mcp** — скриншоты и автоматизация (опционально)

### Проверка доступности

```bash
# Список активных MCP серверов
cat .kiro/settings/mcp.json | jq '.mcpServers | keys'
```

---

## 📊 RAM GUARD

### Обязательная проверка перед задачей

```bash
curl http://localhost:3001/ram
```

**Правила:**
- `free_mb > 500` → все модели доступны
- `free_mb 200-500` → только облачные модели + ollama-3b
- `free_mb < 200` → ABORT, освободить память

### Выбор моделей по RAM

| RAM | Доступные модели |
|-----|------------------|
| > 500MB | Все (включая ollama-7b, browser) |
| 200-500MB | Cloud + ollama-3b (без browser) |
| < 200MB | ABORT (критично) |

---

## 🔄 SESSION LIFECYCLE

### 1. Session Open

```bash
# Автоматически через session-context-loader.sh
1. Check .state/current.yaml
2. Load handoff.md
3. Load .state/session.md
4. Load .state/todo.md
5. Load AI.MD (этот файл)
6. Call Supermemory (recall)
7. Call NotebookLM (if available)
8. Check RAM
9. Log session_open to .state/session.md
```

### 2. During Session

```bash
# Перед каждой фазой Ralph Loop
1. Memory check (Supermemory + NotebookLM)
2. Skill discovery
3. MCP tools check
4. RAM check
5. Execute task
6. Save results to memory
```

### 3. Session Close

```bash
1. Update handoff.md
2. Commit .state/ changes
3. Save key learnings to Supermemory
4. Log session_close to .state/session.md
```

---

## 🚨 CRITICAL RULES

### 1. НИКОГДА не пропускать Memory Check

Перед любой нетривиальной задачей:
- ✅ Вызвать Supermemory
- ✅ Вызвать NotebookLM (если доступен)
- ✅ Проверить релевантные skills

### 2. ВСЕГДА сохранять результаты

После решения проблемы:
- ✅ Сохранить в Supermemory
- ✅ Обновить handoff.md
- ✅ Обновить .state/session.md

### 3. ВСЕГДА проверять RAM

Перед запуском:
- ✅ Ollama моделей (особенно 7b)
- ✅ Browser automation
- ✅ Параллельных задач

### 4. ВСЕГДА использовать Ralph Loop

Структура:
```
IDLE → [MEMORY] → READ → [SKILLS] → PLAN → [MCP] → EXEC → TEST → COMMIT → [SAVE] → SYNC
```

---

## 📝 ПРИМЕРЫ

### Пример 1: Начало новой задачи

```javascript
// 1. Memory check
const context = await supermemory.search("implement feature X");
const practices = await notebooklm.ask("best practices for feature X");

// 2. Skill discovery
const skills = await glob('.agent/skills/*/SKILL.md');
const relevant = skills.filter(s => s.includes('feature-x'));

// 3. MCP check
const mcpTools = await listMCPTools();
const needed = mcpTools.filter(t => t.name.includes('filesystem'));

// 4. RAM check
const ram = await fetch('http://localhost:3001/ram').then(r => r.json());
if (ram.free_mb < 200) throw new Error('RAM critical');

// 5. Execute
await executeTask();

// 6. Save
await supermemory.save("feature X implemented successfully", {
  tags: "feature,implementation,shadow-stack"
});
```

### Пример 2: Session Start

```bash
#!/bin/bash
# Автоматически через session-context-loader.sh

echo "Starting AI session..."

# 1. Load state
cat .state/current.yaml
cat handoff.md | tail -50
cat AI.MD

# 2. Memory
mcp__mcp-supermemory-ai__recall "shadow-stack current state"

# 3. NotebookLM
~/.venv/notebooklm/bin/notebooklm ask "what are current priorities?"

# 4. RAM
curl http://localhost:3001/ram

# 5. Log
echo "## $(date +%H:%M) · $(whoami) · session_open" >> .state/session.md
```

---

## 🎯 INTEGRATION POINTS

### 1. session-context-loader.sh

Добавить вызовы:
- Supermemory recall
- NotebookLM ask
- Skills discovery
- MCP check

### 2. Ralph Loop

Интегрировать новые фазы:
- [MEMORY CHECK]
- [SKILL DISCOVERY]
- [MCP CHECK]
- [MEMORY SAVE]

### 3. handoff.md

Всегда обновлять:
- Использованные skills
- Вызовы памяти
- Ключевые решения

---

## 📚 REFERENCES

- `.state/current.yaml` — текущее состояние
- `handoff.md` — история сессий
- `.agent/soul.md` — identity проекта
- `AGENTS.md` — архитектура агентов
- `CLAUDE.md` — правила для Claude
- `docs/SERVICES.md` — карта сервисов

---

**Версия:** 1.0  
**Дата создания:** 2026-04-06  
**Последнее обновление:** 2026-04-06 17:37


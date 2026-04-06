---
name: skillful
description: Ленивая загрузка подсказок — агент видит только метаданные, полный SKILL.md загружается при совпадении триггера
tags: [context-optimization, lazy-loading, memory-efficiency]
triggers:
  - "load skill"
  - "activate skill"
  - "use skill"
---

# Skillful — Context Optimization Pattern

## Concept

Вместо загрузки всех skills в контекст сразу, агент видит только:
- Название skill
- Краткое описание (1 строка)
- Триггеры

Полный `SKILL.md` загружается только когда:
1. Пользователь явно запрашивает skill
2. Триггер совпадает с запросом
3. Агент решает, что skill релевантен

## Implementation

### 1. Структура skills
```
.agent/skills/
├── skill-name/
│   ├── SKILL.md          # Полные инструкции (загружается по требованию)
│   ├── scripts/          # Исполняемые файлы
│   └── data/             # Локальное состояние
```

### 2. Metadata-first loading

Агент сначала читает только YAML frontmatter:
```yaml
---
name: skill-name
description: Краткое описание (1 строка)
tags: [tag1, tag2]
triggers: [trigger1, trigger2]
---
```

### 3. Full load on demand

Когда триггер совпадает:
```bash
# Агент читает полный SKILL.md
cat .agent/skills/skill-name/SKILL.md
```

## Benefits

- **Экономия контекста:** 8192 токена → только метаданные (50-100 токенов на skill)
- **Быстрый поиск:** grep по триггерам вместо чтения всех файлов
- **Масштабируемость:** 100+ skills без переполнения контекста

## Usage

```bash
# Список всех skills (только метаданные)
find .agent/skills -name "SKILL.md" -exec head -10 {} \;

# Поиск по триггеру
grep -r "trigger-keyword" .agent/skills/*/SKILL.md

# Загрузка полного skill
cat .agent/skills/skill-name/SKILL.md
```

## Integration with OpenCode

OpenCode автоматически применяет этот паттерн:
1. При старте сканирует `.agent/skills/`
2. Индексирует метаданные
3. Загружает полный skill только при совпадении триггера

## Example

**Metadata (всегда в контексте):**
```yaml
name: notebooklm-kb
description: RAG к базе знаний через NotebookLM
triggers: ["спроси notebooklm", "knowledge query"]
```

**Full skill (загружается по требованию):**
- Полные инструкции (500+ строк)
- Примеры использования
- Fallback стратегии

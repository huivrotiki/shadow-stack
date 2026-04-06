# Task Folder Pattern — Prompt-Driven Architecture

> **Принцип:** Вместо 1000 строк кода на Python для обработки логики "если юзер сказал А, сделай Б", создаём папку "Б" с файлом "Инструкция". ИИ сам поймёт, когда туда "зайти", основываясь на смысле запроса, а не на жёстком коде.

---

## Структура задачи (3 файла)

Для каждой новой задачи создаётся папка с тремя обязательными файлами:

### 1. `instructions.txt`

```
Ты — агент-исполнитель задачи [Название задачи].

Твоя цель: [Описание цели].

Твои шаги:
1. [Шаг 1]
2. [Шаг 2]
3. [Шаг 3]

Ограничения:
- Не выходи за рамки папки этой задачи
- Если данных не хватает, обратись к родительской папке
- Используй только инструменты из tools.json

Контекст:
- Читай context.md перед началом работы
- Обновляй context.md после завершения
```

### 2. `tools.json`

```json
{
  "available_tools": [
    {
      "name": "mcp_web_search",
      "description": "Поиск актуальной информации в сети",
      "parameters": { "query": "string" }
    },
    {
      "name": "read_file",
      "description": "Чтение файла из текущей папки",
      "parameters": { "path": "string" }
    }
  ],
  "deprecated_tools": []
}
```

### 3. `context.md`

```markdown
# Контекст задачи

## История выполнения
- 2026-04-06: Задача создана
- 2026-04-06: Первый запуск

## Данные
- [Ключевые данные для задачи]
- [История прошлых результатов]

## Зависимости
- Родительская папка: ../
- Связанные задачи: []
```

---

## Иерархия папок

```
/Project/                           # Корень — главный конфиг и глобальные переменные
├── .agent/
│   ├── soul.md                     # Identity проекта
│   ├── TASK-FOLDER-PATTERN.md      # Этот файл
│   └── tasks/                      # Корневая папка всех задач
│       ├── Marketing_Agent/        # Процесс — общая стратегия
│       │   ├── instructions.txt
│       │   ├── tools.json
│       │   ├── context.md
│       │   └── Write_Post/         # Задача — конкретное действие
│       │       ├── instructions.txt
│       │       ├── tools.json
│       │       └── context.md
│       └── DevOps_Agent/
│           ├── instructions.txt
│           ├── tools.json
│           ├── context.md
│           └── Deploy_Service/
│               ├── instructions.txt
│               ├── tools.json
│               └── context.md
```

---

## Промпт для авто-адаптации

**Цель:** Система не "ломается" при обновлении модели. Если модель получила новую встроенную функцию, кастомные инструменты автоматически помечаются как deprecated.

**Промпт (добавить в SESSION-START-PROTOCOL.md):**

```
## Auto-Adaptation Check

Перед началом сессии:

1. Проверь capabilities текущей модели (native functions)
2. Пройдись по всем `tools.json` в `.agent/tasks/**/*`
3. Для каждого инструмента:
   - Если модель теперь умеет это нативно → пометь как deprecated
   - Обнови `instructions.txt` → используй нативную функцию
   - Добавь запись в `context.md` с датой deprecation

Пример:
- Было: custom tool "generate_image" через DALL-E API
- Стало: модель умеет генерировать изображения нативно
- Действие: пометить "generate_image" как deprecated, обновить instructions.txt

Формат записи в tools.json:
```json
{
  "deprecated_tools": [
    {
      "name": "generate_image",
      "reason": "Model now supports native image generation",
      "deprecated_at": "2026-04-06",
      "replacement": "Use native model.generate_image() instead"
    }
  ]
}
```
```

---

## Визуализация архитектуры

| Уровень | Элемент | Содержимое |
|---|---|---|
| Корень | `/Project/` | Главный конфиг и глобальные переменные |
| Процесс | `.../Marketing_Agent/` | Общая стратегия и доступ к соцсетям |
| Задача | `.../Marketing_Agent/Write_Post/` | Промпт для копирайтинга + база знаний о стиле |
| Данные | `.../Write_Post/context.md` | История прошлых постов и аналитика |

---

## Почему это эффективно?

1. **Семантическая навигация:** ИИ сам понимает, в какую папку "зайти", основываясь на смысле запроса
2. **Нет жёсткого кода:** Вместо `if user_said == "A": do_B()` просто создаём папку `B/`
3. **Самодокументирование:** Каждая задача содержит свою документацию
4. **Изоляция:** Задачи не влияют друг на друга
5. **Адаптивность:** Система сама обновляется при изменении capabilities модели

---

## Глобальное правило для всех runtime

**Добавить в `~/.claude/CLAUDE.md` и `AGENTS.md`:**

```markdown
## Task Folder Pattern

Перед выполнением любой задачи:

1. Проверь, есть ли папка `.agent/tasks/<task_name>/`
2. Если есть — прочитай `instructions.txt`, `tools.json`, `context.md`
3. Выполни задачу согласно инструкциям
4. Обнови `context.md` после завершения
5. Если папки нет — создай её по шаблону из `.agent/TASK-FOLDER-PATTERN.md`

**Приоритет инструкций:**
1. `.agent/tasks/<task_name>/instructions.txt` (самый высокий)
2. `.agent/soul.md`
3. `AGENTS.md`
4. `CLAUDE.md`
5. `~/.claude/CLAUDE.md`
```

---

## Пример: Marketing_Agent/Write_Post

**Структура:**

```
.agent/tasks/Marketing_Agent/
├── instructions.txt
├── tools.json
├── context.md
└── Write_Post/
    ├── instructions.txt
    ├── tools.json
    └── context.md
```

**Marketing_Agent/instructions.txt:**

```
Ты — Marketing Agent для Shadow Stack.

Твоя цель: Управлять всеми маркетинговыми активностями проекта.

Твои шаги:
1. Анализируй запрос пользователя
2. Определи подзадачу (Write_Post, Schedule_Post, Analyze_Metrics)
3. Делегируй выполнение соответствующей подзадаче
4. Собери результаты и отчитайся пользователю

Ограничения:
- Не выполняй подзадачи напрямую — делегируй
- Используй только инструменты из tools.json
- Обновляй context.md после каждой операции
```

**Marketing_Agent/Write_Post/instructions.txt:**

```
Ты — агент-исполнитель задачи "Написать пост для соцсетей".

Твоя цель: Создать пост в стиле Shadow Stack для указанной платформы.

Твои шаги:
1. Прочитай context.md — изучи стиль прошлых постов
2. Прочитай ../context.md — узнай общую маркетинговую стратегию
3. Используй mcp_web_search для актуальных трендов (если нужно)
4. Сгенерируй пост
5. Сохрани в context.md для будущих референсов

Ограничения:
- Длина поста: Twitter ≤280 символов, LinkedIn ≤3000
- Стиль: технический, но доступный
- Тон: дружелюбный, не корпоративный
- Эмодзи: только если явно запрошено
```

**Marketing_Agent/Write_Post/context.md:**

```markdown
# Контекст: Write_Post

## История постов

### 2026-04-06 — Twitter
"Shadow Stack теперь поддерживает GitHub Skills Registry — 450 skills из 12 репозиториев синхронизируются автоматически. Локальный AI-агент с памятью на стероидах 🚀"

### 2026-04-05 — LinkedIn
"Мы запустили Portable State Layer — теперь все runtime (Claude Code, OpenCode, ZeroClaw) делят единое состояние через `.state/`. Никаких потерь контекста между сессиями."

## Стиль
- Технические детали + практическая польза
- Конкретные цифры (450 skills, 12 репозиториев)
- Без хайпа и маркетинговых клише
- Эмодзи — только 1-2 в конце, если уместно

## Аналитика
- Twitter: средний engagement 3.2%
- LinkedIn: средний engagement 5.7%
- Лучшее время: 10:00-12:00 UTC
```

---

## Интеграция с существующей системой

**Добавить в `.state/current.yaml`:**

```yaml
task_folders:
  enabled: true
  root: .agent/tasks/
  auto_create: true
  auto_adapt: true
  check_on_session_start: true
```

**Добавить в `SESSION-START-PROTOCOL.md`:**

```markdown
## Step 4: Task Folders Check

1. Проверь `.agent/tasks/` на наличие задач
2. Запусти auto-adaptation check (см. TASK-FOLDER-PATTERN.md)
3. Если есть deprecated tools — обнови instructions.txt
4. Залогируй результат в `.state/session.md`
```

---

## Следующие шаги

1. Создать первую задачу: `.agent/tasks/GitHub_Skills_Sync/`
2. Мигрировать существующие skills из `.agent/skills/` в task folders
3. Добавить auto-adaptation check в SESSION-START-PROTOCOL.md
4. Обновить AGENTS.md с новым паттерном
5. Протестировать на реальной задаче

---

**Дата создания:** 2026-04-06  
**Автор:** OpenCode (shadow-stack_local_1)  
**Статус:** Draft — требует review и интеграции

# YouTube Agent OS — System Manifest

> **Мастер-Промпт:** Автономная система управления YouTube-каналом через папочную архитектуру

---

## Архитектура системы

```
📂 YouTube_Agent_OS/              <-- Корень системы
│
├── 📜 system_manifest.md          <-- Мастер-Промпт (этот файл)
│
├── 📂 Core_Brain/                <-- Агент-диспетчер (Главред)
│   ├── 📝 instructions.txt       # "Распределяй задачи между папками"
│   └── 📑 memory.md              # Текущее состояние канала и планы
│
├── 📂 Strategist/                <-- Агент-маркетолог
│   ├── 📝 instructions.txt       # "Формируй контент-план на месяц"
│   ├── 📊 channel_analytics.csv  # Данные (Data)
│   └── 📑 memory.md
│
├── 📂 Researcher/                <-- Агент-исследователь
│   ├── 📝 instructions.txt       # "Ищи тренды и пиши сценарии"
│   ├── 🛠️ tools.json             # Доступ к Google Search API, YouTube API
│   ├── 📥 raw_ideas/             # Папка для входящих данных
│   └── 📤 finished_scripts/      # Папка для готовых сценариев
│
└── 📂 Video_Maker/               <-- Агент-монтажер
    ├── 📝 instructions.txt       # "Создавай промпты для видео/миниатюр"
    ├── 🛠️ tools.json             # Доступ к DALL-E 3 и Midjourney
    └── 🎞️ asset_library/         # Хранилище ссылок на фоны и музыку
```

---

## Принципы работы

1. **Семантическая навигация:** Система сама понимает, в какую папку "зайти" на основе запроса
2. **Изоляция агентов:** Каждый агент работает только в своей папке
3. **Иерархия:** Core_Brain → Strategist → Researcher → Video_Maker
4. **Память:** Каждый агент ведёт свой `memory.md` для контекста между сессиями
5. **Инструменты:** `tools.json` определяет доступные API для каждого агента

---

## Workflow

### 1. Пользователь → Core_Brain
```
User: "Создай видео про AI-агентов"
Core_Brain: Анализирует запрос → делегирует Strategist
```

### 2. Strategist → Researcher
```
Strategist: "Нужен сценарий про AI-агентов, тренд растёт"
Researcher: Ищет тренды → пишет сценарий → сохраняет в finished_scripts/
```

### 3. Researcher → Video_Maker
```
Researcher: "Сценарий готов: finished_scripts/ai_agents_2026.md"
Video_Maker: Генерирует промпты для DALL-E → создаёт миниатюру
```

### 4. Video_Maker → Core_Brain → User
```
Video_Maker: "Миниатюра готова, промпт для видео готов"
Core_Brain: Собирает результаты → отчитывается пользователю
```

---

## Глобальные правила

1. **Каждый агент читает свой `instructions.txt` перед началом работы**
2. **Каждый агент обновляет свой `memory.md` после завершения задачи**
3. **Агенты не могут напрямую общаться — только через Core_Brain**
4. **Если данных не хватает — агент обращается к родительской папке или Core_Brain**
5. **Все внешние API вызовы только через `tools.json`**

---

## Интеграция с Shadow Stack

**Добавить в `.state/current.yaml`:**

```yaml
youtube_agent_os:
  enabled: true
  root: .agent/tasks/YouTube_Agent_OS/
  core_brain: Core_Brain/
  auto_delegate: true
```

**Добавить в `SESSION-START-PROTOCOL.md`:**

```markdown
## Step 5: YouTube Agent OS Check

1. Если запрос связан с YouTube/контентом — делегируй Core_Brain
2. Core_Brain прочитает system_manifest.md и распределит задачи
3. Результаты соберутся обратно в Core_Brain/memory.md
```

---

## Адаптация при обновлении модели

Если модель получила новую функцию (например, нативная генерация видео):

1. Core_Brain проверяет все `tools.json` в подпапках
2. Помечает устаревшие инструменты как deprecated
3. Обновляет `instructions.txt` → использовать нативную функцию
4. Логирует изменения в `memory.md`

---

**Дата создания:** 2026-04-06  
**Автор:** OpenCode (shadow-stack_local_1)  
**Статус:** Active — готов к использованию

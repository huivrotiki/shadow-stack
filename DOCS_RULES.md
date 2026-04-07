# DOCS.md — Правила поддержки мастер-индекса

## 🔒 КРИТИЧЕСКОЕ ПРАВИЛО

**DOCS.md — это единственный источник истины о структуре документации проекта SHD.**

### ❌ ЗАПРЕЩЕНО:
1. Переписывать DOCS.md без согласования
2. Удалять существующие номера [N]
3. Менять иерархию уровней (0-4)
4. Нарушать формат нумерации
5. Добавлять файлы без обновления DOCS.md

### ✅ РАЗРЕШЕНО:
1. Добавлять новые файлы с новыми номерами
2. Обновлять статистику
3. Добавлять новые категории в конец
4. Исправлять ошибки в путях (если файл переименован)

---

## 📋 ПРОТОКОЛ ДОБАВЛЕНИЯ НОВОГО ДОКУМЕНТА

### Шаг 1: Определить категорию
- Корневой документ (SHD/)
- docs/XX-category/
- .agent/
- .state/
- server/
- и т.д.

### Шаг 2: Присвоить следующий номер [N]
- Найти последний номер в категории
- Присвоить N+1

### Шаг 3: Создать файл
```bash
# Пример: добавить новый сервис в архитектуру
touch docs/03-architecture/new-service.md
```

### Шаг 4: Обновить DOCS.md
1. Открыть DOCS.md
2. Найти секцию `docs/03-architecture/`
3. Добавить строку:
   ```
   │   │   ├── [62] new-service.md    → Описание нового сервиса
   ```
4. Обновить статистику в таблице:
   ```
   | docs/03-architecture/ | 22 | +1 (было 21) |
   ```
5. Увеличить версию:
   ```
   **Версия:** 3.1
   **Последнее обновление:** 2026-04-07 11:20
   ```

### Шаг 5: Коммит
```bash
git add DOCS.md docs/03-architecture/new-service.md
git commit -m "docs(architecture): add new-service.md [62]"
```

---

## 🎯 УРОВНИ ПРИОРИТЕТА

### 🔴 Уровень 0 — Критические
Читать ВСЕГДА первыми при старте сессии:
- [00] AI.MD — Главные правила ИИ
- [01] AGENTS.md — Архитектура агентов
- [02] CLAUDE.md — Системный промпт
- [76] soul.md — Идентичность проекта

### 🟡 Уровень 1 — Состояние
Читать для понимания текущего контекста:
- [04] handoff.md — Отчёты между сессиями
- [110] current.yaml — Текущее состояние
- [111] session.md — Лог сессии
- [112] todo.md — Чеклист задач

### 🟢 Уровень 2 — Документация
Читать по необходимости (архитектура, планы)

### 🔵 Уровень 3 — Навыки
Читать при работе с конкретными навыками

### 🟣 Уровень 4 — Код
Читать при разработке/отладке

---

## 🔄 АВТОМАТИЧЕСКАЯ ВАЛИДАЦИЯ

### Git Hook (pre-commit)
При каждом коммите автоматически проверяется:
- Если добавлен новый .md файл → DOCS.md должен быть обновлен
- Нумерация последовательна
- Все файлы из DOCS.md существуют

### Установка hooks:
```bash
npm run install-hooks
# или
./scripts/install-hooks.sh
```

### Обход проверки (НЕ РЕКОМЕНДУЕТСЯ):
```bash
git commit --no-verify -m "..."
```

---

## 📊 ВАЛИДАЦИЯ ВРУЧНУЮ

```bash
# Проверить соответствие DOCS.md и файловой системы
npm run validate-docs

# или
./scripts/validate-docs-index.sh
```

Скрипт проверяет:
- ✅ Все файлы из DOCS.md существуют
- ✅ Все .md файлы в проекте есть в DOCS.md
- ✅ Нумерация последовательна
- ✅ Статистика актуальна

---

## 🚨 ЧТО ДЕЛАТЬ ПРИ КОНФЛИКТЕ

Если кто-то переписал DOCS.md без соблюдения правил:

### Вариант 1: Откат
```bash
git checkout HEAD~1 DOCS.md
git add DOCS.md
git commit -m "revert: restore DOCS.md structure"
```

### Вариант 2: Исправление
1. Открыть DOCS.md
2. Восстановить нумерацию
3. Добавить только валидные изменения
4. Следовать протоколу добавления

---

## 📌 ВЕРСИОНИРОВАНИЕ

- **Major (X.0)** — полная реструктуризация проекта
- **Minor (X.Y)** — добавление новых категорий/папок
- **Patch (X.Y.Z)** — добавление отдельных файлов

**Текущая версия:** 3.0 (2026-04-07)

---

## 🔐 ЗАЩИТА КРИТИЧЕСКИХ ФАЙЛОВ

Файлы, требующие review перед изменением:
- DOCS.md
- DOCS_RULES.md
- AI.MD
- AGENTS.md
- CLAUDE.md
- .agent/soul.md

См. `.github/CODEOWNERS`

---

## 📚 ДОПОЛНИТЕЛЬНЫЕ РЕСУРСЫ

- [CONTRIBUTING.md](CONTRIBUTING.md) — Как контрибутить в проект
- [CHANGELOG.md](CHANGELOG.md) — История изменений структуры
- [README.md](README.md) — Общее описание проекта

---

## 🎓 ПРИМЕРЫ

### Пример 1: Добавление нового плана
```bash
# 1. Создать файл
touch docs/01-plans/plan-2026-04-08.md

# 2. Отредактировать DOCS.md
# Добавить в секцию docs/01-plans/:
#   ├── [32] plan-2026-04-08.md  → План от 08.04.2026

# 3. Обновить статистику
# | docs/01-plans/ | 7 | +1 (было 6) |

# 4. Увеличить версию
# **Версия:** 3.0.1

# 5. Коммит
git add DOCS.md docs/01-plans/plan-2026-04-08.md
git commit -m "docs(plans): add plan-2026-04-08.md [32]"
```

### Пример 2: Добавление нового навыка
```bash
# 1. Создать папку и файл
mkdir -p .agent/skills/new-skill
touch .agent/skills/new-skill/SKILL.md

# 2. Отредактировать DOCS.md
# Добавить в секцию .agent/skills/:
#   │   └── [107] new-skill/SKILL.md → Новый навык

# 3. Обновить статистику
# | .agent/skills/ | 23 | +1 (было 22) |

# 4. Увеличить версию
# **Версия:** 3.0.2

# 5. Коммит
git add DOCS.md .agent/skills/new-skill/
git commit -m "feat(skills): add new-skill [107]"
```

---

## ⚠️ ЧАСТЫЕ ОШИБКИ

### Ошибка 1: Забыли обновить DOCS.md
```bash
# ❌ НЕПРАВИЛЬНО
touch docs/03-architecture/my-service.md
git add docs/03-architecture/my-service.md
git commit -m "add my service"
# → Git hook заблокирует коммит!

# ✅ ПРАВИЛЬНО
touch docs/03-architecture/my-service.md
# Обновить DOCS.md (добавить [62] my-service.md)
git add DOCS.md docs/03-architecture/my-service.md
git commit -m "docs(architecture): add my-service.md [62]"
```

### Ошибка 2: Неправильная нумерация
```bash
# ❌ НЕПРАВИЛЬНО
# Последний номер в категории: [61]
# Добавили: [65] (пропустили 62, 63, 64)

# ✅ ПРАВИЛЬНО
# Последний номер: [61]
# Добавляем: [62]
```

### Ошибка 3: Изменили путь файла, но не обновили DOCS.md
```bash
# ❌ НЕПРАВИЛЬНО
git mv docs/old-name.md docs/new-name.md
git commit -m "rename file"
# → DOCS.md всё ещё ссылается на old-name.md!

# ✅ ПРАВИЛЬНО
git mv docs/old-name.md docs/new-name.md
# Обновить DOCS.md (изменить путь)
git add DOCS.md docs/new-name.md
git commit -m "docs: rename old-name.md → new-name.md"
```

---

## 🔧 ТЕХНИЧЕСКАЯ РЕАЛИЗАЦИЯ

### Git Hook: pre-commit
Файл: `.git/hooks/pre-commit`

```bash
#!/bin/bash
# Проверка обновления DOCS.md при добавлении .md файлов

NEW_MD=$(git diff --cached --name-only --diff-filter=A | grep "\.md$")
if [ -n "$NEW_MD" ]; then
  DOCS_CHANGED=$(git diff --cached --name-only | grep "^DOCS.md$")
  if [ -z "$DOCS_CHANGED" ]; then
    echo "❌ ОШИБКА: Новый .md файл без обновления DOCS.md!"
    echo "📝 Файлы: $NEW_MD"
    echo "👉 Обновите DOCS.md согласно DOCS_RULES.md"
    exit 1
  fi
fi
exit 0
```

### Скрипт валидации: validate-docs-index.sh
Файл: `scripts/validate-docs-index.sh`

Проверяет:
1. DOCS.md существует
2. Все файлы из DOCS.md существуют в проекте
3. Все .md файлы в проекте есть в DOCS.md
4. Нумерация последовательна (нет пропусков)

---

**Версия правил:** 1.0  
**Дата создания:** 2026-04-07  
**Последнее обновление:** 2026-04-07 11:16  
**Автор:** SHD Team

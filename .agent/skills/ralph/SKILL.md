---
description: Autonomous coding loop — READ → PLAN → EXEC → TEST → COMMIT
---

# Ralph Loop — Автономный цикл кодинга

## Цикл

```
IDLE → READ → PLAN → EXEC → TEST → COMMIT → UPDATE → SYNC → IDLE
```

## Правила

### 1. READ — Изучение контекста
- Прочитать `CLAUDE.md` и `AGENTS.md` перед каждой задачей
- Проверить `git status` и `git diff` для понимания текущего состояния
- Вызвать `memory_retrieve` для поиска прошлых решений

### 2. PLAN — Планирование
- Создать `PLAN.md` с конкретными шагами
- Оценить RAM-бюджет (GET http://localhost:3001/ram)
- Если free_mb < 400 → упростить план, skip browser

### 3. EXEC — Реализация
- Sequential only — NO `Promise.all` для критических операций
- Каждый файл изменять только после чтения
- NO комментарии в коде (кроме JSDoc)

### 4. TEST — Проверка
- `npm test` или smoke-тест для изменённых файлов
- `npm run lint` если есть ESLint
- Проверить RAM после тяжёлых операций

### 5. COMMIT — Фиксация
- Формат: `type: short description`
- Types: `feat` / `fix` / `refactor` / `docs` / `chore`
- NO WIP commits
- NO секреты в коммитах

### 6. UPDATE — Обновление состояния
- Обновить `SESSION.md` с результатами
- Обновить `handoff.md` если были архитектурные решения
- Сохранить знания в `memory_store`

### 7. SYNC — Синхронизация
- `git push` только по запросу пользователя
- Telegram report о завершении задачи

## Правило «Чистого контекста»

- Перед каждой новой задачей — `/compact` или сброс контекста
- Не переполнять RAM контекстом (M1 8GB ограничение)
- Compaction threshold: 80% контекста использовано

## Persistence

После каждой успешной итерации — обязательный коммит:
```
✅ task: <описание задачи>
```

## RAM Guard

Перед EXEC:
```bash
curl -s http://localhost:3001/ram
```
- < 200MB → ABORT
- < 400MB → skip browser, ollama-3b only
- > 400MB → full mode

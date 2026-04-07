# Contributing to SHD

Спасибо за интерес к проекту SHD! Этот документ описывает, как правильно добавлять новые документы и изменения.

## 📋 Процесс контрибуции

### 1. Fork & Clone
```bash
git clone https://github.com/YOUR_USERNAME/SHD.git
cd SHD
```

### 2. Создать ветку
```bash
git checkout -b docs/add-my-feature
```

### 3. Установить hooks
```bash
npm run install-hooks
```

### 4. Внести изменения

#### Добавление нового документа:
1. Создать файл в соответствующей папке
2. Обновить DOCS.md (следуя DOCS_RULES.md)
3. Присвоить номер [N]
4. Обновить статистику

#### Изменение существующего документа:
1. Отредактировать файл
2. Если изменилось название/путь → обновить DOCS.md

### 5. Валидация
```bash
npm run validate-docs
```

### 6. Коммит
```bash
git add .
git commit -m "docs(category): description [N]"
```

Формат коммита:
- `docs(architecture): add new-service.md [62]`
- `docs(plans): update roadmap [31]`
- `fix(docs): correct path in DOCS.md`

### 7. Push & PR
```bash
git push origin docs/add-my-feature
```

Создать Pull Request на GitHub.

## 🔒 Правила

### ❌ ЗАПРЕЩЕНО:
- Переписывать DOCS.md без обновления структуры
- Удалять номера [N]
- Менять иерархию без обсуждения
- Добавлять файлы без обновления DOCS.md

### ✅ РАЗРЕШЕНО:
- Добавлять новые документы (с обновлением DOCS.md)
- Исправлять опечатки
- Улучшать существующие документы
- Предлагать новые категории (через issue)

## 📊 Checklist перед PR

- [ ] Новый файл создан в правильной папке
- [ ] DOCS.md обновлен (добавлена строка с [N])
- [ ] Статистика в DOCS.md обновлена
- [ ] Версия DOCS.md увеличена (X.Y.Z)
- [ ] `npm run validate-docs` прошел успешно
- [ ] Коммит следует формату `docs(category): description [N]`
- [ ] PR описание содержит причину изменения

## 🚨 Review Process

1. Автоматическая проверка (GitHub Actions)
2. Review от maintainer
3. Merge в main

## 📚 Дополнительно

- [DOCS_RULES.md](DOCS_RULES.md) — Детальные правила
- [README.md](README.md) — Общее описание

---

Спасибо за вклад в SHD! 🙏

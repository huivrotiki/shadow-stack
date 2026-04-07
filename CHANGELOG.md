# Changelog

Все значимые изменения в структуре SHD документируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [3.0.0] - 2026-04-07

### Added
- 🎉 Первый релиз SHD (Shadow Stack Documentation)
- ✅ DOCS.md v3.0 — мастер-индекс 146 документов
- ✅ DOCS_RULES.md — правила поддержки структуры
- ✅ Git hooks для автоматической валидации
- ✅ GitHub Actions для CI/CD
- ✅ CODEOWNERS для защиты критических файлов
- ✅ Скрипт validate-docs-index.sh
- ✅ Полная структура папок (docs/, .agent/, .state/, etc.)
- ✅ Шаблоны (_template.md) в каждой категории
- ✅ README.md с описанием проекта
- ✅ CONTRIBUTING.md с правилами контрибуции
- ✅ CHANGELOG.md (этот файл)

### Structure
- 📁 docs/ — 57 файлов (00-overview, 01-plans, 02-projects, 03-architecture, 04-security, 05-heads, 99-archive, plans, prompts, superpowers)
- 📁 .agent/ — 34 файла (9 конфигурационных + 22 навыка + 3 задачи)
- 📁 .state/ — 5 файлов (portable state layer)
- 📁 notebooks/ — 9 файлов (NotebookLM база знаний)
- 📁 workflows/ — 4 файла (ralph-loop, compact, handoff, reset)
- 📁 templates/ — 4 файла (шаблоны документов)
- 📁 logs/ — 2 файла
- 📁 autosaves-and-commits/ — 1 файл
- 📁 server/ — 11 файлов (структура серверного кода)
- 📁 bot/ — 1 файл (Telegram bridge)

### Changed
- 📝 Обновлена нумерация документов [00]-[146]
- 📝 Добавлены новые категории: docs/plans/, docs/prompts/, docs/superpowers/
- 📝 Детализированы .agent/skills/ (22 навыка)
- 📝 Детализированы .agent/tasks/ (3 задачи)
- 📝 Детализированы notebooks/ (shadow-stack + agent-factory)

### Removed
- ❌ Удалена несуществующая папка memory/ из структуры

---

## [Unreleased]

### Planned
- [ ] Автоматическая генерация DOCS.md из файловой системы
- [ ] Web-интерфейс для навигации по документации
- [ ] Интеграция с NotebookLM
- [ ] Поддержка мультиязычности (EN/RU)
- [ ] CI/CD pipeline для автоматической валидации
- [ ] Docker контейнер с полной структурой
- [ ] VS Code extension для работы с DOCS.md

---

**Формат версий:** MAJOR.MINOR.PATCH

- **MAJOR**: Полная реструктуризация
- **MINOR**: Новые категории/папки
- **PATCH**: Отдельные файлы

---

**Дата создания:** 2026-04-07  
**Последнее обновление:** 2026-04-07 11:18

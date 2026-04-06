# DOCS.md — Мастер-индекс документации проекта

> **Иерархия документов Shadow Stack Local**
> 
> Каждый файл пронумерован в формате [X.Y] с русским описанием назначения.

---

## 📁 СТРУКТУРА ПРОЕКТА (ИЕРАРХИЯ)

```
shadow-stack_local_1/
├── [00] AI.MD                          → Главные правила ИИ (протоколы, memory first)
├── [01] AGENTS.MD                      → Архитектура агентов и навыки
├── [02] CLAUDE.md                      → Системный промпт V2.0
├── [03] DOCS.md                        → Этот файл: мастер-индекс
├── [04] handoff.md                     → Отчёты между сессиями
├── [05] README.md                      → Общее описание проекта
├── [06] SECURITY.md                    → Правила безопасности
├── [07] PRD.md                         → Требования к продукту
├── [08] ORCHESTRATOR.md                → Архитектура оркестратора
├── [09] DOPPLER.md                     → Управление секретами
├── [10] RECOMMENDATIONS.md             → Рекомендации по улучшению
├── [11] SETUP-COMPLETE.md              → Статус настройки
├── [12] CLAUDE-HEALTH-DASHBOARD.md     → Мониторинг здоровья
├── [13] MODELS_RANKING.md              → Рейтинг моделей
├── [14] HANDOFF-2026-04-06.md          → Бэкап отчёта сессии
│
├── 📁 docs/                            → Документация проекта
│   ├── 📁 00-overview/                 → [15-19] Обзор и прогресс
│   │   ├── [15] project-summary.md     → Краткое описание проекта
│   │   ├── [16] setup-progress.md      → Прогресс настройки
│   │   ├── [17] prd-progress.md        → Прогресс по PRD
│   │   ├── [18] recommendations.md     → Общие рекомендации
│   │   ├── [19] MODELS_FULL_TABLE.md   → Полная таблица 106 моделей
│   │   └── [20] MODEL_LIMITS.md        → Лимиты моделей и провайдеров
│   │
│   ├── 📁 01-plans/                    → [21-28] Планы и задачи
│   │   ├── [21] global-plan.md         → Глобальный план
│   │   ├── [22] main-plan.md           → Основной план
│   │   ├── [23] detailed-plan.md       → Детальный план
│   │   ├── [24] current-tasks.md       → Текущие задачи
│   │   ├── [25] plan-2026-03-31.md     → План от 31.03.2026
│   │   └── [26] plan-v2-2026-04-04.md  → План V2 от 04.04.2026
│   │
│   ├── 📁 02-projects/                 → [27-36] Документы проектов
│   │   ├── 📁 zeroclaw/                → [27-30] ZeroClaw
│   │   │   ├── [27] overview.md        → Обзор ZeroClaw
│   │   │   ├── [28] architecture.md    → Архитектура ZeroClaw
│   │   │   ├── [29] roadmap.md         → План развития
│   │   │   └── [30] current-phase.md   → Текущая фаза
│   │   ├── 📁 claude/                  → [31-32] Claude
│   │   │   ├── [31] claude-hd.md       → Рабочий HD-документ Claude
│   │   │   └── [32] notes.md           → Заметки и наблюдения
│   │   ├── 📁 opencode/                → [33-34] OpenCode
│   │   │   ├── [33] overview.md        → Обзор OpenCode
│   │   │   └── [34] tasks.md           → Задачи и статус
│   │   └── 📁 antigravity/             → [35-36] Antigravity
│   │       ├── [35] overview.md        → Обзор Antigravity
│   │       └── [36] tasks.md           → Задачи и статус
│   │
│   ├── 📁 03-architecture/             → [37-52] Архитектура и сервисы
│   │   ├── [37] system-architecture.md → Общая архитектура системы
│   │   ├── [38] agents-architecture.md → Архитектура агентов
│   │   ├── [39] production.md          → Production-структура и правила
│   │   ├── [40] SERVICES.md            → Реестр сервисов (порты, URL, статус)
│   │   ├── [41] shadow-api.md          → Shadow API (:3001)
│   │   ├── [42] shadow-router.md       → Shadow Router (:3002)
│   │   ├── [43] telegram-bot.md        → Telegram Bot (:4000)
│   │   ├── [44] zeroclaw.md            → ZeroClaw (:4111)
│   │   ├── [45] ollama.md              → Ollama (локальные модели)
│   │   ├── [46] omniroute.md           → OmniRoute (облачный каскад)
│   │   ├── [47] free-models-proxy.md   → Free Models Proxy (:20129)
│   │   ├── [48] chromadb.md            → ChromaDB (векторная память)
│   │   ├── [49] health-dashboard.md    → Health Dashboard
│   │   ├── [50] omnirouter-lifehacks.md→ Лайфхаки OmniRouter
│   │   ├── [51] DESIGN_RULES.md        → Правила дизайна
│   │   ├── [52] TELEGRAM_BOTS.md       → Telegram боты
│   │   ├── [53] VERCEL_AI_GATEWAY.md   → Vercel AI Gateway
│   │   ├── [54] attention-optimization.md → Оптимизация внимания
│   │   └── [55] working-combos.md      → Рабочие комбинации
│   │
│   ├── 📁 04-security/                 → [56-59] Безопасность
│   │   ├── [56] security.md            → Базовые правила безопасности
│   │   ├── [57] secrets-policy.md      → Работа с токенами и секретами
│   │   ├── [58] access-matrix.md       → Доступы и зоны ответственности
│   │   └── [59] tailscale-integration.md → Интеграция Tailscale
│   │
│   ├── 📁 05-heads/                    → [60-61] Руководящие рекомендации
│   │   ├── [60] heads-of-recommendations.md → Сводка рекомендаций
│   │   └── [61] heads-of-production.md → Ключевые правила production
│   │
│   └── 📁 99-archive/                  → [62-63] Архив
│       ├── [62] deprecated-docs.md     → Устаревшие документы
│       └── [63] old-structures.md      → Старые структуры
│
├── 📁 memory/                          → [64-67] Память и контекст
│   ├── [64] supermemory.md             → Что читать и когда вызывать
│   ├── [65] notebook-global-phase.md   → Вызов LLM по глобальным фазам
│   ├── [66] notebook-local-phase.md    → Вызов LLM по локальной фазе
│   └── [67] context-rules.md           → Правила сброса/сжатия контекста
│
├── 📁 workflows/                       → [68-71] Рабочие циклы
│   ├── [68] ralph-loop.md              → Цикл: план → build → commit → review
│   ├── [69] compact-rules.md           → Compact на 50% контекста
│   ├── [70] handoff-rules.md           → Handoff на 60–70% контекста
│   └── [71] reset-session.md           → Сброс контекста / новая сессия
│
├── 📁 autosaves-and-commits/           → [72] Автосейвы и коммиты
│   ├── 📁 autosaves/
│   │   ├── 📁 synced/                  → Синхронизированные
│   │   └── 📁 unsynced/                → Не синхронизированные
│   ├── 📁 commits/
│   │   ├── 📁 synced/                  → Есть в git/remote
│   │   └── 📁 unsynced/                → Локально, не отправлены
│   └── [72] commit-log.md              → Реестр коммитов и статусов
│
├── 📁 templates/                       → [73-76] Шаблоны документов
│   ├── [73] doc-template.md            → Шаблон документа
│   ├── [74] plan-template.md           → Шаблон плана
│   ├── [75] task-template.md           → Шаблон задачи
│   └── [76] commit-template.md         → Шаблон коммита
│
├── 📁 logs/                            → [77-78] Логи
│   ├── [77] session-log.md             → Лог сессий
│   └── [78] changes-log.md             → Лог изменений
│
├── 📁 .agent/                          → [79-90] Конфигурация агентов
│   ├── [79] soul.md                    → Идентичность проекта
│   ├── [80] crons.md                   → Реестр периодических задач
│   ├── [81] decisions.md               → Архитектурные решения
│   ├── [82] implementation-plan.md     → План реализации
│   ├── [83] SESSION-START-PROTOCOL.md  → Протокол запуска сессии
│   ├── [84] SKILLS-MCP-REGISTRY.md     → Реестр навыков и MCP
│   ├── [85] TASK-FOLDER-PATTERN.md     → Паттерн папок задач
│   └── 📁 skills/                      → [86-90] Навыки агентов
│
├── 📁 .state/                          → [91-94] Портативный слой состояния
│   ├── [91] current.yaml               → Текущее состояние
│   ├── [92] session.md                 → Лог текущей сессии
│   ├── [93] todo.md                    → Чеклист задач
│   └── 📁 runtimes/                    → [94] Состояние рантаймов
│
├── 📁 server/                          → [95-105] Серверный код
│   ├── [95] index.js                   → Express сервер (:3001)
│   ├── [96] free-models-proxy.cjs      → Free Models Proxy (:20129)
│   └── 📁 lib/                         → [97-105] Библиотеки
│       ├── [97] llm-gateway.cjs        → LLM Gateway
│       ├── [98] router-engine.cjs      → Router Engine
│       ├── [99] speed-profiles.cjs     → Профили скорости
│       ├── [100] rate-limiter.cjs      → Rate Limiter
│       ├── [101] combo-race.cjs        → Combo Race (мета-модель)
│       └── 📁 providers/               → [102] Провайдеры
│           └── [102] castor-shadow.cjs → Castor Shadow Provider
│
└── 📁 bot/                             → [103] Telegram бот
    └── [103] opencode-telegram-bridge.cjs → Telegram Bridge
```

---

## 📋 КЛАССИФИКАЦИЯ ПО УРОВНЯМ

### 🔴 Уровень 0 — Критические (всегда читать первыми)
- [00] AI.MD — Главные правила ИИ
- [01] AGENTS.MD — Архитектура агентов
- [02] CLAUDE.md — Системный промпт
- [79] soul.md — Идентичность проекта

### 🟡 Уровень 1 — Состояние проекта
- [04] handoff.md — Отчёты между сессиями
- [91] current.yaml — Текущее состояние
- [92] session.md — Лог сессии
- [93] todo.md — Чеклист задач

### 🟢 Уровень 2 — Документация
- [21-26] docs/01-plans/ — Планы и задачи
- [37-55] docs/03-architecture/ — Архитектура
- [68-71] workflows/ — Рабочие циклы

### 🔵 Уровень 3 — Навыки и конфигурация
- [80] crons.md — Периодические задачи
- [84] SKILLS-MCP-REGISTRY.md — Реестр навыков
- [85] TASK-FOLDER-PATTERN.md — Паттерн задач

### 🟣 Уровень 4 — Код и инфраструктура
- [95-105] server/ — Серверный код
- [103] bot/ — Telegram бот

---

## 📊 СТАТИСТИКА

| Категория | Файлов | Описание |
|-----------|--------|----------|
| Корневые документы | 14 | Основные правила и описание |
| docs/00-overview/ | 6 | Обзор и прогресс |
| docs/01-plans/ | 6 | Планы и задачи |
| docs/02-projects/ | 10 | Документы проектов |
| docs/03-architecture/ | 19 | Архитектура и сервисы |
| docs/04-security/ | 4 | Безопасность |
| docs/05-heads/ | 2 | Руководящие рекомендации |
| docs/99-archive/ | 2 | Архив |
| memory/ | 4 | Память и контекст |
| workflows/ | 4 | Рабочие циклы |
| autosaves-and-commits/ | 1 | Автосейвы и коммиты |
| templates/ | 4 | Шаблоны документов |
| logs/ | 2 | Логи |
| .agent/ | 12 | Конфигурация агентов |
| .state/ | 4 | Портативный слой состояния |
| server/ | 11 | Серверный код |
| bot/ | 1 | Telegram бот |

**ИТОГО:** ~106 файлов документации

---

## 🔄 ПРОТОКОЛ ОБНОВЛЕНИЯ

При создании нового документа:
1. Определить уровень иерархии
2. Присвоить следующий номер [N]
3. Добавить в этот файл (DOCS.md)
4. Обновить статистику

---

**Версия:** 2.0  
**Дата создания:** 2026-04-06  
**Последнее обновление:** 2026-04-06 18:00


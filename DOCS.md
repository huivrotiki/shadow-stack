# DOCS.md — Мастер-индекс документации проекта

> **Иерархия документов Shadow Stack Local**
> 
> Каждый файл пронумерован в формате [X.Y] с русским описанием назначения.

---

## 📁 СТРУКТУРА ПРОЕКТА (ИЕРАРХИЯ)

```
shadow-stack_local_1/
├── [00] AI.MD                          → Главные правила ИИ (протоколы, memory first)
├── [01] AGENTS.md                      → Архитектура агентов и навыки
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
├── 📁 .agent/                          → Конфигурация агентов
│   ├── [15] soul.md                    → Идентичность проекта (миссия, ценности)
│   ├── [16] crons.md                   → Реестр периодических задач
│   ├── [17] decisions.md               → Архитектурные решения
│   ├── [18] implementation-plan.md     → План реализации
│   ├── [19] SESSION-START-PROTOCOL.md  → Протокол запуска сессии
│   ├── [20] SKILLS-MCP-REGISTRY.md     → Реестр навыков и MCP
│   ├── [21] TASK-FOLDER-PATTERN.md     → Паттерн папок задач
│   ├── 📁 skills/                      → Навыки агентов
│   │   ├── [22] cascade/SKILL.md       → Каскадный роутинг моделей
│   │   ├── [23] cli-anything/SKILL.md  → CLI интеграции
│   │   ├── [24] design-system/         → Дизайн-система
│   │   ├── [25] devops/SKILL.md        → DevOps навыки
│   │   ├── [26] kb/SKILL.md            → База знаний
│   │   ├── [27] memory-retrieve/       → Получение из памяти
│   │   ├── [28] memory-store/          → Сохранение в память
│   │   ├── [29] memory/SKILL.md        → Управление памятью
│   │   ├── [30] notebooklm-kb/         → NotebookLM база знаний
│   │   ├── [31] proxy-sse-fix/         → Фикс SSE прокси
│   │   ├── [32] ralph-loop/SKILL.md    → Ralph Loop протокол
│   │   ├── [33] ralph/SKILL.md         → Ralph протокол
│   │   ├── [34] safety/SKILL.md        → Безопасность
│   │   ├── [35] session-loader/        → Загрузчик сессии
│   │   ├── [36] shadow-router/         → Shadow Router
│   │   ├── [37] shadow-stack-orchestrator/ → Оркестратор
│   │   ├── [38] skillful/SKILL.md      → Skillful навыки
│   │   ├── [39] superlocalmemory/      → Локальная память
│   │   ├── [40] telegram-bot/          → Telegram бот
│   │   ├── [41] ui-dashboard/          → UI дашборд
│   │   ├── [42] vector-memory-sync/    → Синхронизация векторной памяти
│   │   └── [43] vibeguard/SKILL.md     → Vibeguard защита
│   └── 📁 tasks/                       → Папки задач
│       ├── [44] AutoResearch_Loop/     → Авто-исследование
│       ├── [45] NotebookLM_Integration/→ Интеграция NotebookLM
│       └── [46] YouTube_Agent_OS/      → YouTube агент
│
├── 📁 .state/                          → Портативный слой состояния
│   ├── [47] current.yaml               → Текущее состояние (runtime, lock, plan)
│   ├── [48] session.md                 → Лог текущей сессии
│   ├── [49] todo.md                    → Чеклист задач
│   └── 📁 runtimes/                    → Состояние рантаймов
│       ├── [50] claude-code.md         → Состояние Claude Code
│       ├── [51] opencode.md            → Состояние OpenCode
│       ├── [52] telegram.md            → Состояние Telegram
│       └── [53] zeroclaw.md            → Состояние ZeroClaw
│
├── 📁 docs/                            → Документация проекта
│   ├── [54] SERVICES.md                → Реестр сервисов (порты, URL, статус)
│   ├── [55] MODEL_LIMITS.md            → Лимиты моделей и провайдеров
│   ├── [56] MODELS_FULL_TABLE.md       → Полная таблица 106 моделей
│   ├── [57] workflow-rules.md          → Правила рабочего процесса
│   ├── [58] omnirouter-lifehacks.md    → Лайфхаки OmniRouter
│   ├── [59] plan-2026-03-31.md         → План от 31.03.2026
│   ├── [60] tailscale-integration.md   → Интеграция Tailscale
│   ├── 📁 services/                    → Страницы сервисов
│   │   ├── [61] _template.md           → Шаблон страницы сервиса
│   │   ├── [62] chromadb.md            → ChromaDB (векторная память)
│   │   ├── [63] free-models-proxy.md   → Free Models Proxy
│   │   ├── [64] health-dashboard.md    → Health Dashboard
│   │   ├── [65] ollama.md              → Ollama (локальные модели)
│   │   ├── [66] omniroute.md           → OmniRoute (облачный каскад)
│   │   ├── [67] shadow-api.md          → Shadow API (:3001)
│   │   ├── [68] shadow-router.md       → Shadow Router (:3002)
│   │   ├── [69] telegram-bot.md        → Telegram Bot (:4000)
│   │   └── [70] zeroclaw.md            → ZeroClaw (:4111)
│   ├── 📁 plans/                       → Планы
│   │   └── [71] plan-v2-2026-04-04.md  → План V2 от 04.04.2026
│   ├── 📁 prompts/                     → Промпты
│   │   └── [72] next-session-zeroclaw.md → Промпт для ZeroClaw
│   └── 📁 superpowers/                 → Суперспособности
│       ├── [73] plans/                 → Планы суперспособностей
│       └── [74] specs/                 → Спецификации
│
├── 📁 notebooks/                       → NotebookLM база знаний
│   ├── [75] README.md                  → Описание notebooks
│   ├── [76] _template.md               → Шаблон notebook
│   ├── 📁 shadow-stack/                → Ноутбуки Shadow Stack
│   │   ├── [77] INDEX.md               → Индекс ноутбуков
│   │   └── [78] 2026-04-05-*.md        → Сессии от 05.04.2026
│   └── 📁 agent-factory/               → Ноутбуки Agent Factory
│       └── [79] INDEX.md               → Индекс ноутбуков
│
├── 📁 knowledge/                       → База знаний проекта
│   ├── [80] DESIGN_RULES.md            → Правила дизайна
│   ├── [81] TELEGRAM_BOTS.md           → Telegram боты
│   ├── [82] VERCEL_AI_GATEWAY.md       → Vercel AI Gateway
│   ├── [83] attention-optimization.md  → Оптимизация внимания
│   └── [84] working-combos.md          → Рабочие комбинации
│
├── 📁 server/                          → Серверный код
│   ├── [85] index.js                   → Express сервер (:3001)
│   ├── [86] free-models-proxy.cjs      → Free Models Proxy (:20129)
│   └── 📁 lib/                         → Библиотеки
│       ├── [87] llm-gateway.cjs        → LLM Gateway
│       ├── [88] router-engine.cjs      → Router Engine
│       ├── [89] speed-profiles.cjs     → Профили скорости
│       ├── [90] rate-limiter.cjs       → Rate Limiter
│       ├── [91] combo-race.cjs         → Combo Race (мета-модель)
│       ├── [92] cascade-provider.cjs   → Cascade Provider
│       ├── [93] config.cjs             → Конфигурация
│       ├── [94] zeroclaw-http.cjs      → ZeroClaw HTTP API
│       └── 📁 providers/               → Провайдеры
│           └── [95] castor-shadow.cjs  → Castor Shadow Provider
│
├── 📁 bot/                             → Telegram бот
│   └── [96] opencode-telegram-bridge.cjs → Telegram Bridge
│
├── 📁 .kiro/                           → Конфигурация Kiro
│   ├── [97] steering/shadow-stack.md   → Правила Kiro
│   └── 📁 skills/                      → Навыки Kiro
│       ├── [98] skill-autoresearch.md  → AutoResearch
│       └── [99] skill-omnirouter.md    → OmniRouter
│
└── 📁 .claude/                         → Конфигурация Claude
    └── [100] CLAUDE.md                 → Глобальные правила Claude
```

---

## 📋 КЛАССИФИКАЦИЯ ПО УРОВНЯМ

### 🔴 Уровень 0 — Критические (всегда читать первыми)
- [00] AI.MD — Главные правила ИИ
- [01] AGENTS.md — Архитектура агентов
- [02] CLAUDE.md — Системный промпт
- [15] soul.md — Идентичность проекта

### 🟡 Уровень 1 — Состояние проекта
- [04] handoff.md — Отчёты между сессиями
- [47] current.yaml — Текущее состояние
- [48] session.md — Лог сессии
- [49] todo.md — Чеклист задач

### 🟢 Уровень 2 — Документация
- [54] SERVICES.md — Реестр сервисов
- [55] MODEL_LIMITS.md — Лимиты моделей
- [56] MODELS_FULL_TABLE.md — Таблица моделей
- [57] workflow-rules.md — Правила работы

### 🔵 Уровень 3 — Навыки и конфигурация
- [16] crons.md — Периодические задачи
- [20] SKILLS-MCP-REGISTRY.md — Реестр навыков
- [21] TASK-FOLDER-PATTERN.md — Паттерн задач

### 🟣 Уровень 4 — Код и инфраструктура
- [85] index.js — Express сервер
- [86] free-models-proxy.cjs — Proxy моделей
- [96] opencode-telegram-bridge.cjs — Telegram бот

---

## 📊 СТАТИСТИКА

| Категория | Файлов | Описание |
|-----------|--------|----------|
| Корневые документы | 14 | Основные правила и описание |
| .agent/ | 33 | Конфигурация агентов и навыки |
| .state/ | 7 | Портативный слой состояния |
| docs/ | 21 | Документация проекта |
| notebooks/ | 5 | NotebookLM база знаний |
| knowledge/ | 5 | База знаний |
| server/ | 11 | Серверный код |
| bot/ | 1 | Telegram бот |
| .kiro/ | 3 | Конфигурация Kiro |
| .claude/ | 1 | Конфигурация Claude |

**ИТОГО:** ~100 файлов документации

---

## 🔄 ПРОТОКОЛ ОБНОВЛЕНИЯ

При создании нового документа:
1. Определить уровень иерархии
2. Присвоить следующий номер [N]
3. Добавить в этот файл (DOCS.md)
4. Обновить статистику

---

**Версия:** 1.0  
**Дата создания:** 2026-04-06  
**Последнее обновление:** 2026-04-06 17:50


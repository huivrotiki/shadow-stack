# DOCS.md — Мастер-индекс документации проекта

> **Иерархия документов SHD (Shadow Stack Documentation)**
> 
> Каждый файл пронумерован в формате [X] с русским описанием назначения.

---

## 📁 СТРУКТУРА ПРОЕКТА (ИЕРАРХИЯ)

```
shadow-stack/
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
├── [12] CLAUDE-HEALTH-DASHBOARD.md    → Мониторинг здоровья
├── [13] MODELS_RANKING.md              → Рейтинг моделей
├── [14] MODELS_STATUS.md               → Статус моделей
├── [15] PROJECT_STRUCTURE.md           → Структура проекта
├── [16] HANDOFF-2026-04-06.md         → Бэкап отчёта сессии
├── [17] DOCS_RULES.md                  → Правила поддержки DOCS.md
├── [18] CONTRIBUTING.md                → Правила контрибуции
├── [19] CHANGELOG.md                   → История изменений
├── [20] LICENSE                        → Лицензия MIT
│
├── 📁 .github/                         → GitHub конфигурация
│   ├── [21] CODEOWNERS                 → Защита критических файлов
│   └── 📁 workflows/
│       └── [22] validate-docs.yml      → CI/CD валидация DOCS.md
│
├── 📁 docs/                            → Документация проекта
│   ├── 📁 00-overview/                 → [23-28] Обзор и прогресс
│   │   ├── [23] project-summary.md     → Краткое описание проекта
│   │   ├── [24] setup-progress.md      → Прогресс настройки
│   │   ├── [25] prd-progress.md       → Прогресс по PRD
│   │   ├── [26] recommendations.md    → Общие рекомендации
│   │   ├── [27] MODELS_FULL_TABLE.md  → Полная таблица моделей
│   │   └── [28] MODEL_LIMITS.md       → Лимиты моделей и провайдеров
│   │
│   ├── 📁 01-plans/                   → [29-34] Планы и задачи
│   │   ├── [29] global-plan.md         → Глобальный план
│   │   ├── [30] main-plan.md          → Основной план
│   │   ├── [31] detailed-plan.md       → Детальный план
│   │   ├── [32] current-tasks.md      → Текущие задачи
│   │   ├── [33] plan-2026-03-31.md   → План от 31.03.2026
│   │   └── [34] plan-v2-2026-04-04.md → План V2 от 04.04.2026
│   │
│   ├── 📁 02-projects/                → [35-44] Документы проектов
│   │   ├── 📁 zeroclaw/               → [35-38] ZeroClaw
│   │   │   ├── [35] overview.md       → Обзор ZeroClaw
│   │   │   ├── [36] architecture.md   → Архитектура ZeroClaw
│   │   │   ├── [37] roadmap.md        → План развития
│   │   │   └── [38] current-phase.md  → Текущая фаза
│   │   ├── 📁 claude/                 → [39-40] Claude
│   │   │   ├── [39] claude-hd.md     → Рабочий HD-документ Claude
│   │   │   └── [40] notes.md         → Заметки и наблюдения
│   │   ├── 📁 opencode/               → [41-42] OpenCode
│   │   │   ├── [41] overview.md       → Обзор OpenCode
│   │   │   └── [42] tasks.md         → Задачи и статус
│   │   └── 📁 antigravity/            → [43-44] Antigravity
│   │       ├── [43] overview.md        → Обзор Antigravity
│   │       └── [44] tasks.md          → Задачи и статус
│   │
│   ├── 📁 03-architecture/            → [45-65] Архитектура и сервисы
│   │   ├── [45] _template.md          → Шаблон документа архитектуры
│   │   ├── [46] system-architecture.md → Общая архитектура системы
│   │   ├── [47] agents-architecture.md → Архитектура агентов
│   │   ├── [48] production.md         → Production-структура и правила
│   │   ├── [49] SERVICES.md           → Реестр сервисов (порты, URL, статус)
│   │   ├── [50] shadow-api.md         → Shadow API (:3001)
│   │   ├── [51] shadow-router.md      → Shadow Router (:3002)
│   │   ├── [52] telegram-bot.md       → Telegram Bot (:4000)
│   │   ├── [53] zeroclaw.md           → ZeroClaw (:4111)
│   │   ├── [54] ollama.md             → Ollama (локальные модели)
│   │   ├── [55] omniroute.md         → OmniRoute (:20130)
│   │   ├── [56] free-models-proxy.md  → Free Models Proxy (:20129)
│   │   ├── [57] chromadb.md           → ChromaDB (векторная память)
│   │   ├── [58] health-dashboard.md   → Health Dashboard
│   │   ├── [59] omnirouter-lifehacks.md → Лайфхаки OmniRouter
│   │   ├── [60] DESIGN_RULES.md       → Правила дизайна
│   │   ├── [61] TELEGRAM_BOTS.md     → Telegram боты
│   │   ├── [62] VERCEL_AI_GATEWAY.md → Vercel AI Gateway
│   │   ├── [63] attention-optimization.md → Оптимизация внимания
│   │   ├── [64] working-combos.md     → Рабочие комбинации
│   │   └── [65] _template.md          → Шаблон документа
│   │
│   ├── 📁 04-security/                → [66-69] Безопасность
│   │   ├── [66] security.md           → Базовые правила безопасности
│   │   ├── [67] secrets-policy.md     → Работа с токенами и секретами
│   │   ├── [68] access-matrix.md      → Доступы и зоны ответственности
│   │   └── [69] tailscale-integration.md → Интеграция Tailscale
│   │
│   ├── 📁 05-heads/                   → [70-71] Руководящие рекомендации
│   │   ├── [70] heads-of-recommendations.md → Сводка рекомендаций
│   │   └── [71] heads-of-production.md → Ключевые правила production
│   │
│   ├── 📁 99-archive/                 → [72-73] Архив
│   │   ├── [72] deprecated-docs.md    → Устаревшие документы
│   │   └── [73] old-structures.md    → Старые структуры
│   │
│   ├── 📁 plans/                      → [74-76] Дополнительные планы
│   │   ├── [74] PLAN_OPENCLAW_WIZARD.md → План OpenClaw Wizard
│   │   ├── [75] PLAN_OPENCLAW_WIZARD_DETAILED.md → Детальный план
│   │   └── [76] plan-v2-2026-04-04.md → План V2 (дубликат)
│   │
│   ├── 📁 prompts/                    → [77] Промпты
│   │   └── [77] next-session-zeroclaw.md → Промпт для следующей сессии
│   │
│   └── 📁 superpowers/                → [78-79] Суперспособности
│       ├── 📁 plans/
│       │   └── [78] 2026-04-04-portable-state-layer.md → План portable state
│       └── 📁 specs/
│           └── [79] 2026-04-04-portable-state-layer-design.md → Спецификация
│
├── 📁 notebooks/                      → [80-88] NotebookLM база знаний
│   ├── [80] README.md                 → Описание notebooks
│   ├── [81] _template.md             → Шаблон notebook
│   ├── 📁 shadow-stack/              → [82-87] Ноутбуки Shadow Stack
│   │   ├── [82] INDEX.md            → Индекс ноутбуков
│   │   ├── [83] 2026-04-05-hands-off-test.md
│   │   ├── [84] 2026-04-05-phase-r1-r3.md
│   │   ├── [85] 2026-04-05-r8-verify.md
│   │   ├── [86] 2026-04-05-ralph-loop-x5-new-providers-benchmark.md
│   │   └── [87] 2026-04-05-test-r3.md
│   └── 📁 agent-factory/             → [88] Ноутбуки Agent Factory
│       └── [88] INDEX.md              → Индекс ноутбуков
│
├── 📁 .agent/                         → [89-106] Конфигурация агентов
│   ├── [89] soul.md                   → Идентичность проекта (миссия, ценности)
│   ├── [90] crons.md                  → Реестр периодических задач
│   ├── [91] decisions.md              → Архитектурные решения
│   ├── [92] implementation-plan.md   → План реализации
│   ├── [93] SESSION-START-PROTOCOL.md → Протокол запуска сессии
│   ├── [94] SESSION-START-RULES.md   → Правила запуска сессии (11 шагов)
│   ├── [95] SKILLS-MCP-REGISTRY.md   → Реестр навыков и MCP
│   ├── [96] TASK-FOLDER-PATTERN.md   → Паттерн папок задач
│   ├── [97] supermemory.config.json  → Конфигурация Supermemory
│   ├── [98] env.claude-code.sh        → Переменные окружения Claude Code
│   │
│   ├── 📁 skills/                    → [99-120] Навыки агентов (22 навыка)
│   │   ├── [99] cascade/SKILL.md       → Каскадный роутинг моделей
│   │   ├── [100] cli-anything/SKILL.md → CLI интеграции
│   │   ├── [101] design-system/SKILL.md → Дизайн-система
│   │   ├── [102] devops/SKILL.md     → DevOps навыки
│   │   ├── [103] kb/SKILL.md         → База знаний
│   │   ├── [104] memory/SKILL.md      → Управление памятью
│   │   ├── [105] memory-retrieve/SKILL.md → Получение из памяти
│   │   ├── [106] memory-store/SKILL.md → Сохранение в память
│   │   ├── [107] notebooklm-kb/SKILL.md → NotebookLM база знаний
│   │   ├── [108] proxy-sse-fix/SKILL.md → Фикс SSE прокси
│   │   ├── [109] ralph/SKILL.md      → Ralph протокол
│   │   ├── [110] ralph-loop/SKILL.md  → Ralph Loop протокол
│   │   ├── [111] safety/SKILL.md      → Безопасность
│   │   ├── [112] session-loader/SKILL.md → Загрузчик сессии
│   │   ├── [113] shadow-router/SKILL.md → Shadow Router
│   │   ├── [114] shadow-stack-orchestrator/SKILL.md → Оркестратор
│   │   ├── [115] skillful/SKILL.md   → Skillful навыки
│   │   ├── [116] superlocalmemory-memory/SKILL.md → Локальная память
│   │   ├── [117] telegram-bot/SKILL.md → Telegram бот
│   │   ├── [118] ui-dashboard-designer/SKILL.md → UI дашборд
│   │   ├── [119] vector-memory-sync/SKILL.md → Синхронизация векторной памяти
│   │   └── [120] vibeguard/SKILL.md  → Vibeguard защита
│   │
│   └── 📁 tasks/                      → [121-123] Папки задач (3 задачи)
│       ├── [121] AutoResearch_Loop/system_manifest.md → Авто-исследование
│       ├── [122] NotebookLM_Integration/system_manifest.md → Интеграция NotebookLM
│       └── [123] YouTube_Agent_OS/system_manifest.md → YouTube агент
│
├── 📁 .state/                         → [124-128] Портативный слой состояния
│   ├── [124] current.yaml             → Текущее состояние (runtime, lock, plan)
│   ├── [125] session.md               → Лог текущей сессии
│   ├── [126] todo.md                  → Чеклист задач
│   ├── [127] context_bridge.json     → Мост контекста
│   └── 📁 runtimes/                   → [128] Состояние рантаймов
│       ├── [128] claude-code.md       → Claude Code
│       ├── [129] opencode.md          → OpenCode
│       ├── [130] telegram.md          → Telegram
│       └── [131] zeroclaw.md          → ZeroClaw
│
├── 📁 workflows/                      → [132-135] Рабочие циклы
│   ├── [132] ralph-loop.md            → Цикл: план → build → commit → review
│   ├── [133] compact-rules.md         → Compact на 50% контекста
│   ├── [134] handoff-rules.md         → Handoff на 60–70% контекста
│   └── [135] reset-session.md         → Сброс контекста / новая сессия
│
├── 📁 templates/                      → [136-139] Шаблоны документов
│   ├── [136] doc-template.md          → Шаблон документа
│   ├── [137] plan-template.md         → Шаблон плана
│   ├── [138] task-template.md         → Шаблон задачи
│   └── [139] commit-template.md       → Шаблон коммита
│
├── 📁 logs/                           → [140-141] Логи
│   ├── [140] session-log.md           → Лог сессий
│   └── [141] changes-log.md          → Лог изменений
│
├── 📁 autosaves-and-commits/          → [142] Автосейвы и коммиты
│   └── [142] commit-log.md            → Реестр коммитов и статусов
│
├── 📁 memory/                         → [143-145] Память проекта
│   ├── [143] notebook-global-phase.md  → Глобальная фаза (NotebookLM)
│   ├── [144] notebook-local-phase.md   → Локальная фаза (NotebookLM)
│   └── [145] supermemory.md          → Supermemory контекст
│
├── 📁 server/                         → [146-156] Серверный код
│   ├── [146] index.js                 → Express сервер (:3001)
│   ├── [147] free-models-proxy.cjs    → Free Models Proxy (:20129)
│   ├── [148] free-models-proxy-2.cjs  → Free Models Proxy #2 (:20132)
│   ├── [149] gateway-mask.cjs         → Unified gateway (:20133)
│   ├── [150] channel-router.cjs       → Dual channels
│   ├── [151] context-pool.cjs         → Context sharing (:20135)
│   ├── [152] shadow-proxy-duo.cjs     → Dual provider setup
│   ├── [153] shadow-router.cjs        → Playwright CDP router
│   ├── [154] orchestrator.js          → Task orchestration
│   ├── [155] sub-agent.cjs            → Sub-agent spawner
│   ├── [156] omni-endpoint.ts         → OmniRoute endpoint
│   │
│   └── 📁 lib/                        → [157-182] Библиотеки
│       ├── [157] llm-gateway.cjs      → LLM Gateway (self-healing, scoring)
│       ├── [158] cascade-provider.cjs → Cascade provider (FreeProxy → Ollama)
│       ├── [159] speed-profiles.cjs   → Speed profiles (slow/medium/fast)
│       ├── [160] rate-limiter.cjs     → Rate limiting per model
│       ├── [161] combo-race.cjs       → Race between models
│       ├── [162] zeroclaw-http.cjs    → ZeroClaw HTTP client
│       ├── [163] zeroclaw-pipeline.cjs → ZeroClaw pipeline
│       ├── [164] zeroclaw-planner.cjs → ZeroClaw planner
│       ├── [165] zeroclaw-state.cjs   → ZeroClaw state
│       ├── [166] zeroclaw-test-runner.cjs → ZeroClaw test runner
│       ├── [167] context-gather.cjs   → Context gathering
│       ├── [168] router-engine.cjs    → Router engine
│       ├── [169] config.cjs           → Configuration
│       ├── [170] ram-guard.cjs        → RAM guard
│       ├── [171] metrics.cjs           → Metrics
│       ├── [172] logger.cjs           → Logger
│       ├── [173] supabase.js          → Supabase client
│       ├── [174] supabase-with-fallback.js → Supabase с fallback
│       ├── [175] ai-sdk.cjs           → AI SDK wrapper
│       ├── [176] semantic-cache.ts     → Semantic cache
│       ├── [177] key-pool.ts          → Key pool
│       ├── [178] circuit-breaker.ts   → Circuit breaker
│       │
│       └── 📁 providers/              → [179-180] Провайдеры
│           ├── [179] castor-shadow.cjs → Castor shadow routing
│           └── [180] browser.cjs       → Browser provider
│
├── 📁 server/tools/                   → [181-184] Инструменты сервера
│   ├── [181] tools-index.md          → Индекс инструментов
│   ├── [182] computer.md              → Computer actions (screenshot, click)
│   └── [183] llm.md                  → LLM tools
│
└── 📁 bot/                           → [184] Telegram бот
    └── [184] opencode-telegram-bridge.cjs → Telegram Bridge (:4000)
```

---

## 📋 КЛАССИФИКАЦИЯ ПО УРОВНЯМ

### 🔴 Уровень 0 — Критические (всегда читать первыми)
- [00] AI.MD — Главные правила ИИ
- [01] AGENTS.md — Архитектура агентов
- [02] CLAUDE.md — Системный промпт
- [89] soul.md — Идентичность проекта

### 🟡 Уровень 1 — Состояние проекта
- [04] handoff.md — Отчёты между сессиями
- [124] current.yaml — Текущее состояние
- [125] session.md — Лог сессии
- [126] todo.md — Чеклист задач

### 🟢 Уровень 2 — Документация
- [29-34] docs/01-plans/ — Планы и задачи
- [45-65] docs/03-architecture/ — Архитектура
- [132-135] workflows/ — Рабочие циклы

### 🔵 Уровень 3 — Навыки и конфигурация
- [90] crons.md — Периодические задачи
- [95] SKILLS-MCP-REGISTRY.md — Реестр навыков
- [96] TASK-FOLDER-PATTERN.md — Паттерн задач
- [99-120] .agent/skills/ — 22 навыка

### 🟣 Уровень 4 — Код и инфраструктура
- [146-184] server/ — Серверный код (11 файлов + 26 lib + 3 tools)
- [184] bot/ — Telegram бот

---

## 📊 СТАТИСТИКА

| Категория | Файлов | Описание |
|-----------|--------|----------|
| Корневые документы | 20 | Основные правила и описание |
| .github/ | 2 | GitHub конфигурация (CODEOWNERS + workflows) |
| docs/00-overview/ | 6 | Обзор и прогресс |
| docs/01-plans/ | 6 | Планы и задачи |
| docs/02-projects/ | 10 | Документы проектов (zeroclaw/4, claude/2, opencode/2, antigravity/2) |
| docs/03-architecture/ | 21 | Архитектура и сервисы |
| docs/04-security/ | 4 | Безопасность |
| docs/05-heads/ | 2 | Руководящие рекомендации |
| docs/99-archive/ | 2 | Архив |
| docs/plans/ | 3 | Дополнительные планы |
| docs/prompts/ | 1 | Промпты |
| docs/superpowers/ | 2 | Суперспособности (plans/1, specs/1) |
| notebooks/ | 9 | NotebookLM база знаний (2 + shadow-stack/6 + agent-factory/1) |
| .agent/ | 10 | Конфигурация агентов |
| .agent/skills/ | 22 | Навыки агентов |
| .agent/tasks/ | 3 | Папки задач |
| .state/ | 8 | Портативный слой состояния (4 файла + runtimes/4) |
| workflows/ | 4 | Рабочие циклы |
| templates/ | 4 | Шаблоны документов |
| logs/ | 2 | Логи |
| autosaves-and-commits/ | 1 | Автосейвы и коммиты |
| memory/ | 3 | Память проекта (NotebookLM + Supermemory) |
| server/ | 11 | Серверный код |
| server/lib/ | 26 | Библиотеки сервера |
| server/tools/ | 3 | Инструменты сервера |
| server/providers/ | 2 | Провайдеры |
| bot/ | 1 | Telegram бот |

**ИТОГО:** ~152 файла документации + 30 server файлов = ~182 файла

---

## 🔄 ПРОТОКОЛ ОБНОВЛЕНИЯ

При создании нового документа:
1. Определить уровень иерархии
2. Присвоить следующий номер [N]
3. Добавить в этот файл (DOCS.md)
4. Обновить статистику
5. Увеличить версию (X.Y.Z)

**Детальные правила:** См. [DOCS_RULES.md](DOCS_RULES.md)

---

**Версия:** 3.1  
**Дата создания:** 2026-04-07  
**Последнее обновление:** 2026-04-07 16:15

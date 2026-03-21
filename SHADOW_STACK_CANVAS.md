# Shadow Stack v3.1.2 — Полный план миграции

Go-live: 2026-04-05. Priority: CRITICAL.

## ГЛОБАЛЬНЫЙ ПЛАН

---

### ФАЗА 0 — Аудит и подготовка

**Статус: ✅ ВЫПОЛНЕНА**

Цель: зафиксировать текущее состояние, архитектуру, секреты и подготовить инфраструктуру.

- [x] 0.1 — Аудит текущих сервисов: Telegram/Slack, Vercel, GitHub API, боты
- [x] 0.2 — Инвентаризация репозиториев: shadow-stack-widget, infra, боты
- [x] 0.3 — Определение целевой архитектуры Shadow Stack v3.1.2
- [x] 0.4 — Подготовка окружений: dev / staging / prod
- [x] 0.5 — Настройка секретов: Vercel env, GitHub Actions Secrets, токены ботов
- [x] 0.6 — Аудит логирования и алертинга
- [x] 0.7 — План отката и безопасного деплоя
- [x] 0.8 — Финализация canvas-плана и чек-листов
- [x] 0.1.9 — MCP GitHub Server (stdio, R&D слой)

**Артефакты фазы 0:**

- SHADOW_STACK_CANVAS.md
- SECRETS.md
- MCP_SETUP_GUIDE.md
- DOPPLER.md
- GITOPS_V0_COMPLETE.md
- GITOPS_V1_COMPLETE.md
- SHADOW_STACK_STATUS.md

---

### ФАЗА 1 — Pre-migration

**Статус: 🔄 В ПРОЦЕССЕ (2026-03-22 → 2026-04-04)**

Цель: подготовить код и GitOps-инфраструктуру без переключения прода.

#### 1.1-1.12 — Базовые задачи

- [ ] 1.1 — Обновление shadow-stack-widget до актуального стека
- [ ] 1.2 — Встраивание Vercel AI SDK
- [ ] 1.3 — Интеграция OpenCode.ai
- [ ] 1.4 — Рефакторинг API-роутов
- [ ] 1.5 — Обновление схем конфигов
- [ ] 1.6 — Доработка ботов
- [ ] 1.7 — Preview-окружения
- [ ] 1.8 — CI/CD через Doppler
- [ ] 1.9 — Smoke-тесты
- [ ] 1.10 — Миграция трафика
- [ ] 1.11 — Документация
- [ ] 1.12 — Dry-run на staging

#### 1.13 — GitOps + MCP

- [x] 1.13.0 — Doppler: настроить управление секретами
- [x] 1.13.1 — GitOps v0: createIssue ✅ **ГОТОВО**
- [x] 1.13.2 — GitOps v1: createPullRequest ✅ **ГОТОВО**
- [ ] 1.13.3 — GitOps v2: createCommit, queryFiles, createIssueFromTemplate
- [ ] 1.13.4 — Telegram бот: /issue команда
- [ ] 1.13.5 — Slack-бот: /gitops-issue
- [ ] 1.13.6 — OpenCode agent skill
- [ ] 1.13.7 — MCP как R&D-слой (stdio)

---

### ФАЗА 2 — Migration

**Статус: ⏳ ЗАПЛАНИРОВАНО (2026-04-05 — 2026-04-11)**

- [ ] 2.1 — Деплой на Vercel (production)
- [ ] 2.2 — Регрессионные тесты
- [ ] 2.3 — Прод-домен и DNS
- [ ] 2.4 — Feature-флаги
- [ ] 2.5 — Постепенный rollout: 10% → 50% → 100%
- [ ] 2.6 — Мониторинг
- [ ] 2.7 — Rollback-план

---

### ФАЗА 3 — Post-migration

**Статус: ⏳ ЗАПЛАНИРОВАНО (2026-04-12 — 2026-04-17)**

- [ ] 3.1 — Чистка legacy
- [ ] 3.2 — Финальный рефакторинг конфигов
- [ ] 3.3 — Документация GitOps-флоу
- [ ] 3.4 — SLO/SLI, алерты
- [ ] 3.5 — Команды ботов
- [ ] 3.6 — Ретроспектива v3.2

---

## АРХИТЕКТУРА

```
Shadow Stack v3.1.2
├── shadow-stack-widget (Vercel)
│   ├── app/api/gitops/route.ts
│   ├── app/api/telegram-webhook/route.ts
│   └── server/index.js (Express, порт 3001)
│        ├── createIssue       ✅
│        ├── createPullRequest ✅
│        ├── createCommit      ⏳
│        └── queryFiles        ⏳
├── Telegram/Slack bots
│   └── /issue → POST /api/gitops
├── Doppler (секреты: dev/staging/prod)
├── GitHub Actions (CI)
└── MCP GitHub Server (R&D: stdio)
```

---

## СЕКРЕТЫ

Управление через **Doppler**: проект `shadow-stack`

```
GITHUB_TOKEN              — repo, workflow, admin:repo_hook
GITHUB_REPO_OWNER         — serpentme
GITHUB_REPO_NAME          — shadow-stack-widget
TELEGRAM_BOT_TOKEN
TELEGRAM_SECRET
OPENAI_API_KEY
ANTHROPIC_API_KEY
GROQ_API_KEY
VERCEL_TOKEN
DOPPLER_TOKEN
MCP_GITHUB_URL
```

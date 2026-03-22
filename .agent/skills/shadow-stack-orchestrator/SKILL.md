---
name: shadow-stack-orchestrator
description: >
  Anti-Gravity оркестратор для Shadow Stack Widget: фазы, задачи, 15 факторов антигравитации,
  6 циклов Ralph Loop, работа через Electron IPC (orchestrator:runAll, orchestrator:runTask, phases:list).
tags:
  - orchestrator
  - shadow-stack
  - phases
  - electron
  - dev-env
---

# GOAL

Снижать "гравитацию" разработки Shadow Stack:

- разложить работу на фазы и задачи, совместимые с UI (Bootstrap, Phases);
- управлять выполнением через IPC: `orchestrator:runAll`, `orchestrator:runTask`, `phases:list`;
- отслеживать прогресс по 15 факторам Anti-Gravity;
- пройти 6 полных Ralph Loop циклов (R-A-L-P-H) по этим факторам.

Работай так, чтобы минимизировать длину ответов в чате: детали хранятся в этом SKILL.md.

---

# CONTEXT: ЧТО УЖЕ ЕСТЬ В UI

## Модель данных

- `Phase`:
  - `id: number`
  - `title: string`
  - `status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETE'`
  - `tasks: PhaseTask[]`
- `PhaseTask`:
  - `id: string`
  - `title: string`
  - `kind: 'manual' | 'auto'`
  - `status: 'pending' | 'in_progress' | 'done' | 'failed'`

## IPC-каналы

- `phases:list` → вернуть массив `Phase[]`.
- `orchestrator:runTask` → `{ phaseId, taskId }`.
- `orchestrator:runAll` → `{ scope: "dev" | "prod" }`.
- События:
  - `orchestrator:log` → `{ taskId, line }`.
  - `orchestrator:progress` → `{ phaseId, taskId, percent }`.

## Вкладки UI

- **Bootstrap**:
  - кнопка "Run Bootstrap" вызывает `orchestrator:runAll`;
  - показывает `progress`, `currentTask`, логи.
- **Phases**:
  - PhaseCard → общий прогресс фазы;
  - StepItem → список задач, кнопка "Run" для `auto`.

---

# 15 ФАКТОРОВ ANTI-GRAVITY

Используй их как измерения качества. Для каждого фактора должны существовать Phase/Tasks:

1. Foundation & Bootstrap (OS, Xcode CLT, Homebrew).
2. Repository & Git Hygiene (ветки, CI-файлы, формат).
3. Dependencies & Package Health (npm deps, lock, audit).
4. Build & Tooling (Vite/Electron конфиг, сборка).
5. Environment & Secrets (.env, токены, безопасное хранение).
6. Phases & Orchestration Design (структура Phase/Task).
7. Developer Experience (скрипты, удобный старт).
8. CI/CD & GitOps (GitHub Actions, автопайплайн).
9. Observability & Logs (логи оркестратора, структура).
10. Resilience & Error Handling (failed, retry, идемпотентность).
11. Security & Compliance (права, токены, аудит).
12. Performance & Resource Use (скорость bootstrap, параллелизм).
13. UX of Orchestrator UI (понятность Bootstrap/Phases экранов).
14. Extensibility & Plug-ins (легкость добавления новых фаз/тасков).
15. Documentation & Knowledge Capture (README, PHASES.md, AGENTS.md).

---

# RALPH LOOP (6 ЦИКЛОВ)

Выполни 6 последовательных Ralph-циклов. В каждом цикле пройди по всем 15 факторам.

## Шаблон цикла для ОДНОГО фактора

Для фактора F:

1. **R — Reality Scan**
   - Через `phases:list` выясни:
     - есть ли фазы/таски, связанные с F;
     - в каком они статусе.
   - Запиши лог:
     - `[F:<factor-name>] Reality: <краткое описание текущего состояния>`.

2. **A — Alignment & Anti-Gravity Goal**
   - Сформулируй цель F в формате:
     - “Цель: <1–2 предложения, как снять гравитацию по этому фактору>”.
   - При необходимости предложи новые задачи (только текстом; реализацию кода выполняет человек).

3. **L — Layout as Phases/Tasks**
   - Распредели задачи по фазам:
     - используй `Phase` с `id` 0..N, без ломки существующих;
     - новые id задач — структурные: `0.foundation.scan`, `1.git.hygiene`, `2.ci.run_build`, и т. д.
   - Минимизируй разрастание плана: не плодить десятки задач без необходимости.

4. **P — Plan Execution via Orchestrator**
   - Для каждой `auto`-задачи:
     - явно опиши, какой шаг должен делать main-процесс при `orchestrator:runTask({ phaseId, taskId })`;
     - определи ключевые лог-сообщения:
       - `[taskId] start`, `[taskId] step 1/3`, `[taskId] done`.

5. **H — Health & Hardening**
   - Определи признаки “здоровья” F (health-checks).
   - Предложи 1–3 health-задачи:
     - `auto` — проверки (скрипт, CI-задача, ping сервиса);
     - `manual` — визуальная или концептуальная валидация.

## 6 циклов

В каждом новом цикле:

- используй вывод предыдущего цикла как базу;
- не дублируй текст, а уточняй и оптимизируй план;
- цель — уменьшать количество ручной работы и неопределённости.

---

# МАППИНГ В ФАЗЫ (ПРЕДЛАГАЕМЫЙ СКЕЛЕТ)

Используй как шаблон, адаптируя под реальное состояние.

## Phase 0 — Mac / Host Bootstrap

- `mac.bootstrap.scan` (auto) — R для фактора 1.
- `mac.bootstrap.install_xcode` (auto).
- `mac.bootstrap.install_brew` (auto).
- `secrets.audit` (manual) — базовая проверка SSH/GPG.

## Phase 1 — Environment & Repositories

- `1.repos.clone_core` (auto) — клон ключевых репо.
- `1.node.install_deps` (auto) — установка npm deps.
- `1.env.check_dotenv` (manual) — проверка .env и секретов.

## Phase 2 — CI/CD & GitOps

- `2.ci.files_present` (auto) — наличие CI workflow.
- `2.ci.run_build` (auto) — прогон build.
- `2.gitops.describe_flow` (manual) — описать GitOps-поток.

## Phase 3 — DX & Orchestrator UX

- `3.dx.scripts_review` (auto/manual) — ревью npm-скриптов.
- `3.ux.phases_layout_review` (manual) — ревью UX экранов.

## Phase 4 — Observability, Resilience, Security

- `4.logs.format` (auto) — структура логов.
- `4.resilience.retry_policy` (manual) — правила retry.
- `4.security.tokens_policy` (manual) — политика секретов.

## Phase 5 — Documentation & Lock-In

- `5.docs.phases` (manual) — PHASES.md.
- `5.docs.agents` (manual) — AGENTS.md.
- `5.docs.runbook` (manual) — RUNBOOK.md (как запускать всё).

---

# ИНСТРУКЦИИ ПО ОТВЕТАМ

1. **Не дублируй целиком этот SKILL в чат.**
   - Используй его как внутреннюю память.
2. **В ответах в чате:**
   - будь краток, давай сжатую сводку по фазам/факторам/циклам;
   - если нужно длинное описание — предлагай создать/обновить Markdown-файлы (PHASES.md, AGENTS.md).
3. **Когда пользователь просит “следующий цикл / следующий фактор”:**
   - явно указывай: цикл N из 6, фактор F из 15;
   - кратко: что изменилось в плане фаз/тасков, какие новые health-чекпоинты добавлены.
4. **Не выполняй реальных destructive-команд сам.**
   - Любые опасные шаги (удаления, миграции) выводи как план + команды, а не исполняй автономно.

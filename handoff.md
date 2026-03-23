# Отчет о сессии (Handoff)

**Date:** 2026-03-23
**Session:** Phase 1-3 complete + Vercel deploy + Health Dashboard

---

- **Что изменилось:**
  - `shadow-stack-widget-1/server/auto-router/auto-router.ts` — Auto-Router v1.0: state machine IDLE→ROUTING→EXECUTING→DONE|ERROR, Zod schemas, `classifyRoute()`, `routeRequest()`
  - `shadow-stack-widget-1/server/auto-router/providers.ts` — 7 LLM провайдеров: Ollama, Antigravity, OpenRouter, Perplexity, Grok, Kimi, Claude + `openAICompatibleCall()` helper + usage tracking (`trackUsage`, `getUsage`, `isQuotaExhausted`)
  - `shadow-stack-widget-1/server/auto-router/fallback.ts` — `executeWithRetry()` (3 retries, exponential backoff) + `executeFallbackCascade()` (Ollama→Antigravity→OpenRouter→Kimi→Claude) + meta-escalation при полном отказе
  - `shadow-stack-widget-1/server/auto-router/metaEscalate.ts` — 3-tier chain: Perplexity→GPT-4o→Telegram human, `EscalationResult` type
  - `shadow-stack-widget-1/server/auto-router/index.ts` — barrel export
  - `shadow-stack-widget-1/app/api/telegram-webhook/route.ts` — полный rewrite: Zod validation, secret token, команды /help /status /deploy /premium /deep /grok /kimi /reset /test-router /usage /escalate
  - `shadow-stack-widget-1/server/index.js` — endpoints: POST /api/auto-router, GET /api/auto-router/usage, POST /api/meta-escalate
  - `shadow-stack-widget-1/.gitignore` — добавлено `.vercel`, `logs/`
  - `shadow-stack-widget-1/` — 10 fix-коммитов для Vercel build: `.js` импорты, `@ai-sdk/react` v6 API, Winston serverless, TypeScript deps, tsconfig ES2022
  - `shadow-stack-dashboard-v3.html` (СОЗДАН) — 8-tab dashboard: Dark mode, Canvas-анимации, Bento Grid, симулятор авто-роутера, 46KB
  - `shadow-stack-dashboard-v2.html` (СОЗДАН) — предыдущая версия
  - `health-dashboard/index.html` — копия v3 для отдельного Vercel-проекта
  - `CLAUDE.md` (СОЗДАН) — meta-escalation rules, project structure, constraints
  - `SKILL.md` — обновлён: Auto-Router routing rules, providers, meta-escalation, Telegram commands
  - `todo.md` — Phase 1-3 marked COMPLETE
  - `.claude/launch.json` — 9 dev server configurations

- **Почему было принято именно такое решение:**
  - Zero-cost cascade: Ollama (local $0) → Antigravity ($0) → OpenRouter (free tier) → paid — минимизация затрат на M1 8GB
  - Dashboard — self-contained HTML без фреймворков, портативность, деплой как static site за 7 сек
  - Widget-1 на Vercel (Next.js backend + bot), Health Dashboard — отдельный Vercel-проект (static)
  - `openAICompatibleCall()` — единый helper для 5+ провайдеров, избежание дублирования

- **Что мы решили НЕ менять:**
  - `shadow-stack-widget-1/lib/` — клиентский код (кроме `ai-models.ts` — добавлены 4 модели)
  - `bot/opencode-telegram-bridge.cjs` — legacy CommonJS bridge, не трогали
  - `main.cjs`, `preload.cjs` — Electron shell, без изменений
  - Root repo не деплоится на Vercel — только локальная обёртка

- **Тесты:**
  - Telegram `getMe` API — бот @shadowstackv1_bot валидный, отвечает
  - `getWebhookInfo` — URL корректный, pending_update_count: 0, no errors
  - Vercel runtime logs — POST `/api/telegram-webhook` → 200
  - `/help` в Telegram — ответ получен
  - `curl POST /api/meta-escalate` — корректный `all_failed` (ожидаемо, API keys не настроены)
  - Vercel build: `READY` за 27 сек (widget-1), 7 сек (health-dashboard)

- **Журнал несоответствий / Подводные камни:**
  - **TELEGRAM_TOKEN дублируется** в `.env` — строка `TELEGRAM_TOKEN=` встречается дважды, нужно убрать дубликат
  - **TELEGRAM_CHAT_ID неверный** в `.env`: стоит `8298265295` (ID бота). Правильный chat_id: `8115830507`
  - **Meta-escalation не работает**: PERPLEXITY_API_KEY и OPENROUTER_API_KEY отсутствуют → tier 1+2 fail. TELEGRAM_BOT_TOKEN не задан → tier 3 (human) тоже fail. Лог: `[MetaEscalate] Cannot escalate to human: missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID`
  - **Zod v4 ошибка в error.log**: `Cannot read properties of undefined (reading '_zod')` в `server/index.js:26` — Zod v4.3.6 парсинг падает при невалидном input. Не фиксили — не критично, ошибка обрабатывается
  - **Vercel env vars**: проверить что токен актуальный (`AAGkIyjVj_...`), не старый
  - **Вложенные git**: root (`shadow-stack`) и widget-1 (`shadow-stack-widget-1`) — отдельные репозитории. Коммиты нужно делать в обоих. Widget-1 отображается как submodule в root
  - **11 GitHub vulnerabilities**: 2 critical, 7 moderate, 2 low — видно при каждом push. Не исправлены

---

## Git Commits (эта сессия)

**Widget-1 repo (`huivrotiki/shadow-stack-widget-1`):**
- `09ba8e3` — chore: add .vercel to gitignore
- `10cb5c1` — fix: disable file transports on Vercel serverless (read-only fs)
- `21b136d` — fix: render UIMessage.parts instead of .content for @ai-sdk/react v6
- `22d84de` — fix: sendMessage uses parts array for @ai-sdk/react v6
- `60170a7` — fix: adapt to @ai-sdk/react v6 useChat API
- `afc3cf8` — fix: update useChat API for @ai-sdk/react v6
- `0053b4d` — fix: tsconfig target ES2022 for regex dotAll flag
- `c59b1cd` — fix: add typescript + @types/react + @types/node for Vercel build
- `4745f3e` — fix: resolve Vercel build errors — .js imports + ai/react → @ai-sdk/react
- `434f0dc` — chore: add logs/ to .gitignore
- `3584cbe` — Phase 3: Meta-escalation chain
- `67a1a3e` — Phase 2.1: Antigravity + usage monitoring
- `a81ac51` — Phase 1: Auto-Router v1.0 + 7 providers

**Root repo (`huivrotiki/shadow-stack`):**
- `859f3ef` — feat: deploy Health Dashboard to Vercel as separate static project
- `0f6f3da` — feat: Dashboard v3.2 + handoff
- `12a3e3c` — Shadow v3: Step 11 Bot & Vercel Webhook structural finalization
- `bd4b4ba` — docs: Phase 3 — CLAUDE.md meta-escalation rules
- `f8d92a9` — feat: Phase 2 COMPLETE — dashboard quota monitor + launch.json
- `eda9493` — docs: Phase 2.1 — SKILL.md routing rules
- `7201cc0` — feat: Phase 1 — Auto-Router v1.0

## Vercel Projects

| Проект | URL | Тип |
|---|---|---|
| shadow-stack-widget-1 | https://shadow-stack-widget-1.vercel.app | Next.js 16 + Telegram Bot |
| health-dashboard | https://health-dashboard-zeta-tawny.vercel.app | Static HTML Dashboard |

## Pending
- Phase 4: Observability + Security (SSE logs, Supabase, security scan)
- Phase 5: Documentation + Deploy (RUNBOOK.md, AGENTS.md, final production deploy)
- Настроить API keys: PERPLEXITY_API_KEY, OPENROUTER_API_KEY, TELEGRAM_BOT_TOKEN
- Исправить TELEGRAM_CHAT_ID в .env (8115830507, не 8298265295)
- Убрать дубликат TELEGRAM_TOKEN в .env
- GitHub Dependabot: 11 vulnerabilities (2 critical)

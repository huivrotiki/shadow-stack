# Task: Shadow Stack — Full Setup & Verification
**Runtime:** Kiro  
**Project path:** ~/shadow-stack_local_1/  
**Date:** 2026-04-05

---

## Context

Shadow Stack — локальный стек разработки на Mac mini M1 8GB / Berlin.
Все секреты живут в Doppler (project: `serpent`, config: `dev`).
PM2 управляет тремя процессами: `shadow-api`, `shadow-bot`, `litellm-proxy`.
LLM-запросы: OmniRoute (:20128) — cloud cascade, ZeroClaw (:4111) — local Ollama.

**ВАЖНО:** перед каждой командой — `doppler run --project serpent --config dev -- <cmd>`.
Хардкод токенов = reject.

---

## Pre-flight checks (выполнить ДО всего)

1. Проверить RAM: `curl http://localhost:3001/ram`
   - free_mb < 400 → пропустить Ollama/browser задачи, только cloud
   - free_mb < 200 → ABORT, написать в Telegram

2. Прочитать файлы состояния:
   - `.state/current.yaml` — активный план и lock
   - `.state/todo.md` — текущие задачи
   - `handoff.md` — последний handoff

3. Проверить lock: если `lock_until` в будущем — спросить пользователя.

---

## Tasks

### Task 1: Doppler — проверить и дополнить секреты

Убедиться что в Doppler (project: `serpent`, config: `dev`) есть ВСЕ переменные:

```
TELEGRAM_BOT_TOKEN        # от @BotFather
TELEGRAM_CHAT_ID          # твой chat_id
FREE_PROXY_BASE_URL       # http://localhost:20129/v1
FREE_PROXY_API_KEY        # shadow-free-proxy-local-dev-key
LITELLM_MASTER_KEY        # sk-shadow-local (или свой)
OPENROUTER_API_KEY        # для OmniRoute cloud cascade
ANTHROPIC_API_KEY         # для Claude через OmniRoute
```

Команда проверки:
```bash
doppler run --project serpent --config dev -- doppler secrets
```

Если переменной нет → добавить:
```bash
doppler secrets set KEY="value" --project serpent --config dev
```

**Проверка пройдена:** все 7 переменных существуют.

---

### Task 2: ecosystem.config.cjs — исправить загрузку env

Текущая проблема: файл использует `dotenv` с хардкодным путём к `.env`.
Это нарушение Rule #2 (Secrets через Doppler).

**Исправить** `ecosystem.config.cjs`:
- Убрать `dotenv.config()` строку
- Env-переменные будут инжектиться через `doppler run`
- Сохранить три процесса: `shadow-api`, `shadow-bot`, `litellm-proxy`
- `litellm-proxy` порт: `4001` (не менять)
- `max_memory_restart: '500M'` на каждом процессе (оставить)

Итоговая команда запуска стека:
```bash
doppler run --project serpent --config dev -- pm2 start ecosystem.config.cjs
```

**Проверка:** `pm2 status` показывает три процесса в `online`.

---

### Task 3: Telegram Bot — очистить webhook и запустить

1. Удалить активный webhook (если есть):
```bash
doppler run --project serpent --config dev -- \
  node -e "
    const token = process.env.TELEGRAM_BOT_TOKEN;
    require('https').get(
      \`https://api.telegram.org/bot\${token}/deleteWebhook?drop_pending_updates=true\`,
      r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>console.log(d)); }
    );
  "
```

2. Перезапустить бота:
```bash
pm2 restart shadow-bot
pm2 logs shadow-bot --lines 30 --nostream
```

**Проверка:** в логах есть `Bot started` или `Listening for updates`. Нет `409 Conflict`.

---

### Task 4: OmniRoute (:20128) — smoke test

```bash
doppler run --project serpent --config dev -- \
  curl -s http://localhost:20128/v1/models | node -e "
    let d=''; process.stdin.on('data',c=>d+=c);
    process.stdin.on('end',()=>{
      const j=JSON.parse(d);
      console.log('Models available:', j.data?.length || 0);
    });
  "
```

**Проверка:** возвращает список моделей (> 0).
Если OmniRoute не запущен → запустить его отдельным процессом или проверить `docs/SERVICES.md`.

---

### Task 5: ZeroClaw (:4111) — проверить Ollama

```bash
curl http://localhost:4111/api/tags
```

**Проверка:** есть модели `qwen2.5-coder:3b` и/или `llama3.2:3b`.

Если моделей нет — загрузить (только если RAM > 400MB):
```bash
ollama pull qwen2.5-coder:3b
```

---

### Task 6: CLAUDE.md — обновить секцию TELEGRAM BOT

Добавить в `CLAUDE.md` в секцию `## TELEGRAM BOT` следующее:

```markdown
### Запуск (основной — через PM2)
doppler run --project serpent --config dev -- pm2 start ecosystem.config.cjs

### PM2 процессы (все три обязательны)
| Name          | Script                               | Port |
|---------------|--------------------------------------|------|
| shadow-api    | server/index.js                      | 3001 |
| shadow-bot    | bot/opencode-telegram-bridge.cjs     | 4000 |
| litellm-proxy | litellm --model qwen2.5-coder:3b     | 4001 |

### ZeroClaw внутри бота
Bot использует ZeroClaw (:4111) как движок для вызова моделей.
FREE_PROXY_BASE_URL=http://localhost:20129/v1 — fallback на 18 бесплатных моделей.

### Обязательные секреты (Doppler)
TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
FREE_PROXY_BASE_URL, FREE_PROXY_API_KEY, LITELLM_MASTER_KEY
```

Затем сделать commit:
```bash
git add CLAUDE.md
git commit -m "docs: update TELEGRAM BOT section with PM2 setup"
```

---

### Task 7: Health check — финальная проверка всего стека

```bash
curl http://localhost:3001/health    # shadow-api
curl http://localhost:4000/health    # shadow-bot  
curl http://localhost:20128/health   # OmniRoute
curl http://localhost:4111/health    # ZeroClaw
curl http://localhost:3001/ram       # RAM Guard
```

Для каждого сервиса: ожидаем `{ status: "ok" }` или `200 OK`.
Если сервис не отвечает — проверить `pm2 logs <name>`, исправить.

---

### Task 8: Handoff

По завершении всех задач:

1. Обновить `.state/session.md` — добавить строку:
   ```
   ## HH:MM · Kiro · setup_complete — all services online, CLAUDE.md updated
   ```

2. Обновить `handoff.md`:
   ```markdown
   ## Handoff [DATE]
   - Kiro выполнил полный setup Shadow Stack
   - ecosystem.config.cjs исправлен (убран dotenv хардкод)
   - CLAUDE.md секция TELEGRAM BOT обновлена
   - Все сервисы: shadow-api :3001, shadow-bot :4000, litellm-proxy :4001, OmniRoute :20128, ZeroClaw :4111
   - Следующий шаг: проверить prod-деплой OmniRoute
   ```

3. Git push:
   ```bash
   git add .state/ handoff.md CLAUDE.md
   git commit -m "chore: kiro full setup complete"
   ```
   > ⚠️ `git push` — спросить пользователя перед выполнением (Rule: ASK IN CHAT BEFORE RUNNING).

---

## Success Criteria

- [ ] `pm2 status` → три процесса `online`
- [ ] Telegram bot — нет `409 Conflict` в логах
- [ ] `curl :20128/v1/models` → список моделей
- [ ] `curl :4111/api/tags` → qwen2.5-coder:3b доступна
- [ ] `CLAUDE.md` обновлён и закоммичен
- [ ] `handoff.md` обновлён

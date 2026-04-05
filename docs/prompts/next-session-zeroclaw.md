# Промт для следующей сессии — ZeroClaw orchestrator + claude-code через прокси

> Используется для продолжения контекста из сессии 2026-04-05k.
> Скопируй этот файл целиком в первое сообщение новой сессии claude-code.

---

## Контекст (что уже сделано)

Ты — **Lead Shadow Stack Architect**, продолжаешь работу в проекте `/Users/work/shadow-stack_local_1` на ветке `feat/portable-state-layer`.

**Прошлая сессия (2026-04-05k)** починила `shadow/auto` в opencode:
1. `server/free-models-proxy.cjs` — добавлена функция `writeSSE()` и `if (stream)` ветки в `app.post('/v1/chat/completions')` и `handleGatewayRoute()`. Теперь прокси отдаёт `text/event-stream` когда `stream:true`, и echo-ит `model` из запроса (реальный роут уходит в `x_model`). AI SDK v6 в `@ai-sdk/openai-compatible` всегда вызывает `doStream()` → раньше получал JSON → silent failure.
2. Прокси `:20129` перезапущен под Doppler: `doppler run --project serpent --config dev -- node server/free-models-proxy.cjs`. В env теперь есть `OPENROUTER_API_KEY`, `GITHUB_TOKEN`, `ANTHROPIC_API_KEY`. Без ключей auto-роут схлопывался в ollama qwen2.5-coder:3b и галлюцинировал на русском.
3. `CLAUDE.md` проекта заменён на финальный 10-секционный system prompt.
4. Коммит: см. последний в `git log` с префиксом `fix(proxy): SSE streaming + model echo`.

**Проверено вживую:**
- `curl` non-stream → `model:"auto"` echoed, `x_model:"qwen2.5-coder:3b"`, 1.1s
- `curl` stream → 2 SSE-чанка + `[DONE]`
- `or-qwen3.6` напрямую через Doppler → OpenRouter free работает
- opencode → `shadow/auto` отдаёт адекватные ответы (не галлюцинации)

**Открытые проблемы (из handoff.md):**
- PM2 на `:3001` (pid 30103) живёт из `/Users/work/agent-factory/server/index.js`, НЕ из shadow-stack. Mount `/api/zeroclaw/*` не активен в runtime.
- Прокси на `:20129` запущен через `nohup doppler run ... &` — при ребуте не поднимется.
- Ветка отстаёт от `origin/feat/portable-state-layer` на 2 коммита.

## Задачи этой сессии

### 1. ZeroClaw orchestrator — полноценно поднять

`server/lib/zeroclaw-http.cjs` уже написан (CJS → ESM singleton import), `server/lib/zeroclaw-planner.cjs` тоже (regex intent classifier + decompose). `server/index.js` имеет try/catch load + mount. Нужно:

**1.1** Диагностировать pm2 drift:
```bash
export PATH="/opt/homebrew/bin:$PATH"
pm2 list
pm2 info <name_of_process_on_3001>  # найти cwd
lsof -p $(lsof -tiTCP:3001 -sTCP:LISTEN) 2>/dev/null | grep cwd
```

**1.2** Принять решение: либо (A) остановить pm2-агента, либо (B) перенаправить его на `/Users/work/shadow-stack_local_1/server/index.js`. Вариант B предпочтительнее — меньше блast-радиус. Спросить пользователя если есть сомнения.

**1.3** Запустить shadow-api с правильным cwd через doppler:
```bash
cd /Users/work/shadow-stack_local_1
doppler run --project serpent --config dev -- node server/index.js
```
Или через pm2 ecosystem:
```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [{
    name: 'shadow-api',
    script: 'server/index.js',
    cwd: '/Users/work/shadow-stack_local_1',
    interpreter: 'node',
    env: { /* doppler injects */ },
    // или: exec_mode: 'fork', script: 'doppler', args: 'run --project serpent --config dev -- node server/index.js'
  }]
};
```

**1.4** Проверить все ZeroClaw routes:
```bash
curl -sS http://localhost:3001/api/zeroclaw/health
curl -sS -X POST http://localhost:3001/api/zeroclaw/execute \
  -H 'Content-Type: application/json' \
  -d '{"task_id":"t1","instruction":"напиши hello world на python","model":"auto"}'
curl -sS -X POST http://localhost:3001/api/zeroclaw/plan \
  -H 'Content-Type: application/json' \
  -d '{"goal":"найди все TODO в репе и запиши в todo.md, затем сделай commit"}'
```

**1.5** Телеграм-бот уже переведён на `/api/zeroclaw/execute` в прошлой сессии (`bot/opencode-telegram-bridge.cjs`, `handleCascade` + `/zc` Control Center с 7 субкомандами). Проверить что бот живой и `/zc health` отвечает. Если бот упал — рестартнуть под doppler.

### 2. claude-code через `shadow/auto` прокси

Цель: запустить `claude-code` CLI так, чтобы он ходил за моделями не в Anthropic напрямую, а через `http://localhost:20129/v1` (наш прокси). Это даст кашбек, роутинг, fallback и memory.

**2.1** Проверить поддержку `ANTHROPIC_BASE_URL`:
```bash
claude --help | grep -i base-url
# или в docs: https://docs.claude.com/en/docs/claude-code/overview
```

**2.2** Прокси `:20129` сейчас OpenAI-compatible (`/v1/chat/completions`). Claude Code ожидает Anthropic-compatible (`/v1/messages` с другой schema: `system`, `messages[].content[]`, `tool_use` блоки).

Два варианта:

**(A) Расширить `free-models-proxy.cjs`** — добавить `POST /v1/messages` endpoint, который принимает Anthropic-формат, трансформирует в OpenAI-формат (`messages = [system ? {role:'system', content:system} : null, ...messages].filter`), вызывает `gateway.ask()`, и возвращает ответ в Anthropic-формате (`{id, type:'message', role:'assistant', content:[{type:'text', text}], stop_reason:'end_turn', usage}`). Для SSE — Anthropic использует другой event-stream формат: `event: message_start`, `event: content_block_delta` и т.д. Это нетривиально.

**(B) Использовать готовый proxy-мост** — есть опенсорсные `claude-code-proxy` / `claude2openai` проекты, которые делают именно это. Проверить npm: `claude-code-router`, `anthropic-openai-proxy`.

**(C) Простой shim на Express** — отдельный сервис на `:20130`, который принимает Anthropic-format, вызывает `http://localhost:20129/v1/chat/completions` (наш существующий), и перекодирует. Отдельный файл `server/anthropic-shim.cjs`.

Рекомендация: начни с (C) — минимум кода, не трогает работающий прокси.

**2.3** Запустить:
```bash
ANTHROPIC_BASE_URL=http://localhost:20130 \
ANTHROPIC_API_KEY=dummy-local-shim \
claude
```

**2.4** Проверить что `claude` в этой же директории shadow-stack получает ответы через `shadow/auto` роут и НЕ ходит в api.anthropic.com (можно через `lsof -i` на процесс claude).

### 3. Persist прокси в pm2

**3.1** Создать/обновить `ecosystem.config.cjs`:
```javascript
module.exports = {
  apps: [
    {
      name: 'free-models-proxy',
      script: 'server/free-models-proxy.cjs',
      cwd: '/Users/work/shadow-stack_local_1',
      interpreter: 'doppler',
      interpreter_args: 'run --project serpent --config dev -- node',
      max_memory_restart: '300M',
      env: { NODE_ENV: 'production' },
    },
    // shadow-api, zeroclaw-http и другие — аналогично
  ],
};
```

**3.2** Зарегистрировать в `.agent/crons.md` раздел Heartbeats: добавить строку для `free-models-proxy` (port 20129, interval 60s). Добавить heartbeat writer в сам прокси — `setInterval` пишет одну JSON-строку в `data/heartbeats.jsonl`.

**3.3** Проверить `pm2 startup` для автозапуска при ребуте (спросить пользователя перед установкой — создаёт launchd agent).

### 4. Git hygiene

**4.1** Перед любым push:
```bash
git fetch origin
git pull --rebase origin feat/portable-state-layer
```
Если конфликты — показать пользователю, не решать сам (PR #6 уже DIRTY_CONFLICTING).

**4.2** Проверить `.gitignore` — `data/gateway-memory.json`, `data/provider-scores.json`, `.opencode.bak/`, `data/heartbeats.jsonl` должны быть внутри. Если нет — добавить.

## Правила (напоминание из CLAUDE.md + soul.md)

- **Перед любым действием:** `curl http://localhost:3001/ram` (если `shadow-api` на `:3001` живой) → проверить RAM tier. `< 200 MB` → ABORT.
- **Lifecycle:** каждое значимое событие пиши в `.state/session.md` (`## HH:MM · claude-code · <event>`).
- **Коммиты:** по логически законченной единице, формат `type(scope): description`, никаких `.env` / `*.key` / `data/*-memory.json`.
- **Push:** только по явной просьбе пользователя. Никаких `--force` в shared ветки.
- **Doppler:** все процессы через `doppler run --project serpent --config dev -- ...`. Никогда не писать ключи в код или конфиги.
- **PM2:** перед рестартом чужого процесса — `lsof -p <pid> | grep cwd`, чтобы не снести другой проект.
- **Сохранения:** `handoff.md` обновляется в конце сессии, `runtime_close` в `.state/session.md`.

## Файлы для чтения при старте

В таком порядке:
1. `.state/current.yaml` — active_runtime, lock_until, phase
2. `.state/todo.md` — открытые задачи
3. `.state/session.md` (хвост) — что делалось в прошлых сессиях
4. `handoff.md` — детали предыдущей сессии (2026-04-05k)
5. `docs/SERVICES.md` — карта сервисов и портов
6. `.agent/soul.md` — identity и values
7. `.agent/crons.md` — реестр cron-задач и heartbeat spec
8. `CLAUDE.md` — архитектурные инварианты (10-секционный промт)

## Первая команда

```bash
cd /Users/work/shadow-stack_local_1
curl -sS http://localhost:3001/ram 2>/dev/null || echo "shadow-api not reachable"
curl -sS http://localhost:20129/health | head -c 200
lsof -iTCP:20129 -sTCP:LISTEN -n -P 2>/dev/null
lsof -iTCP:3001 -sTCP:LISTEN -n -P 2>/dev/null
git status
git log --oneline -5
```

Это даст полную картину: RAM, живость сервисов, pm2 drift, uncommitted changes, последние коммиты. После этого — начинай с задачи #1 (ZeroClaw orchestrator) или спроси пользователя какую приоритетнее.

# PLAN.md — ALEX AI / Shadow Stack v6 Sync Plan
> Обновлён: **2026-04-28**. Phase vault: **5.2 → 5.3 (~65%)**.
> Репо: [huivrotiki/shadow-stack](https://github.com/huivrotiki/shadow-stack)

---

## 0. Фактическое состояние репо (diff с vault)

| Слой | Vault (целевое) | Репо (фактическое) | Δ |
|---|---|---|---|
| Git | инициализирован | ✅ коммиты есть, remote настроен | ✅ |
| `.state/` | `current.yaml`, `session.md`, `todo.md`, `locks/` | ✅ `current.yaml`, `session.md`, `todo.md`, `runtimes/` | ⚠️ нет `locks/` |
| `.agent/` | `SESSION.json`, `handoff.md`, `knowledge/`, `soul.md`, `crons.md` | ✅ директория существует | ⚠️ проверить состав |
| Routing | OmniRoute 9-tier cascade | `free-models-proxy` на :20129, `barsuk` дефолт, `or-auto` Tier 0 | ⚠️ нет `lib/modelRouter.ts` |
| Memory | Supermemory hot + ChromaDB cold + NotebookLM + SESSION.json | `@supermemory/tools` подключён | ⚠️ нет `lib/memory/recall.ts` |
| RAM Guard | <400MB → cloud-only, <200MB → ABORT | отсутствует | ❌ |
| Ralph Loop | R-A-L-P-H + DoD + `evaluateAnswer` | `auto-research-loop` в PM2 (loop-engine.cjs) | ⚠️ не R-A-L-P-H структура |
| ZeroClaw | Grammy webhook, <5MB RAM | ✅ `ZeroClaw.js` в корне, `zeroclaw.config.json` | ⚠️ webhook не установлен |
| Secrets | Doppler `serpent/dev_personal` | ✅ настроен, proxy работает через `doppler run` | ✅ |
| OmniRoute | :20130, реальный ключ | :20130 работает (`omniroute-kiro` в PM2) | 🔥 проверить OMNIROUTE_API_KEY |
| Langfuse | observability | 🔴 BLOCKED (ClickHouse loop) | ❌ |
| Telegram bot | heartbeats в группу | `bot/` директория есть | ⚠️ webhook не активен |
| Vercel | preview deploy зелёный | `vercel.json` есть, deploy не подтверждён | ⚠️ |

---

## 1. Critical path (блокеры — до всего остального)

### 1.1. Проверить и зафиксировать `OMNIROUTE_API_KEY` 🔥
`omniroute-kiro` числится в PM2 online, но vault фиксирует placeholder-ключ в Doppler.

```bash
# Проверка
doppler run --project serpent --config dev_personal -- bash -c \
  'curl -sS -H "Authorization: Bearer $OMNIROUTE_API_KEY" http://localhost:20130/v1/models | jq ".data | length"'

# Если вернул AUTH_001 — заменить ключ:
doppler secrets set OMNIROUTE_API_KEY="<real>" --project serpent --config dev_personal
```

**DoD:** `/v1/models` возвращает `>= 1`, без `AUTH_001`.

### 1.2. Починить Langfuse ClickHouse 🔴
`handoff.md` фиксирует loop ClickHouse. Блокирует наблюдаемость всего стека.

```bash
# Использовать официальный docker-compose от Langfuse v3
curl -LO https://raw.githubusercontent.com/langfuse/langfuse/main/docker-compose.yml
# Сверить с upgrade-guide: https://langfuse.com/self-hosting/upgrade-guides/upgrade-v2-to-v3
# CLICKHOUSE_PASSWORD должен быть URL-encoded если содержит спецсимволы
docker compose up -d && sleep 15 && curl -s http://localhost:3000/api/health
```

**DoD:** `http://localhost:3000` отдаёт 200; создан проект, получены `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` → добавить в Doppler.

### 1.3. Добавить `lib/health.ts` (зависимость §2)
Файл с `checkOllamaHealth()` и `checkOmniRouteHealth()`: 1500ms timeout, AbortSignal, OmniRoute бросает при AUTH-ошибке, Ollama возвращает `false`.

**DoD:** `pnpm typecheck` зелёный; `checkOmniRouteHealth()` печатает `true`.

---

## 2. Routing layer (доработка существующего прокси)

### 2.1. Добавить `lib/modelRouter.ts`
Текущий `free-models-proxy` (`:20129`) работает, но роутинг зашит в `server/free-models-proxy.cjs`. Нужна типизированная обёртка для Next.js layer.

```ts
// lib/modelRouter.ts
export interface ModelSelection {
  baseURL: string
  model: string
  provider: 'ollama' | 'omniroute' | 'openrouter' | 'barsuk'
  supermemory: boolean
}

export async function selectModel(mode: 'fast' | 'smart' | 'deep'): Promise<ModelSelection>
```

Логика: `fast` → Ollama если healthy → иначе OmniRoute `barsuk`. `smart`/`deep` → всегда OmniRoute + `supermemory: true`. Никаких `try/catch` без логирования.

### 2.2. Подключить `lib/logger.ts`
Совместим с форматом `data/heartbeats.jsonl`. Минимальный JSON-формат: `{level, ts, msg, ...ctx}`.

```ts
// lib/logger.ts — обёртка над console с JSON-структурой (или pino)
export const log = {
  info:  (msg: string, ctx?: object) => console.log(JSON.stringify({level:'info',  ts: Date.now(), msg, ...ctx})),
  warn:  (msg: string, ctx?: object) => console.log(JSON.stringify({level:'warn',  ts: Date.now(), msg, ...ctx})),
  error: (msg: string, ctx?: object) => console.log(JSON.stringify({level:'error', ts: Date.now(), msg, ...ctx})),
}
```

### 2.3. ESLint: запрет `Promise.all` в `lib/**`
Vault требует Sequential Execution — параллельность запрещена.

```js
// eslint.config.js — добавить в rules для lib/**
'no-restricted-syntax': ['error', {
  selector: "CallExpression[callee.object.name='Promise'][callee.property.name='all']",
  message: 'Promise.all запрещён в lib/** (Sequential Execution Policy)'
}]
```

**DoD §2:** unit-тест `selectModel('fast')` при stub `checkOllamaHealth=()=>false` → `provider='omniroute'`; при `=>true` → `provider='ollama'`.

---

## 3. State layer (доработка существующей структуры)

`.state/` и `.agent/` уже существуют. Нужно дополнить недостающими файлами.

### 3.1. Добавить `.state/locks/` директорию
```bash
mkdir -p .state/locks && touch .state/locks/.gitkeep
```
Advisory locks для координации между runtime'ами (OpenCode, ZeroClaw, Ralph Loop).

### 3.2. Проверить и дополнить `.agent/`
Убедиться, что присутствуют:
- `SESSION.json` — `{thoughtSignature, last_tier, last_score, updated_at}`
- `soul.md` — identity + non-negotiable values агента
- `crons.md` — реестр периодических задач
- `knowledge/shadow-stack-kb.md` — синхронизируется `shadow-kb-sync.sh`

### 3.3. Обновить `scripts/shadow-start.sh`
Существующие скрипты в `scripts/` — добавить entrypoint с: проверка Doppler scope → OmniRoute health → Ollama health → чтение `.state/current.yaml` → append в `.state/session.md`.

**DoD §3:** `bash scripts/shadow-start.sh` exit 0 + новая строка в `.state/session.md`.

---

## 4. Memory plane

### 4.1. `lib/memory/recall.ts` — Supermemory hot recall
Обёртка над `@supermemory/tools`. Дефолтный тег `[orchestration]`, проект `shadow-stack-v1`. Вызывается в начале каждого `/api/chat`.

```ts
import { createClient } from '@supermemory/tools'
export async function recall(query: string): Promise<string[]>
export async function remember(content: string, tags?: string[]): Promise<void>
```

### 4.2. `lib/memory/notebooklm.ts` — NotebookLM bridge
`~/.venv/notebooklm/bin/notebooklm` уже установлен. Exec-wrapper только для `smart`/`deep` режимов.

### 4.3. ChromaDB cold — отложить до Phase 5.4
Требует Python venv + ~500MB, конкурирует с Ollama на 8GB RAM. **Не делаем сейчас.**

**DoD §4:** `recall("test")` возвращает массив (пустой если нет данных, но не кидает).

---

## 5. RAM Guard

### 5.1. `lib/ramGuard.ts`
```ts
export async function freeMemoryMB(): Promise<number>        // vm_stat (macOS)
export async function gateBrowserMode(): Promise<boolean>    // <400MB → false
export async function gateAny(): Promise<'ok'|'cloud-only'|'abort'>  // пороги 200/400
```

### 5.2. Интеграция в `selectModel`
Перед выбором модели — вызвать `gateAny()`. При `'abort'` — бросить `RamGuardError`, не молча деградировать.

**DoD §5:** `freeMemoryMB()` возвращает число; `gateAny()` === `'abort'` при <200MB.

---

## 6. Ralph Loop (R-A-L-P-H)

Текущий `auto-research-loop` (PM2, `loop-engine.cjs`) выполняет исследовательские задачи, но не следует структуре R-A-L-P-H. Нужна параллельная типизированная реализация.

### 6.1. `packages/ralph-loop/`
```
retrieve.ts   — recall из Supermemory + NotebookLM
act.ts        — selectModel() → completion (через lib/modelRouter.ts)
learn.ts      — evaluateAnswer(score 1-10) через Tier-1 Ollama
persist.ts    — write .agent/SESSION.json + ChromaDB mock
handoff.ts    — git commit + Telegram notification
loop.ts       — orchestrator: task_id → .state/todo.md → R→A→L→P→H
```

### 6.2. Интеграция с PM2
После стабилизации — заменить `auto-research-loop` на `ralph-loop` в `ecosystem.config.cjs`.

**DoD §6:** `pnpm ralph run --task=test` — full cycle без ошибок (мок-данные ок).

---

## 7. ZeroClaw / Telegram bridge

`ZeroClaw.js` и `zeroclaw.config.json` существуют в корне. `bot/` директория присутствует.

### 7.1. Установить webhook
```bash
doppler run --project serpent --config dev_personal -- bash -c \
  'curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://<vercel-url>/api/telegram"'
```

### 7.2. Реализовать `app/api/telegram/route.ts`
Grammy webhook (CLAUDE.md описание уже есть). Reply Keyboard: Auto/Fast/Smart/Deep. Per-chat `chatMode`. Прокси в `/api/chat` с `x-autopilot-secret`.

### 7.3. ZeroClaw heartbeat-writer
Cron 60 сек → `data/heartbeats.jsonl`:
```json
{"ts":1776994435009,"service":"zeroclaw","pid":12345,"free_mb":273,"status":"ok"}
```
Регистрация в `.agent/crons.md`.

**DoD §7:** webhook отвечает 200; heartbeat-сообщение приходит в группу `-1002107442654` раз в N минут.

---

## 8. Web UI (Phase 5.3 dashboard)

Отложить до зелёных §1-§3. Порядок реализации:
`app/layout.tsx` → `app/page.tsx` → `components/{ModePill, ChatComposer, MessageBubble, ChatMessages, TypingIndicator, Header, StatusBar}.tsx`

Контракт компонентов описан в `CLAUDE.md`.

---

## 9. Vercel deploy

### 9.1. Настроить Doppler ↔ Vercel автосинк
Создать `serpent/prd` config в Doppler. Подключить интеграцию Vercel в дашборде Doppler (не ручной `env pull`).

### 9.2. Верифицировать `vercel.json`
Текущий `vercel.json` в репо — проверить `buildCommand` и `framework`. `doppler run -- pnpm build` не работает напрямую на Vercel — нужен DOPPLER_TOKEN service token в env Vercel.

### 9.3. Webhook после deploy
```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://<vercel-url>/api/telegram"
```

**DoD §9:** Vercel preview зелёный; Telegram webhook возвращает ответ модели.

---

## 10. Что НЕ делаем сейчас

- **ChromaDB / nomic-embed-text** — конкурирует с Ollama за RAM на 8GB
- **Browser Mode (Tier 7)** — требует <400MB свободной RAM
- **Антигравити OAuth** — настраивается через OmniRoute UI, не трогаем кодом
- **Multi-user memory** — пока `userId === chatId`
- **Pinokio + Arena.ai** — после §1-§9

---

## 11. Порядок исполнения (для Ralph Loop)

```
1. §1.1  Проверить OMNIROUTE_API_KEY                ← блокер
2. §1.2  Починить Langfuse (ClickHouse)             ← блокер наблюдаемости
3. §1.3  lib/health.ts
4. §2    lib/modelRouter.ts + lib/logger.ts + ESLint
5. §3    Дополнить .state/locks/ + .agent/ состав
6. §4.1  lib/memory/recall.ts (Supermemory)
7. §4.2  lib/memory/notebooklm.ts
8. §5    lib/ramGuard.ts
9. §6    packages/ralph-loop/ (мок-данные ок)
10. §7   ZeroClaw webhook + heartbeats
11. §8   Web UI
12. §9   Vercel deploy
```

Каждый пункт = один Ralph cycle с собственным DoD. **Параллельность запрещена** (vault §3 Sequential Execution Policy).

---

## 12. Verification checkpoint (после §1-§3)

```bash
cd "/Users/work/ALEX Ai"

# 1. OmniRoute
doppler run --project serpent --config dev_personal -- bash -c \
  'curl -sS -H "Authorization: Bearer $OMNIROUTE_API_KEY" http://localhost:20130/v1/models | jq -r ".data[0].id"'

# 2. Ollama
curl -sS http://localhost:11434/api/tags | jq -r '.models[0].name'

# 3. Supermemory key
doppler run --project serpent --config dev_personal -- \
  node -e "console.log(!!process.env.SUPERMEMORY_API_KEY)"

# 4. TypeCheck
pnpm typecheck

# 5. State bootstrap
bash scripts/shadow-start.sh && tail -1 .state/session.md

# 6. Langfuse (после §1.2)
curl -s http://localhost:3000/api/health | jq '.status'
```

Все 6 шагов зелёные → §1-§3 закрыты, переходим к §4.

---

## 13. Известные подводные камни

| Проблема | Где | Решение |
|---|---|---|
| Langfuse ClickHouse loop | `docker-compose.langfuse.yml` | Использовать официальный compose v3 от Langfuse |
| `ds-v3` (DeepSeek) сломан | `loop-engine.cjs` | null guard добавлен, модель нефункциональна — не включать в каскад |
| Doppler не передаёт ключи в PM2 | `ecosystem.config.cjs` | Запускать через `doppler run -- pm2 start ecosystem.config.cjs` |
| `Promise.all` в lib (нарушение Sequential Policy) | будущий `lib/**` | ESLint rule (§2.3) |
| `OMNIROUTE_API_KEY` placeholder | Doppler | §1.1 |

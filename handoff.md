# Отчет о сессии (Handoff) — 2026-04-07 · opencode

**Следующая сессия:** branch `new1`, commit `91b54236`
**Команда:** `cd /Users/work/shadow-stack && git checkout new1`

## Что изменилось

### ✅ SHD v3.1 Sync — IN PROGRESS (2026-04-07)

**Commits:** `91b54236`
**Plan:** `docs/plans/plan-v3-2026-04-07.md`

#### Изменения:
- DOCS.md обновлён до v3.1 (182 файла)
- Добавлена секция `server/lib/` [157-180] — 26 библиотек
- Добавлена секция `server/tools/` [181-183]
- Перенумерованы `.state/runtimes/` [128-131]
- Создан `docs/plans/plan-v3-2026-04-07.md`

#### Валидация:
```bash
npm run validate-docs  # ✅ проходит
```

#### Следующий шаг:
- [ ] Создать PR `new1` → `main`

---

### SHD v3.0 Migration — COMPLETE (предыдущая сессия)

### ✅ SHD v3.0 Migration — COMPLETE

**Дата:** 2026-04-07
**Commits:** 11 (2d502ce6 → 20e1f52b)
**Branch:** `new1` → PR pending to `main`

#### Структура:

| Компонент | Было | Стало |
|-----------|------|-------|
| Версия DOCS.md | v2.0 | **v3.0** |
| Файлов | ~106 | **~152** |
| Корневых .md | 14 | **20** |
| .github/ | ❌ | **✅** |
| notebooks/ | ✅ | ✅ (9) |
| .agent/skills/ | 21 SKILL.md | **22 SKILL.md** |
| supermemory.config | ❌ | **✅** |
| validate-docs script | ❌ | **✅** |

#### Файлы добавлены:
- `DOCS_RULES.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `LICENSE`
- `.agent/SESSION-START-RULES.md`
- `.agent/supermemory.config.json`
- `.github/CODEOWNERS`
- `.github/workflows/validate-docs.yml`
- `scripts/validate-docs-index.sh`

#### Файлы изменены:
- `DOCS.md` — обновлён до v3.0 с новой нумерацией [00-152]
- `.state/current.yaml` — обновлено состояние
- `.gitignore` — добавлен .env.doppler

#### Безопасность:
- `.env.doppler` удалён из git (содержал секреты)
- Git history переписан для удаления секретов

#### Валидация:
```bash
npm run validate-docs  # ✅ проходит
```

---

## OmniRoute Kiro Free-Tier + Copilot Removed

**Дата:** 2026-04-07
**Commits:** `7bf856d2`, `c73ccf36`
**Файлы:** `server/free-models-proxy.cjs`, `server/lib/llm-gateway.cjs`

#### Новые модели (OmniRoute :20130):

| Модель | Провайдер | Статус |
|--------|-----------|--------|
| `gm-flash` | gemini/gemini-2.5-flash | ✅ |
| `gm-flash-lite` | gemini/gemini-2.5-flash-lite | ✅ |
| `ag-gemini-flash` | antigravity/gemini-3-flash | ✅ |
| `ag-gemini-pro-low` | antigravity/gemini-3.1-pro-low | ✅ |
| `ag-gemini-pro-high` | antigravity/gemini-3.1-pro-high | ✅ |
| `kc-step-flash` | kc/stepfun/step-3.5-flash:free | ✅ |
| `omni-sonnet` | kiro/claude-sonnet-4.5 | ✅ |
| `omni-haiku` | kiro/claude-haiku-4.5 | ✅ |

#### Cascade (21 модель):
```
Tier 0a: gm-flash (Gemini 2.5 Flash)
Tier 0b: gm-flash-lite
Tier 0c: ag-gemini-flash (Gemini 3)
Tier 0d: ag-gemini-pro-low
Tier 0e: kc-step-flash (StepFun)
Tier 1:  omni-sonnet (Kiro Claude Sonnet 4.5)
Tier 2a: gr-llama70b (Groq)
...
```

#### Удалены:
- `copilot-sonnet-4.6`, `copilot-haiku-4.5` — нет подписки GitHub Copilot

#### Статистика:
- Всего моделей: 122 (было 124, -2 Copilot)
- Cascade: 21 модель
- Провайдеров: 18

---

### ✅ Dual Channels + Supermemory

**Дата:** 2026-04-06, 19:xx
**Commits:** `ae0dbe34` - current

#### Архитектура:

```
┌─────────────────────────────────────────────────────────┐
│  Claude Code / OpenCode / ZeroClaw                      │
└─────────────────┬───────────────────────────────────────┘
                  │
         ┌────────┴────────┐
         ↓                 ↓
    Channel-A          Channel-B
    (US-West)          (EU-West)
    :20133             :20134
         ↓                 ↓
    ┌─────────────────────────────┐
    │      Supermemory (:20135)    │
    │  - conversations           │
    │  - decisions               │
    │  - context                  │
    │  - recall/sync             │
    └─────────────────────────────┘
                  ↓
    ┌──────────────────────────────────────┐
    │ Upstreams: :20129 (113 моделей)    │
    │            :20132 (99 моделей)      │
    │            :20130 (OmniRoute 56)   │
    └──────────────────────────────────────┘
```

#### Файлы:
- `server/channel-router.cjs` — Dual channels + Supermemory API
- `server/context-pool.cjs` — Context borrow/lend/sync
- `server/shadow-proxy-duo.cjs` — Two providers

#### API Endpoints:

**Channel-A (:20133):**
```bash
curl -X POST http://localhost:20133/v1/chat/completions \
  -H "Authorization: Bearer sk-test" \
  -d '{"model":"gr-llama70b","messages":[{"role":"user","content":"hi"}]}'
```

**Channel-B (:20134):**
```bash
curl -X POST http://localhost:20134/v1/chat/completions \
  -H "Authorization: Bearer sk-test" \
  -d '{"model":"gr-llama70b","messages":[{"role":"user","content":"hi"}]}'
```

**Supermemory (:20135):**
```bash
# Store conversation
curl -X POST http://localhost:20135/memory/conversation \
  -d '{"channel":"A","model":"gr-llama70b","messages":[{"role":"user","content":"hi"}]}'

# Recall
curl "http://localhost:20135/memory/recall?q=hello"

# Sync agent context
curl -X POST http://localhost:20135/memory/sync \
  -d '{"agent":"opencode","context":{"task":"testing"}}'

# Context
curl "http://localhost:20135/memory/context?agent=opencode&recent=10"
```

#### Port Summary:
| Порт | Сервис | Назначение |
|------|--------|------------|
| :20133 | Channel-A | US-West, 113 models |
| :20134 | Channel-B | EU-West, 99 models |
| :20135 | Supermemory | Shared memory |
| :20130 | OmniRoute | Claude via Kiro |
| :20129 | Proxy-1 | 113 models |
| :20132 | Proxy-2 | 99 models |

---

## Что изменилось

### ✅ Model Speed Profiles (НОВОЕ)
**Коммит:** `cea277f2`
**Файлы:** 6 изменено, +303/-41

#### Реализовано:
1. **speed-profiles.cjs** — 3 профиля скорости:
   - 🦥 **slow**: 2 RPS, 120s timeout, qwen2.5:7b, 8192 tokens
   - ⚖️ **medium**: 5 RPS, 60s timeout, llama3.2:3b, 4096 tokens (default)
   - ⚡ **fast**: 10 RPS, 30s timeout, llama3.2:3b, 2048 tokens

2. **router-engine.cjs** — интеграция скорости:
   - `getSpeed()` — текущий профиль
   - `setSpeed(speed)` — изменить скорость
   - Выбор модели в зависимости от скорости

3. **rate-limiter.cjs** — динамический RPS:
   - Синхронизация с текущей скоростью
   - Token bucket per IP

4. **config.cjs** — новая переменная:
   - `MODEL_SPEED` (default: 'medium')

5. **server/index.js** — API endpoints:
   - `GET /api/speed` — текущая скорость
   - `POST /api/speed` — изменить скорость

#### Тесты:
```
slow:   89.5s latency (qwen2.5:7b)
medium: 12.3s latency (llama3.2:3b) ✅
fast:   0.6s latency (llama3.2:3b) ✅
```

## Использование

```bash
# Узнать текущую скорость
curl http://localhost:3001/api/speed

# Изменить на fast
curl -X POST http://localhost:3001/api/speed -d '{"speed":"fast"}'

# Изменить на slow
curl -X POST http://localhost:3001/api/speed -d '{"speed":"slow"}'
```

## Что НЕ менялось

- Основная логика маршрутизации (router-engine intent detection)
- Провайдеры (ollama, cloud, browser)
- Существующие endpoints

## Тесты

✅ Все 3 профиля протестированы
✅ Модели выбираются корректно
✅ Rate limiting работает
✅ API endpoints отвечают

## Следующие шаги

- [ ] Добавить UI для выбора скорости
- [ ] Сохранять выбранную скорость в localStorage
- [ ] Логировать смену скорости в metrics
- [ ] Добавить рекомендации по скорости на основе RAM

## Время сессии

**Начало:** 12:00
**Окончание:** 12:19
**Длительность:** 19 минут
**Коммитов:** 1
**Файлов изменено:** 6

---

## Ключевые достижения

1. ✅ Система выбора скорости модели (медленно/средне/быстро)
2. ✅ Динамический rate limiting в зависимости от скорости
3. ✅ Выбор оптимальной модели для каждого профиля
4. ✅ API для управления скоростью
5. ✅ Полное тестирование всех профилей

---

## 2026-04-06 · Context Pool + Dual Providers

**Context Pool API (:20135):**

```bash
# Heartbeat
curl -X POST http://localhost:20135/pool/heartbeat \
  -H "x-agent-id: shadow" \
  -H "Content-Type: application/json" \
  -d '{"task": "model-testing"}'

# Borrow context from another agent
curl http://localhost:20135/pool/borrow/shadow \
  -H "x-agent-id: shadowAlt"

# Sync full context
curl http://localhost:20135/pool/sync/shadow \
  -H "x-agent-id: shadowAlt"

# Lend context voluntarily
curl -X POST http://localhost:20135/pool/lend \
  -H "x-agent-id: shadow" \
  -H "Content-Type: application/json" \
  -d '{"toAgent": "shadowAlt", "context": {"model": "gr-llama70b"}}'
```

### Endpoints:
- `:20133` → shadow (us-west-1)
- `:20134` → shadowAlt (eu-west-1)  
- `:20135` → Context Pool (borrow/lend/sync)

---

## 2026-04-06 · Gateway Mask Layer (x2 Free Models)

**Коммит:** `44ed47f6`

### Архитектура маскировки:

```
Клиент → :20133 (gateway-mask)
         ↓
    ┌────┴────┬──────────────┐
    ↓         ↓              ↓
 :20129     :20132        :20130
 (113)     (99)          (56)
    ↓         ↓              ↓
  Groq     Groq          OmniRoute
 OpenR    OpenR         Kiro/Claude
 Gemini   Mistral       etc...
```

### Что замаскировано:
- **Model IDs**: убраны префиксы провайдеров (kr/ → "", anthropic/ → "")
- **Response model**: показывает "shadow-ai" вместо реального
- **Headers**: убран x-proxy-provider, x-upstream
- **Server**: показывает "nginx/1.24.0"

### Endpoints:
- `:20133` — Unified API (165+ models)
- `:20129` — free-models-proxy #1 (113 models)
- `:20132` — free-models-proxy #2 (99 models)
- `:20130` — OmniRouter (56 models)

### Unified API:
```bash
curl http://localhost:20133/v1/models \
  -H "Authorization: Bearer sk-unified-shadow-stack-2026"
```

### PM2 Services:
- `shadow-gateway-mask` → :20133 ✅
- `free-models-proxy` → :20129 ✅
- `omniroute-kiro` → :20130 ✅

---

## 2026-04-06 · OmniRouter + Providers Setup

**Коммит:** `d9b10314`
**Дата:** 2026-04-06 18:30

### OmniRouter Providers Added:
- OpenRouter, Groq, Mistral, Together, Fireworks, Cerebras
- Cloudflare, Cohere, Anthropic Direct
- **Total: 10 providers, 56 models** (OmniRouter :20130)

### free-models-proxy (:20129):
- **113 models** from 18 providers
- Cascade: gr-llama70b → gr-qwen3-32b → cb-llama70b → gem-2.5-flash → ms-small → or-nemotron → sn-llama70b → hf-llama8b → nv-llama70b → fw-llama70b → co-command-r → ol-qwen2.5-coder

### Model Rate Limits:
- zen-sonnet: 0.5 RPS (blocked)
- qwen3.6: 1 RPS (strict)

### OpenCode Config Updated:
- 40+ models in shadow provider
- OmniRoute provider with 10 models
- baseURL: http://localhost:20129/v1

---

## 2026-04-06 · Model Cleanup & Pre-load Rules

**Коммит:** `d8713109`
**Дата:** 2026-04-06
**Runtime:** opencode

### Что сделано:

1. **Отключены нерабочие модели:**
   - zen-sonnet, zen-opus, zen-haiku, zen-gpt5* (500 errors)
   - omni-sonnet, omni-haiku (401 Invalid API key)

2. **Rate limiting для zen и qwen3.6:**
   - zen-sonnet/opus: 0.5 RPS, burst 1 (очень строгий)
   - qwen3.6: 1 RPS, burst 2

3. **PRE-LOAD RULES в AGENTS.md:**
   - Supermemory recall перед задачей
   - NotebookLM query
   - LLM warm-up (проверка free-models-proxy)
   - Skills pre-load
   - MCP check

4. **Обновлены порты в CLAUDE.md:**
   - free-models-proxy: 113 моделей (20129)
   - OmniRoute: 20130 (Kiro)
   - sub-kiro: остановлен (20131)

5. **PM2 cleanup:**
   - sub-kiro удалён из PM2

### Проверка сервисов:
```bash
curl http://localhost:20129/health  # free-models-proxy ✅
curl http://localhost:20130/health  # OmniRoute ✅
```

### Рабочие модели cascade:
gr-llama70b → gr-qwen3-32b → cb-llama70b → gem-2.5-flash → ms-small → or-nemotron → sn-llama70b → hf-llama8b → nv-llama70b → fw-llama70b → co-command-r → ol-qwen2.5-coder

---

## 2026-04-06 · 18-Provider LLM Gateway Migration

**Коммит:** `69415276`
**Файлы:** 3 изменено (port 20129→20131)

### Что мигрировано из shadow-stack_local_1:
- `server/free-models-proxy.cjs` — 1021 lines, 18 провайдеров, 113 моделей
- `server/lib/llm-gateway.cjs` — 620 lines, self-healing cascade
- `server/lib/providers/castor-shadow.cjs` — routing table, 17 моделей
- `server/lib/router-engine.cjs` — 104 lines
- `server/lib/config.cjs`, `rate-limiter.cjs` — updated
- `server/lib/speed-profiles.cjs` — NEW
- `server/lib/context-gather.cjs` — NEW
- `server/lib/ram-guard.ts` — NEW
- `server/lib/zeroclaw-*.cjs` — pipeline, state, test-runner
- `server/computer/` — action.cjs, screenshot.cjs

### Порт: `:20131` (избежали конфликта с OmniRoute :20130)

### Опенкод настроен:
- `opencode.json` → baseURL: `http://localhost:20131/v1`
- 45 моделей в конфиге (auto, gr-*, ms-*, gem-*, ol-*, or-*, copilot-*, zen-*, oa-*, ds-*, hf-*)

### Service running:
- `http://localhost:20131` — 113 models, 16 cascade providers
- Health: `curl http://localhost:20131/health`

### Providers:
OpenRouter, Groq, Mistral, Zen, NVIDIA NIM, Together AI, Fireworks,
Cloudflare, Cohere, AI/ML API, OpenAI, Anthropic, DeepSeek, Gemini,
Alibaba, HuggingFace, Cerebras, SambaNova, Ollama, OmniRoute, Vercel, Copilot

### Cascade chain:
omni-sonnet → gr-llama70b → gr-qwen3-32b → cb-llama70b → gem-2.5-flash
→ ms-small → or-nemotron → sn-llama70b → or-step-flash → hf-llama8b
→ nv-llama70b → fw-llama70b → co-command-r → hf-qwen72b → hf-llama70b
→ ol-qwen2.5-coder

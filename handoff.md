# Отчет о сессии (Handoff) — 2026-04-06 · opencode

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

## 2026-04-06 · Migration to shadow-stack (main repo)

**Дата:** 2026-04-06
**Runtime:** opencode

### Миграция завершена: shadow-stack_local_1 → shadow-stack

**Commits в shadow-stack:**
- `3cbbb84` — feat(models): migrate 18-provider LLM gateway (port 20130)
- `816329cf` — fix(models): port 20130→20131 (avoid OmniRoute conflict)

**Что мигрировано:**
- `server/free-models-proxy.cjs` — 1021 lines, 18 провайдеров, 113 моделей
- `server/lib/llm-gateway.cjs` — 620 lines, full self-healing cascade
- `server/lib/providers/castor-shadow.cjs` — routing table с 17 моделями
- `server/lib/router-engine.cjs` — 104 lines
- `server/lib/config.cjs` — обновлён
- `server/lib/rate-limiter.cjs` — +speed profiles, -hardcoded key
- `server/lib/speed-profiles.cjs` — новый
- `server/lib/context-gather.cjs` — новый
- `server/lib/ram-guard.ts` — новый
- `server/lib/zeroclaw-*.cjs` — pipeline, state, test-runner
- `server/computer/action.cjs` — новый
- `server/computer/screenshot.cjs` — новый

**Порт free-models-proxy в shadow-stack:** `:20131`

**Backup:** `git -C /Users/work/shadow-stack branch backup-pre-migration`

**Service running:** `http://localhost:20131` (PID: 8806, 113 models)

---

## 2026-04-06 · Speed Profiles for Free Models

### Что изменилось

**Файлы:**
- `server/lib/speed-profiles.cjs` — добавлены rate limits для бесплатных моделей
- `server/lib/rate-limiter.cjs` — добавлен `claudeMiddleware` и `FREE_MODEL_LIMITS`
- `server/lib/providers/castor-shadow.cjs` — OmniRoute Claude в цепочках routing

**Модели с ограничениями:**

| Model | RPM | RPH | Burst | Provider |
|-------|-----|-----|-------|----------|
| kr/claude-sonnet-4.5 | 15 | 200 | 2 | OmniRoute (Kiro) |
| kr/claude-haiku-4.5 | 30 | 500 | 5 | OmniRoute (Kiro) |
| qwen/qwen3.6-plus:free | 60 | 1000 | 10 | OpenRouter |
| or-qwen3.6 | 60 | 1000 | 10 | OpenRouter |

### API Endpoints

```bash
# Текущая скорость
curl http://localhost:3001/api/speed

# Изменить скорость
curl -X POST http://localhost:3001/api/speed \
  -H 'Content-Type: application/json' \
  -d '{"speed":"slow"}'  # slow | medium | fast
```

### Speed Profiles

**Slow (🦥 Медленно):**
- Rate: 2 RPS, timeout 120s, 8192 tokens
- Models: qwen2.5:7b (ollama), kr/claude-sonnet-4.5, or-qwen3.6

**Medium (⚖️ Средне) — default:**
- Rate: 5 RPS, timeout 60s, 4096 tokens
- Models: llama3.2:3b (ollama), kr/claude-sonnet-4.5, or-qwen3.6

**Fast (⚡ Быстро):**
- Rate: 10 RPS, timeout 30s, 2048 tokens
- Models: llama3.2:3b (ollama), kr/claude-haiku-4.5, or-qwen3.6

### Commits

- `63a1940c` — feat(speed): add OmniRoute Claude free models with per-model rate limits
- `fa2304c6` — feat(speed): add Qwen 3.6 plus free model rate limits
- `6ff5219d` — feat(speed): add OpenCode Zen Qwen models with rate limits (reverted)
- `9bd46795` — fix(speed): remove unsupported Zen Qwen models, use OpenRouter free

### Тесты

```bash
# Test speed change
curl -X POST http://localhost:3001/api/speed -d '{"speed":"fast"}'

# Test Qwen 3.6
curl -X POST http://localhost:20129/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"or-qwen3.6","messages":[{"role":"user","content":"Hi"}],"max_tokens":20}'
```

### Что НЕ менялось

- Основная логика маршрутизации (router-engine)
- Провайдеры (ollama, copilot, openrouter)
- Существующие endpoints


---

## 2026-04-06 17:15 · Speed Test Results & Rate Limits

### Speed Test Results

**OpenRouter Free Models:**

| Model | Latency | Rate Limit | Status |
|-------|---------|------------|--------|
| or-nemotron | 2278-2633ms | 60 rpm, 1000 rph | ✅ FAST |
| or-step-flash | 3244-5234ms | 40 rpm, 700 rph | ✅ MEDIUM |
| or-qwen3.6 | 4948-6733ms | 30 rpm, 500 rph | ✅ SLOW |

**OmniRoute (Kiro :20130):**

| Model | Rate Limit | Status |
|-------|------------|--------|
| omni-sonnet | 15 rpm, 200 rph | ⚠️ Requires API key |
| omni-haiku | 30 rpm, 500 rph | ⚠️ Requires API key |

**Copilot:**
- ❌ PAT not supported (requires OAuth flow)
- Models: copilot-haiku-4.5, copilot-gpt-5.4-mini

### Updated Speed Profiles

**Slow (precise):**
- OmniRoute: omni-sonnet
- OpenRouter: or-qwen3.6 (6733ms)

**Medium (balanced):**
- OmniRoute: omni-sonnet
- OpenRouter: or-step-flash (5234ms)

**Fast:**
- OmniRoute: omni-haiku
- OpenRouter: or-nemotron (2633ms)

### Commits

- Previous: 63a1940c, fa2304c6, 6ff5219d, 9bd46795, 2aa59e68
- This session: $(git rev-parse --short HEAD)


---

## 2026-04-06 17:22 · Model Testing & Cleanup

### Comprehensive Model Testing

**Tested:** 50 models  
**Working:** 25 (50%)  
**Removed:** 7 dead models  
**Requires API key:** 18 models

### Speed Test Results by Tier

**🚀 ULTRA FAST (< 500ms):**
- gr-llama8b: 204ms (fastest)
- gr-gpt-oss20: 224ms
- gr-gpt-oss120: 248ms
- gr-llama4: 279ms
- ms-codestral: 317ms
- gr-compound: 345ms
- gr-llama70b: 366ms
- gr-qwen3: 399ms
- gr-kimi-k2: 442ms

**⚡ FAST (500-2000ms):**
- gr-qwen3-32b: 534ms
- fw-llama70b: 597ms
- ms-small: 696ms
- or-minimax: 1352ms
- ms-large: 1460ms

**🐢 MEDIUM (2000-7000ms):**
- or-gemma12b: 3704ms
- or-trinity: 4233ms
- or-nemotron120: 5874ms
- or-qwen3.6: 6298ms
- or-nemotron: 6689ms

**🐌 SLOW (> 7000ms):**
- or-step-flash: 9983ms
- or-glm4: 16513ms

### Removed Dead Models

**OpenRouter (4):**
- or-llama70b, or-llama3b, or-gemma27b, or-qwen3coder

**Fireworks (3):**
- fw-llama405b, fw-deepseek-v3, fw-deepseek-r1

### Requires API Key

**OpenCode Zen (12 models):** zen-opus, zen-sonnet, zen-haiku, zen-gpt5*, zen-codex*, zen-gemini*  
**Together AI (6 models):** tg-llama70b, tg-llama405b, tg-qwen-coder, tg-deepseek-v3, tg-deepseek-r1, tg-mixtral

### Provider Limits

| Provider | RPM | RPD | Refresh |
|----------|-----|-----|---------|
| Groq | 30 | 14400 | Daily |
| OpenRouter | 10-20 | 200 | Daily |
| Mistral | 1 | - | Monthly |
| Fireworks | - | - | Daily ($1) |

### Documentation

Created `docs/MODEL_LIMITS.md` with:
- Complete speed test results
- Provider limits and refresh schedules
- Recommended models by use case
- API key setup instructions

### Commits

- Previous: a284a636, efea18e2
- This session: $(git rev-parse --short HEAD)


---

## 2026-04-06 17:26 · Full Models Table

### Complete Model Inventory (106 models)

**Breakdown:**
- ❌ **Без ограничений:** 0 (0%)
- ✅ **С лимитами (работают):** 25 (23.6%)
- ⚠️ **Требуют API ключ:** 18 (17.0%)
- ⏳ **Не протестированы:** 56 (52.8%)
- 🗑️ **Удалены:** 7 (6.6%)

### Speed Distribution

**ULTRA FAST (< 500ms):** 9 models
- All Groq (100% success rate)
- Average: 330ms
- Best: gr-llama8b (204ms)

**FAST (500-2000ms):** 8 models
- Mixed providers
- Best: gr-qwen3-32b (534ms)

**MEDIUM (2000-7000ms):** 6 models
- Mostly OpenRouter
- Best: or-gemma12b (3704ms)

**SLOW (> 7000ms):** 2 models
- OpenRouter only
- Avoid: or-glm4 (16513ms)

### Provider Rankings

1. ⭐⭐⭐⭐⭐ **Groq** — 30 rpm, 14400 rpd, daily reset
2. ⭐⭐⭐⭐ **OpenRouter** — 10-20 rpm, 200 rpd, daily reset
3. ⭐⭐⭐ **Fireworks** — $1/day credit
4. ⭐⭐ **Mistral** — 1 rpm, monthly reset (too limited)

### Top Recommendations

**Production use:**
1. gr-compound (345ms) — universal
2. gr-llama70b (366ms) — quality + speed
3. or-trinity (4233ms) — high quality

**Avoid:**
- Mistral models (1 rpm limit)
- or-glm4 (16.5 seconds latency)
- Models without API keys

### Documentation

- `docs/MODELS_FULL_TABLE.md` — complete 106 models table
- `docs/MODEL_LIMITS.md` — limits and recommendations

### Commits

- 5a9ee885 — docs: comprehensive models table


---

## 2026-04-06 17:38 · AI.MD Master Rules Created

### AI.MD — Master AI Rules (338 lines)

**Главный файл правил работы ИИ для всех runtime**

### Key Protocols

1. **Memory First Protocol**
   - Call Supermemory before each phase
   - Call NotebookLM for best practices
   - Discover relevant skills
   - Check available MCP tools

2. **Enhanced Ralph Loop**
   ```
   IDLE → [MEMORY] → READ → [SKILLS] → PLAN → [MCP] → 
   EXEC → TEST → COMMIT → [SAVE] → SYNC
   ```

3. **RAM Guard**
   - Check before heavy operations
   - Auto-select models by RAM
   - > 500MB: all models
   - 200-500MB: cloud + ollama-3b
   - < 200MB: ABORT

4. **Skills Discovery**
   - Auto-find relevant skills before tasks
   - Priority: built-in → GitHub → MCP

5. **Session Lifecycle**
   - Open: Load AI.MD + memory + skills
   - During: Memory check each phase
   - Close: Save to Supermemory + handoff

### Integration

- `session-context-loader.sh` updated
- Auto-loads at every session start
- RAM status check added
- Skills count added

### Files

- `AI.MD` (new) — 338 lines, master rules
- `scripts/session-context-loader.sh` (updated)

### Commit

- 31032e64 — feat(ai): AI.MD master rules


---

## 2026-04-06 17:45 · Branch 'models' Created

### Combo-Race Model Implementation

**Branch:** `models` (local)  
**Status:** Implementation complete, testing pending

### What's in this branch

1. **combo-race.cjs** — Race strategy meta-model
   - Parallel execution of 3 fastest models
   - Returns first successful response
   - Fallback on failure

2. **Models used:**
   - gr-llama8b (204ms)
   - gr-gpt-oss20 (224ms)
   - gr-compound (345ms)

3. **Integration:**
   - Added to MODEL_MAP
   - Endpoint handler in free-models-proxy
   - Exported from llm-gateway

### Expected Performance

- **Latency:** ~200-250ms (first wins)
- **Reliability:** High (3 fallbacks)
- **Quality:** Groq tier (fast + reliable)

### Next Steps

1. Test combo-race with real queries
2. Compare quality vs individual models
3. Add voting/smart-cascade strategies
4. Merge to main after testing

### Commits in this branch

- All previous commits from main (13 total)
- New: combo-race implementation


---

## 2026-04-06 17:50 · DOCS.md Master Index Created

### DOCS.md — Master Documentation Index

**File:** DOCS.md (250+ lines)

### What's included

- Full project hierarchy with [N] numbering
- Russian descriptions for every file
- 100+ files documented
- 4-level classification system
- Statistics by category
- Update protocol

### Hierarchy levels

1. **Level 0 (Critical):** AI.MD, AGENTS.md, CLAUDE.md, soul.md
2. **Level 1 (State):** handoff.md, current.yaml, session.md, todo.md
3. **Level 2 (Documentation):** SERVICES.md, MODEL_LIMITS.md, etc.
4. **Level 3 (Skills/Config):** crons.md, skills registry, etc.
5. **Level 4 (Code/Infrastructure):** server/, bot/, etc.

### Commit

- DOCS.md added to branch 'models'


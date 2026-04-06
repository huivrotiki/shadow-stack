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


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

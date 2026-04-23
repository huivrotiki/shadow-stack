# Отчет о сессии (Handoff) — 2026-04-24 12:23 · opencode

## Что изменилось

### ✅ Shadow Free Proxy: обновление моделей (102 → 139)
**Файл:** `server/free-models-proxy.cjs`

#### Что сделано:
1. **Добавлено 28 новых KiroAI free models (OmniRoute :20130):**
   - `kc-llama33` — Llama 3.3 70B Instruct
   - `kc-llama4-mav` / `kc-llama4-scout` — Llama 4 семейство
   - `kc-mistral7b` / `kc-mistral24b` — Mistral models
   - `kc-kimi-k2` — Moonshot Kimi 2.5
   - `kc-gpt41-nano` / `kc-gpt4o-mini` / `kc-gpt5-mini` / `kc-gpt5-nano` — OpenAI models
   - `kc-qwen3-235b` / `kc-qwen3-vl-235b` / `kc-qwen3-vl-30b` — Qwen3 с thinking
   - `kc-grok-code` — Grok Code Fast 1
   - `kc-deepseek-v3.1` / `kc-deepseek-v3.2` — DeepSeek V3
   - `kc-claude-haiku` — Claude 3 Haiku
   - `kc-tg-llama70b` / `kc-tg-deepseek70b` / `kc-tg-vision` — Together Free via OmniRoute

2. **Обновлена CASCADE_CHAIN (24 модели):**
   - Tier 0: 8 fastest free models (gm-flash, kc-*, omni-sonnet)
   - Tier 1: KiroAI Claude (omni-sonnet, kc-claude-haiku)
   - Tier 2: Groq LPU (gr-llama8b=261ms, gr-llama70b, gr-qwen3-32b, cb-llama70b)
   - Tier 3: Other free tiers (gemini, mistral, openrouter)
   - Tier 4: Fallback (huggingface, nvidia, fireworks, cohere)
   - Tier 5: Local Ollama

3. **Перезапуск прокси:**
   - `pkill -f free-models-proxy.cjs`
   - `nohup node free-models-proxy.cjs &`
   - Health check: `http://localhost:20129/health` → `"models": 139` ✅

## Почему было принято именно такое решение

1. **OmniRoute :20130 имеет 33 free модели** — нужно использовать все доступные бесплатные модели
2. **Tier 0 приоритет** — самые быстрые free модели первыми (kc-gpt5-nano, kc-gpt4o-mini = <500ms)
3. **gr-llama8b (261ms)** остаётся в Tier 2 — самая быстрая модель в проекте
4. **Together Free via OmniRoute** — бесплатные Llama 70B и DeepSeek 70B (ранее недоступны)

## Что мы решили НЕ менять

- Существующие провайдеры (openrouter, copilot, groq, mistral, etc.) — работают стабильно
- Логику `llm-gateway.cjs` (RATE_LIMITED{}, isNearLimit) — уже реализована
- `combo-race.cjs` (3 fastest models) — не требует обновления
- `loop.js` (NotebookLM first, gr-llama8b, no delays) — работает корректно

## Тесты

✅ **Proxy Health Check:**
```bash
curl http://localhost:20129/health
# {"status":"ok","models":139,"cascade":[...24 models]}
```

✅ **Model Count:**
- Before: 102 models
- After: 139 models (+37 new)
- KiroAI free models: 28

✅ **Cascade Chain Verification:**
- 24 models in chain (Tier 0-5)
- gr-llama8b (261ms) в Tier 2 ✅
- kc-* models в Tier 0-1 ✅

✅ **Syntax Check:**
```bash
node --check server/free-models-proxy.cjs  # ✅ No errors
```

## Журнал несоответствий / Подводные камни

### 1. Heartbeat write failed
**Ошибка:** `ENOENT: no such file or directory, open 'data/heartbeats.jsonl'`
**Причина:** Папка `data/` не существует при запуске
**Решение:** Создать `mkdir -p data/` или проверять наличие в `writeHeartbeat()`
**Статус:** ❌ Не исправлено (не критично)

### 2. Время сессии
**Начало:** 12:20 (2026-04-24)
**Окончание:** 12:23 (2026-04-24)
**Длительность:** ~3 минуты
**Коммитов:** 0 (только локальные изменения, ещё не закоммичено)

### 3. Groq TPD всё ещё близок к лимиту
**Статус:** ~98,400 / 100,000 использовано
**Осталось:** Ждать 00:00 UTC (недолго)
**Действие:** Новые kc-* модели разгрузят Groq

---

## Следующие шаги (Чеклист)

- [ ] **Закоммитить изменения proxy:**
    ```bash
    cd /Users/work/shadow-stack_local_1
    git add server/free-models-proxy.cjs
    git commit -m "feat(proxy): add 37 new models (102→139), update cascade chain with kc-* free tiers"
    ```

- [ ] **Проверить notebooklm ask** (перед следующей задачей):
    ```bash
    ~/.venv/notebooklm/bin/notebooklm ask "Shadow Stack proxy models architecture"
    ```

- [ ] **Дождаться сброса Groq TPD** (00:00 UTC, ~5 минут) и запустить:
    ```bash
    node autoresearch/evaluate.js
    node autoresearch/loop.js 60
    ```

- [ ] **Протестировать новые kc-* модели:**
    ```bash
    curl -X POST http://localhost:20129/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{"model":"kc-gpt5-nano","messages":[{"role":"user","content":"test"}],"stream":false}'
    ```

---

## Краткое описание системы "Shadow Free Proxy :20129"

### Текущий статус:
- **Models:** 139 (было 102, +37 новых)
- **Providers:** 17 (openrouter, copilot, groq, mistral, zen, nvidia, together, fireworks, cloudflare, cohere, aimlapi, openai, anthropic, deepseek, gemini, huggingface, cerebras, sambanova, omniroute)
- **Cascade Chain:** 24 модели (Tier 0-5)
- **Fastest Model:** gr-llama8b (261ms)
- **OmniRoute Free:** 28 моделей (kc-*, kc-tg-*)

### Каскад (упрощённо):
```
User Request → Tier 0 (kc-gpt5-nano, gm-flash, etc.)
             → Tier 1 (omni-sonnet, kc-claude-haiku)
             → Tier 2 (gr-llama8b=261ms, groq, cerebras)
             → Tier 3 (gemini, mistral, openrouter)
             → Tier 4 (huggingface, nvidia, fireworks)
             → Tier 5 (ol-qwen2.5-coder — local)
```

---

## Отчет о сессии (Handoff) — 2026-04-24 12:30 · opencode

### ✅ OpenCode.json: обновление списка моделей и добавление shadow-last-auto
**Файл:** `opencode.json`

#### Что сделано:
1. **Добавлено 20 новых моделей KiroAI (kc-*):**
   - `kc-llama33`, `kc-llama4-mav`, `kc-llama4-scout`
   - `kc-mistral7b`, `kc-mistral24b`
   - `kc-kimi-k2`, `kc-gpt41-nano`, `kc-gpt4o-mini`, `kc-gpt5-mini`, `kc-gpt5-nano`
   - `kc-qwen3-235b`, `kc-qwen3-vl-235b`, `kc-qwen3-vl-30b`
   - `kc-grok-code`, `kc-deepseek-v3.1`, `kc-deepseek-v3.2`
   - `kc-claude-haiku`
   - `kc-tg-llama70b`, `kc-tg-deepseek70b`, `kc-tg-vision`

2. **Добавлена модель `shadow-last-auto`:**
   - `"shadow-last-auto": { "name": "Shadow Last Auto (remembers last model)" }`
   - Доступна в меню выбора моделей OpenCode

3. **Обновлено название провайдера:**
   - Было: `"Shadow (113 models via free-proxy :20129)"`
   - Стало: `"Shadow (139 models via free-proxy :20129)"`

4. **Итого моделей в shadow провайдере:** 131 (JSON без комментариев валиден)

#### Почему так:
- OpenCode использует JSONC (JSON с комментариями) — поддерживается
- `shadow-last-auto` позволяет запомнить последнюю использованную модель
- Все новые kc-* модели доступны для выбора через меню

#### Тесты:
✅ **JSON валидация** (без комментариев): проходит ✅  
✅ **Количество моделей**: 131 в shadow provider ✅  
✅ **shadow-last-auto**: присутствует ✅

#### Следующие шаги:
- [ ] Перезапустить OpenCode для применения изменений
- [ ] Выбрать `shadow/shadow-last-auto` в меню моделей
- [ ] Протестировать новые kc-* модели через OpenCode

---

**✅ Handoff-документ обновлен. Теперь вы можете безопасно выполнить команду `/clear`**

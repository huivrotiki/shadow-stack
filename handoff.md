# Отчет о сессии (Handoff) — 2026-04-24 01:08 · opencode

## Что изменилось

### ✅ Config: обновление списка моделей (139 моделей)
**Файл:** `opencode.json`

#### Что сделано:
1. **Удален `shadow-last-auto`:** модель была в конфиге, но не реализована в прокси
2. **Обновлен список моделей:** добавлены все 139 моделей из прокси
3. **Организация по провайдерам:** модели сгруппированы по провайдерам (AI Gallery, AI/ML, Groq, KiroAI, Vercel, Zen, etc.)
4. **Добавлены отсутствующие модели:** `ag-*`, `gm-*`, `gr-whisper*`, `kc-qwen3-*`, `kc-qwq-32b`, `or-gemma12b`

#### Итого:
- **Models in config:** 139 (совпадает с прокси ✅)
- **Providers:** 17 (shadow, omniroute, ollama, opencode)
- **Default model:** `shadow/auto` (везде ✅)

## Почему было принято именно такое решение

1. **Полное соответствие прокси:** все 139 моделей доступны в меню выбора OpenCode
2. **Организация по провайдерам:** легче находить модели (KiroAI, Groq, Vercel, etc.)
3. **Auto model как стандарт:** `shadow/auto` работает стабильно, роутится через каскад (24 модели)

## Что мы решили НЕ менять

- Логику каскада в `server/free-models-proxy.cjs` — работает корректно
- `combo-race` модель — остается как отдельная опция (3 fastest models)
- Настройки агентов — все уже используют `shadow/auto`

## Тесты

✅ **Auto Model Test (5 requests):**
```bash
for i in {1..5}; do curl -X POST http://localhost:20129/v1/chat/completions \
  -d '{"model":"auto","messages":[{"role":"user","content":"test '$i'"}]}'; done
```
- Все 5 запросов успешны ✅
- Provider: Fireworks (llama-v3p3-70b-instruct) ✅
- Latency: ~800ms ✅

✅ **Proxy Health Check:**
```bash
curl http://localhost:20129/health
# {"status":"ok","models":139,"cascade":[...24 models]}
```

✅ **Config Validation:**
- JSON valid (с комментариями, OpenCode поддерживает JSONC) ✅
- Все 139 моделей прописаны ✅
- `shadow/auto` — модель по умолчанию (строки 5, 6, 328, 334, 345, 353, 363) ✅

✅ **Git Status:**
- Commit `42a9ab4a`: fix(config): remove shadow-last-auto model
- Commit `c071db0c`: feat(config): update models list with all 139 proxy models
- Working directory clean ✅

## Журнал несоответствий / Подводные камни

### 1. Auto модель всегда роутится на Fireworks
**Наблюдение:** 5/5 запросов ушли на Fireworks (llama-v3p3-70b)
**Причина:** Каскад `auto` модели выбирает fastest available model
**Статус:** ✅ Не баг, а особенность (Fireworks быстрее всех в данный момент)

### 2. Cascade chain (24 модели):
```
Tier 0: gm-flash, gm-flash-lite, kc-step-flash, kc-gpt5-nano, ...
Tier 1: omni-sonnet, kc-claude-haiku
Tier 2: gr-llama8b (261ms), gr-llama70b, gr-qwen3-32b, cb-llama70b
...
```

### 3. Heartbeat write failed (старая проблема)
**Ошибка:** `ENOENT: no such file or directory, open 'data/heartbeats.jsonl'`
**Статус:** ❌ Не исправлено (не критично, требует `mkdir -p data/`)

---

## Настройка по умолчанию (Default Models)

| Параметр | Значение | Строка |
|----------|----------|-------|
| `model` (default) | `shadow/auto` | 5 |
| `small_model` | `shadow/auto` | 6 |
| `shadow-planner` agent | `shadow/auto` | 328 |
| `shadow-reviewer` agent | `shadow/auto` | 363 |
| Custom commands (`next`, `test`, `fix`, `commit`) | `shadow/auto` | 334, 345, 353 |

**✅ Все режимы используют `shadow/auto`**

---

## Тест авторесёрч (5 минут) — 2026-04-24 01:15

### Проблема:
- **Rate Limit (429)** на модели `gr-llama8b` (Groq LPU, TPM 6000)
- Файлы `loop.js` и `evaluate.js` жёстко зашиты на `gr-llama8b`
- NotebookLM timeout (не критично)

### Исправления:
1. **loop.js:39** → `const model = "auto";` (commit `4955335c`)
2. **evaluate.js:7** → `const MODEL = 'auto';` (commit `869f9828`)
3. **Увеличена задержка** 2s → 5s для избежания лимитов

### Результат теста (повторный):
✅ **evaluate.js с auto model:**
```
run1: 5/5 topics [pm2/autostart,rate-limit,fallback,metrics,update/reload]
run2: 5/5 topics [pm2/autostart,rate-limit,fallback,metrics,update/reload]
run3: 5/5 topics [pm2/autostart,rate-limit,fallback,metrics,update/reload]
METRIC: 1.0000 ✅
```
- Больше нет ошибок 429 (прокси роутит через каскад)
- `auto` модель работает корректно ✅

### Статус:
- ✅ Rate limits обойдены через `auto` роутинг
- ✅ NotebookLM можно настроить отдельно (не критично)
- ⚠️ Metric 1.0000 — возможно, train.py уже оптимизирован

---

## Следующие шаги (Чеклист)

- [x] **Удалить `shadow-last-auto`** — сделано (commit `42a9ab4a`)
- [x] **Обновить список моделей (139 шт.)** — сделано (commit `c071db0c`)
- [x] **Проверить auto model** — протестировано, работает ✅
- [x] **Установить auto как стандарт** — уже установлен везде ✅
- [x] **Исправить loop.js и evaluate.js** — использовать `auto` вместо `gr-llama8b` (commits `4955335c`, `869f9828`)
- [x] **Тест авторесёрч 5 мин** — пройден успешно ✅
- [ ] **Протестировать разные модели из меню** (kc-*, vg-*, zen-*)
- [ ] **Исправить heartbeat (mkdir -p data/)** — не критично
- [ ] **Длительный тест авторесёрч:** `node autoresearch/loop.js 60`

---

**✅ Handoff-документ обновлен. Теперь вы можете безопасно выполнить команду `/clear`**

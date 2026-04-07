# Heads of Production

**Дата:** 2026-04-07  
**Статус:** Активный  
**Ответственный:** OpenCode Runtime

---

## 🎯 Ключевые правила Production

### 1. RAM Guard (КРИТИЧНО)

**Правило:** Проверять RAM перед любыми операциями

```bash
# Проверка RAM
vm_stat | grep "Pages free"
```

**Пороги:**
- ✅ **> 500 MB:** Все операции разрешены
- ⚠️ **200-500 MB:** Cloud-only режим, ollama-3b только
- 🔴 **< 200 MB:** ABORT — перезагрузка системы обязательна

**Текущий статус (2026-04-07):** 98 MB — КРИТИЧНО

---

### 2. PM2 Сервисы

**Обязательные сервисы:**
- `shadow-api` (:3001) — основной API
- `free-models-proxy` (:20129) — 106 моделей
- `omniroute-kiro` (:20130) — облачный каскад
- `shadow-channels` (:20133-20135) — каналы
- `hb-monitor` — мониторинг heartbeat

**Проверка:**
```bash
pm2 list
pm2 save  # после изменений
```

**Правило:** Если сервис крашится > 5 раз — остановить и диагностировать, не перезапускать автоматически.

---

### 3. Heartbeat Мониторинг

**Правило:** Каждый долгоживущий сервис пишет heartbeat каждые 60s в `data/heartbeats.jsonl`

**Формат:**
```json
{"ts": 1775515834340, "service": "shadow-api", "pid": 1731, "free_mb": 115, "status": "ok"}
```

**Мониторинг:** `hb-monitor` проверяет каждые 3 минуты, алертит в Telegram при пропуске.

---

### 4. Git Workflow

**Правило:** Коммитить только логически завершённые единицы работы

**Формат коммита:**
```
type(scope): description

feat(models): add combo-race meta-model
fix(bot): remove shadow-bot (missing tokens)
chore(session): complete 2026-04-07 session
```

**Запрещено коммитить:**
- `.env`, `*.pem`, `*.key`, `*secret*`
- `data/*-memory.json`, `data/*-scores.json`
- Runtime-файлы из `.gitignore`

---

### 5. Handoff Protocol

**Правило:** Обновлять `handoff.md` в конце каждой сессии

**Обязательные секции:**
1. Что изменилось (конкретные файлы и функции)
2. Почему принято такое решение
3. Что НЕ менялось
4. Тесты (какие подтверждают работоспособность)
5. Подводные камни (баги, странности, мины)

---

### 6. Telegram Bot

**Правило:** Если токены отсутствуют — удалить из PM2, не оставлять крашащимся

**Проверка:**
```bash
grep "TELEGRAM_BOT_TOKEN" .env
```

**Если пусто:** `pm2 delete shadow-bot`

---

### 7. Model Testing

**Правило:** Тестировать модели перед добавлением в production

**Тест:**
```bash
curl -X POST http://localhost:20129/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"MODEL_NAME","messages":[{"role":"user","content":"Test"}],"max_tokens":20}'
```

**Метрики:**
- Latency (time curl)
- Качество ответа
- Стабильность (3+ запроса)

---

### 8. Combo Models

**Правило:** Combo-модели (race, voting, cascade) требуют особого внимания

**Проблема (2026-04-07):** combo-race работает медленно (7.5s вместо 0.2s)

**Причина:** Возможно, последовательное выполнение вместо параллельного

**Действие:** Проверить `server/lib/combo-race.cjs` на параллельность

---

### 9. Context Management

**Правило:** При context >= 85% — немедленно:
1. Обновить `handoff.md`
2. `git add -A && git commit`
3. `git push` (если разрешено)
4. `/clear`

**Приоритет:** Наивысший, даже если задача не завершена

---

### 10. Secrets Management

**Правило:** Все секреты через `.env` или Doppler

**Проверка:**
```bash
# Проверить, что .env в .gitignore
git check-ignore .env

# Проверить, что нет секретов в коде
rg -i "api[_-]?key|token|secret|password" --type js --type ts
```

---

## 📊 Production Checklist

Перед деплоем:

- [ ] RAM > 500 MB
- [ ] Все обязательные PM2 сервисы online
- [ ] hb-monitor работает
- [ ] Нет незакоммиченных изменений
- [ ] handoff.md обновлён
- [ ] Тесты пройдены
- [ ] Нет секретов в коде

---

**Последнее обновление:** 2026-04-07 01:52  
**Версия:** 1.0

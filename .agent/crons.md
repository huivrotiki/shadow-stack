# Реестр Кронов и Хартбитов Shadow Stack

Каждое периодическое задание и долгоживущий сервис регистрируется здесь. Скрытых кронов быть не должно.

## 🕒 Кроны (Scheduled)

| Название | Расписание | Команда | Цель | Владелец |
|---|---|---|---|---|
| heartbeat-monitor | */3 * * * * | node scripts/heartbeat-monitor.cjs | Мониторинг хартбитов, алерт при пропуске | pm2 |

### Как зарегистрировать крон
1. Выберите инструмент: **launchd** (macOS), **pm2-cron**, или **node-cron**.
2. Добавьте строку в таблицу выше: `название · расписание · команда · цель · владелец`.
3. Закоммитьте файл задания:
   - launchd → `~/Library/LaunchAgents/com.shadowstack.<name>.plist`
   - pm2-cron → запись в `ecosystem.config.cjs`
   - node-cron → `scripts/crons/<name>.cjs`
4. Каждый запуск должен писать хартбит в `data/heartbeats.jsonl`.

## 💓 Хартбиты (Liveness signals)

Каждый долгоживущий сервис должен слать хартбит в `data/heartbeats.jsonl` каждые 60 секунд:

```json
{"ts": 1775373537990, "service": "shadow-api", "pid": 12345, "free_mb": 1024, "status": "ok"}
```

### Обязательные сервисы

| Сервис | Порт | Интервал | Ключ хартбита | Владелец | Статус |
|---|---|---|---|---|---|
| shadow-api | 3001 | 60s | `shadow-api` | pm2 | ✅ внедрено (2026-04-06) |
| shadow-bot | 4000 | 60s | `shadow-bot` | pm2 | ✅ внедрено (2026-04-06) |
| zeroclaw-http | 3001/api/zeroclaw | 60s | `zeroclaw` | pm2 | ✅ внедрено (2026-04-06) |
| free-models-proxy | 20129 | 60s | `free-proxy` | pm2 | ✅ внедрено (2026-04-06) |
| sub-kiro | 20131 | 60s | `sub-kiro` | pm2 | ✅ внедрено (2026-04-06) |
| ollama | 11434 | 300s | `ollama` | pm2 | ✅ внедрено (2026-04-06) |

### Пример писателя хартбитов (для любого рантайма)

```javascript
const fs = require('fs');
const os = require('os');
function heartbeat(service, extra = {}) {
  const line = JSON.stringify({
    ts: Date.now(),
    service,
    pid: process.pid,
    free_mb: Math.round(os.freemem() / 1024 / 1024),
    status: 'ok',
    ...extra,
  });
  fs.appendFileSync('data/heartbeats.jsonl', line + '\n');
}
// Вызывать heartbeat('shadow-api') каждые 60с через setInterval
```

### Монитор хартбитов (Алерт в Telegram)

Единый крон (зарегистрирован выше) проверяет `data/heartbeats.jsonl`. Если сервис не сообщал о себе > 3 × интервал, отправляется алерт в Telegram через бота.

## ⚠️ Правила

- **Никакого скрытого планирования.** Если работает периодически — оно должно быть в этом файле.
- **Каждый крон пишет в `data/crons.log`** (в `.gitignore`).
- **Каждый хартбит пишет строку в `data/heartbeats.jsonl`** (в `.gitignore`, ротация при 10MB).
- **Пропуск хартбита = алерт**, а не рестарт. Решение о перезапуске принимает человек.
- **Кроны не хранят секреты в строке команды** — используйте env через Doppler.

---
description: RAM monitoring and protection — prevent OOM on M1 8GB
---

# RAM Guard — Стабильность системы

## Мониторинг

Перед запуском Playwright, тяжёлых скриптов или Ollama моделей:
```bash
curl -s http://localhost:3001/ram | python3 -m json.tool
```

Response:
```json
{
  "free_mb": 651,
  "safe": true,
  "critical": false,
  "total_mb": 8192,
  "recommendation": "🟡 ollama-7b ok, skip browser"
}
```

## Пороги

| Free RAM | Действие |
|----------|----------|
| > 600MB | ✅ Full mode — все сервисы, browser, любые модели |
| 400-600MB | 🟡 ollama-3b ok, skip browser |
| 200-400MB | ⚠️ ollama-3b only, skip browser, kill non-essential |
| < 200MB | 🔴 ABORT — освободить RAM немедленно |

## Sequential-only правило

**ЗАПРЕЩЕНО**: `Promise.all` для работы агентов, эмбеддингов или API вызовов
**РАЗРЕШЕНО**: только последовательное выполнение (`for...of`, `await` по одному)

Причина: M1 8GB — параллельные операции = OOM kill

## Kill List (если RAM < 300MB)

Процессы которые можно остановить:
1. Claude.app (Electron) — ~70MB
2. Ollama модели > 3B — unload через keep_alive=0
3. Chrome CDP targets — закрыть вкладки

## Model Limits (M1 8GB)

- **Max monolithic model:** 4GB (hard limit)
- **MoE (mixtral:8x7b):** ALLOWED через SSD Expert Streaming (USB SSD ~500MB/s)
- **Recommended:** qwen2.5-coder:3b (~1.9GB), llama3.2:3b (~2.0GB)
- **NEVER:** 2 Ollama модели одновременно

## Ollama RAM Management

После каждого запроса к Ollama — выгрузить модель:
```bash
curl -s -X POST http://localhost:11434/api/chat \
  -d '{"model":"qwen2.5-coder:3b","keep_alive":0,"messages":[]}' \
  > /dev/null 2>&1 || true
```

## Auto-protection

```bash
# Check before heavy operation
FREE=$(curl -s http://localhost:3001/ram | python3 -c "import sys,json; print(json.load(sys.stdin)['free_mb'])")
if [ "$FREE" -lt 200 ]; then
  echo "🔴 CRITICAL: Only ${FREE}MB free. ABORT."
  exit 1
fi
```

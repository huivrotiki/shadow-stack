# Delegation & Routing Rules

> Единственный источник правды для делегации. CLAUDE.md ссылается, не дублирует.

---

## Delegation Matrix

| Тип задачи | Где выполнять | Фоллбэк |
|--------------|-----------------|----------|
| research, analysis, summarize | OmniRoute :20128 (search) | OmniRoute → Claude |
| codegen, refactor, debug | OmniRoute :20128 | Claude → Ollama |
| browser, scraping, CDP | OmniRoute :20128 | n8n :5678 |
| emergency, all-providers-down | n8n :5678 | Telegram запрос человеку |
| ultra-light, offline | ZeroClaw :4111 | shadow-coder (ollama) |
| planning, content | OmniRoute :20128 | shadow-general (ollama) |

---

## Fallback Chain

```
omnirouter → zeroclaw(ollama) → n8n → human(Telegram)
```

Без исключений. Никогда не останавливаться на ошибке провайдера.

---

## Quota Thresholds

```json
{
  "quota_thresholds": {
    "anthropic": 0.9,
    "openrouter": 0.9
  },
  "action_on_threshold": "skip_provider"
}
```

---

## Circuit Breaker

```json
{
  "circuit_breaker": {
    "max_failures": 5,
    "cooldown_seconds": 120,
    "backoff": "exponential",
    "backoff_base": 2,
    "max_backoff_seconds": 300
  }
}
```

---

## Emergency Protocol

1. Все провайдеры упали → запустить n8n :5678 emergency workflow
2. Отправить Telegram уведомление человеку (@huivrotiki)
3. Сохранить последнее состояние в SESSION.md
4. Никогда не придумывать результаты самостоятельно
5. Ожидать человеческого ответа перед продолжением

---

## Triada (Mutual Fallback)

```
Claude ↔ OmniRoute :20128 ↔ ZeroClaw :4111
Любой нод может заменить любой другой.
Система неостановима.
```

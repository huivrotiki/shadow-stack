# Security Policy

## Secrets Management

**Все ключи хранятся в Doppler.** Никогда не хардкодить ключи в коде.

### Разрешённые способы

1. **Doppler (рекомендуется):**
   ```bash
   doppler run --project serpent --config dev -- <command>
   ```

2. **Локальный .env (только для разработки):**
   - `.env` в gitignore — только пустые плейсхолдеры
   - `.env.shell` — всегда в gitignore

### Запрещено

- Хардкодить ключи в код
- Коммитить ключи в git
- Использовать `.env` с реальными ключами
- Использовать `process.env.KEY` без проверки наличия ключа

## API Keys

| Сервис | Переменная | Требуется |
|--------|------------|-----------|
| OpenAI | `OPENAI_API_KEY` | Да |
| Anthropic | `ANTHROPIC_API_KEY` | Да |
| OpenRouter | `OPENROUTER_API_KEY` | Да |
| Groq | `GROQ_API_KEY` | Да |
| Mistral | `MISTRAL_API_KEY` | Да |
| Telegram | `TELEGRAM_BOT_TOKEN` | Да |
| GitHub | `GITHUB_TOKEN` | Да |

## Запуск сервисов

```bash
# Shadow API
doppler run --project serpent --config dev -- node server/index.js

# Free Models Proxy
doppler run --project serpent --config dev -- node server/free-models-proxy.cjs

# Telegram Bot
doppler run --project serpent --config dev -- node bot/opencode-telegram-bridge.cjs
```

## Проверка утечек

```bash
# Проверить, что нет ключей в коммитах
git log --all --full-history --p -S "sk-" -- "*.js" "*.ts" "*.cjs" | head -50
```

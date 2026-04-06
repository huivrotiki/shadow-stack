---
description: Deploy ops — Vercel, backup, secrets management
---

# Deploy Ops — Vercel & Backup

## Vercel

⚠️ **НЕ деплоить на Vercel из этого репо** — Vercel-проект принадлежит другому проекту (cyberbabyangel).

Health Dashboard работает только локально на :5176.

### Если нужно задеплоить другой проект

```bash
# Build first
npm run build

# Deploy (только если явно запрошено)
npx vercel deploy --prod
```

## GDrive Sync

Синхронизация `.md` файлов и базы знаний на Google Drive:

```bash
# По команде /sync или раз в час
./scripts/shadow-gdrive-sync.sh
```

Sync targets:
- `CLAUDE.md`, `AGENTS.md`, `SESSION.md`, `handoff.md`
- `docs/` directory
- `knowledge/` directory

## Secrets Management

**ПРАВИЛО**: Всегда используй `doppler run --` для доступа к ключам.

```bash
# ✅ ПРАВИЛЬНО
doppler run --project serpent --config dev -- node server/index.js

# ❌ НЕПРАВИЛЬНО
source .env && node server/index.js
```

**НИКОГДА**:
- Хардкодить токены в `.ts/.js/.json` файлах
- Коммитить `.env` файлы
- Логировать API ключи
- Показывать значения ключей в output

### Проверка .env

```bash
# Показать только наличие ключей (НЕ значения)
grep -E "^(GROQ|MISTRAL|OPENROUTER|ANTHROPIC|OPENAI)_API_KEY" .env | sed 's/=.*/=✅ SET/'
```

## Available API Keys

| Key | Status | Usage |
|-----|--------|-------|
| GROQ_API_KEY | ✅ SET | Groq API (llama-3.3-70b) |
| MISTRAL_API_KEY | ✅ SET | Mistral AI (mistral-small) |
| OPENROUTER_API_KEY | ✅ SET | OpenRouter free models |
| ANTHROPIC_API_KEY | ✅ SET | ⚠️ Credits exhausted |
| TELEGRAM_BOT_TOKEN | ✅ SET | Telegram bot |

## CI/CD

GitHub Actions workflows:
- `.github/workflows/bot-check.yml` — Telegram bot tests
- `.github/workflows/ci.yml` — main CI
- `.github/workflows/deploy-dashboard.yml` — Health Dashboard deploy

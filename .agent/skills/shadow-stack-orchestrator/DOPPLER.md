# DOPPLER Skill — Secrets Management

## Golden Rule
ВСЕГДА используй Doppler для секретов:
```
doppler run --project serpent --config dev -- <command>
```

## Required Secrets (26 total)

### AI Providers
- GOOGLE_GENERATIVE_AI_API_KEY
- OPENAI_API_KEY
- ANTHROPIC_API_KEY
- GROQ_API_KEY
- OPENROUTER_API_KEY

### Infrastructure
- SUPABASE_URL
- SUPABASE_ANON_KEY (publishable!)
- SUPABASE_SERVICE_KEY
- TELEGRAM_BOT_TOKEN
- CRON_SECRET
- WORKER_URL

## Never
- ❌ Хардкод ключей в .ts/.js/.json
- ❌ .env в git
- ❌oken в логах

## Check Current Secrets
```bash
doppler secrets list --project serpent --config dev
```

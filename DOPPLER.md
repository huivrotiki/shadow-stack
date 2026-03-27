# Doppler — Secrets для Shadow Stack v3.1.2

Единый источник правды для всех токенов (GitHub, Telegram, LLM, Vercel).

## 1. Установка и логин

```bash
npm i -g @dopplerhq/cli
doppler login
```

## 2. Проект и окружения

```bash
doppler projects create shadow-stack

doppler environments create dev --project shadow-stack
doppler environments create staging --project shadow-stack
doppler environments create prod --project shadow-stack
```

## 3. Секреты (dev)

Переносим значения из `SECRETS.md` (без самих значений в git).

```bash
doppler secrets set GITHUB_TOKEN=...                   --project shadow-stack --config dev
doppler secrets set GITHUB_REPO_OWNER=serpentme        --project shadow-stack --config dev
doppler secrets set GITHUB_REPO_NAME=shadow-stack-widget --project shadow-stack --config dev

doppler secrets set TELEGRAM_BOT_TOKEN=...             --project shadow-stack --config dev
doppler secrets set TELEGRAM_SECRET=...                --project shadow-stack --config dev

doppler secrets set OPENAI_API_KEY=...                 --project shadow-stack --config dev
doppler secrets set ANTHROPIC_API_KEY=...              --project shadow-stack --config dev
doppler secrets set GROQ_API_KEY=...                   --project shadow-stack --config dev
# и другие ключи по мере необходимости
```

Аналогично заводятся `staging` и `prod` с другими значениями.

## 4. Локальный dev

В `shadow-stack-widget`:

```bash
cd /workspaces/shadow-stack-widget

doppler setup --project shadow-stack --config dev

# Next dev
doppler run -- npm run dev

# Express GitOps API (если используешь отдельный сервер)
doppler run -- npm run api
```

Все переменные окружения (`GITHUB_*`, `TELEGRAM_*`, LLM‑ключи и т.д.) подтягиваются из Doppler.

## 5. CI/CD (GitHub Actions → Vercel)

1. В Doppler → проект `shadow-stack` → config `prod` → создать **Service Token**.
2. В GitHub (репозиторий `shadow-stack-widget`) создать secret:

```text
DOPPLER_TOKEN = <service_token>
```

3. Пример workflow для деплоя:

```yaml
name: Deploy Shadow Stack Widget

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN }}

    steps:
      - uses: actions/checkout@v4

      - name: Install Doppler CLI
        run: curl -Ls https://cli.doppler.com/install.sh | sh

      - name: Deploy with Vercel using Doppler env
        run: doppler run -- vercel deploy --prod
        env:
          DOPPLER_PROJECT: shadow-stack
          DOPPLER_CONFIG: prod
```

## 6. Supabase

Проект: `shadow-stack-prod` (ref: `dfajrknplwezzjrqdchu`)

```bash
# Supabase secrets в Doppler
doppler secrets set SUPABASE_URL="https://dfajrknplwezzjrqdchu.supabase.co" --project serpent --config dev
doppler secrets set SUPABASE_ANON_KEY="eyJ..." --project serpent --config dev
```

**ANON_KEY** — взять из Supabase Dashboard:
`https://supabase.com/dashboard/project/dfajrknplwezzjrqdchu/settings/api`

## 7. TL;DR

- Все секреты храним в Doppler (`serpent` / `dev|staging|prod`).
- Локально запускаем через `doppler run`.
- В CI используем `DOPPLER_TOKEN` + `doppler run` вокруг `vercel deploy` или других команд.

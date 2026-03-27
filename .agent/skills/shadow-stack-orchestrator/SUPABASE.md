# SUPABASE Skill — Database Operations

## Connection
- Project: shadow-stack-prod
- ID: dfajrknplwezzjrqdchu
- Region: eu-central-1
- URL: https://dfajrknplwezzjrqdchu.supabase.co

## Setup via Doppler

```bash
# 1. Set URL (already done)
doppler secrets set SUPABASE_URL="https://dfajrknplwezzjrqdchu.supabase.co" \
  --project serpent --config dev

# 2. Set ANON_KEY (get from Dashboard)
# Dashboard → Settings → API → anon public key
doppler secrets set SUPABASE_ANON_KEY="eyJ..." \
  --project serpent --config dev

# 3. Disable RLS (run in Dashboard SQL Editor)
ALTER TABLE public.logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.router_logs DISABLE ROW LEVEL SECURITY;
```

## Tables

### public.logs

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| tier | text | Provider name |
| model | text | Model used |
| latency | int | Response time (ms) |
| prompt | text | Question (200 chars) |
| status | text | ok/error |
| error | text | Error message |
| agent_id | text | orchestrator/engineer/architect |
| project | text | shadow-stack |
| cached | boolean | From cache? |
| timestamp | timestamptz | Event time |

### public.router_logs (alternative)

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| route | text | Provider name |
| model | text | Model used |
| latency_ms | int | Response time |
| message_preview | text | Question |
| status | text | ok/error |
| user_id | text | User ID |

## Fallback

Если Supabase не работает → логи пишутся в `data/local-logs.json`

```javascript
// server/lib/supabase-with-fallback.js
// Try 'logs' table first, then 'router_logs', then local file
```

## Common Queries

```sql
-- Последние 10 запросов
SELECT * FROM logs ORDER BY timestamp DESC LIMIT 10;

-- Статистика по провайдерам
SELECT tier, COUNT(*), AVG(latency) 
FROM logs GROUP BY tier;

-- Ошибки
SELECT * FROM logs WHERE status = 'error';
```

## MCP Operations
- execute_sql(query)
- list_tables()
- apply_migration(name, sql)

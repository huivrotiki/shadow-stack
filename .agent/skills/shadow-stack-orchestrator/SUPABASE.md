# SUPABASE Skill — Database Operations

## Connection
- Project: shadow-stack-prod
- ID: dfajrknplwezzjrqdchu
- Region: eu-central-1
- URL: https://dfajrknplwezzjrqdchu.supabase.co

## Table: public.logs

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
| session_id | uuid | Session ID |
| project | text | shadow-stack |
| cached | boolean | From cache? |
| timestamp | timestamptz | Event time |

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

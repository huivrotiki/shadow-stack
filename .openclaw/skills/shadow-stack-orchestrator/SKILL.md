# Shadow Stack Orchestrator

> The brain of the multi-agent system. Decides which provider handles each request.

## Provider Selection Algorithm

```
1. Parse query intent
2. Check provider health (circuit breaker state)
3. Match intent to provider specialty
4. Route request
5. If failure → fallback to next provider
6. Log decision + outcome
```

## Intent → Provider Mapping

| Intent | Keywords | Provider | Model |
|--------|----------|----------|-------|
| General chat | _(default)_ | ollama | llama3.2 |
| Code generation | code, function, class, debug, fix | cloud (Groq) | llama-3.1-8b-instant |
| Web scraping | url, http, browse, extract, scrape | browser | chromium |
| Long analysis | analyze, compare, summarize | cloud (OpenRouter) | gpt-4o-mini |

## Specialization Table

| Agent | Handles | Trigger |
|-------|---------|---------|
| orchestrator | routing, decisions, coordination | default |
| coder | providers, server, Playwright | *.js, server/** |
| telegram_dev | bot commands, dashboards | bot/** |
| reviewer | code review, memory leaks, security | *.test.js |
| deployer | scripts, smoke tests, env setup | scripts/* |

## Monitoring Commands

```bash
# Check provider health
curl http://localhost:3000/api/health

# View metrics
curl http://localhost:3000/api/metrics

# Check logs
tail -f data/logs/app.jsonl | jq .
```

## Decision Log Format

Each routing decision is logged as:
```json
{
  "ts": "2026-03-27T10:00:00Z",
  "query": "write a function to sort array",
  "intent": "code",
  "provider": "cloud",
  "model": "llama-3.1-8b-instant",
  "latency_ms": 1234,
  "tokens": 150,
  "success": true
}
```

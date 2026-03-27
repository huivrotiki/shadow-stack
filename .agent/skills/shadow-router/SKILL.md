# Shadow Router — Skill

> Provider selection, fallback, RAM guard, circuit breaker patterns.

## Provider Interface

All providers implement:

```js
{
  name: string,
  generate(prompt: string, options?: object): Promise<{ text, model, tokens, error? }>
}
```

## Provider Priority

| Provider | Trigger | Model | Timeout |
|----------|---------|-------|---------|
| ollama | default, short queries | llama3.2 | 30s |
| cloud | code, long queries | llama-3.1-8b-instant (Groq) | 15s |
| browser | URL extraction | chromium | 60s |

## Fallback Chain

```
ollama → cloud → browser → error
```

If primary fails (timeout, ECONNREFUSED, circuit open), try next in chain.

## RAM Guard

- Check `process.memoryUsage().rss` every 10s
- Threshold: 512MB (configurable via `RAM_THRESHOLD_MB`)
- Action: log warning, reject new requests with 503

## Circuit Breaker

- States: `CLOSED` → `OPEN` → `HALF_OPEN` → `CLOSED`
- Failure threshold: 5 consecutive failures
- Reset timeout: 30s
- Half-open: allow 1 test request

## CDP (Chrome DevTools Protocol)

For browser provider:
- Launch: `chromium.launch({ headless: true })`
- Navigate: `page.goto(url, { waitUntil: 'domcontentloaded' })`
- Extract: `page.content()` or `page.$eval(selector, el => el.textContent)`
- **Always** call `page.close()` in finally block
- Screenshot on failure: `page.screenshot({ path: 'data/screenshots/error.png' })`

## Code Patterns

```js
// Provider call with fallback
const providers = [ollama, cloud, browser];
for (const provider of providers) {
  try {
    const result = await withTimeout(provider.generate(prompt), timeout);
    if (!result.error) return result;
  } catch (e) {
    logger.warn(`Provider ${provider.name} failed: ${e.message}`);
  }
}
throw new Error('All providers failed');
```

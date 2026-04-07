# Системный контекст: Vercel AI Gateway + AI SDK

## Что это такое

1. **Vercel AI Gateway** (https://ai-gateway.vercel.sh) — единый прокси для 100+ моделей без наценки на токены.
2. **AI SDK** (`ai` от Vercel) — TypeScript/JS SDK для вызовов, стриминга, тулов, агентов.
3. **models.dev** — справочник моделей с ценами и контекстным окном.

---

## Настройка ключа

Ключ — это **Vercel Personal Access Token** (не project token `vcp_`, не OIDC `vck_`).
Создать: https://vercel.com/account/settings/tokens → тип "Full Account"

```
AI_GATEWAY_API_KEY=ваш_токен
```

> В этом проекте ключ хранится в Doppler: `doppler secrets set AI_GATEWAY_API_KEY=... --project serpent --config dev`

---

## AI SDK — установка

```bash
npm install ai
```

---

## Примеры использования

### generateText
```typescript
import { generateText } from 'ai';
const { text } = await generateText({
  model: 'anthropic/claude-sonnet-4-0',
  prompt: 'Объясни квантовую запутанность.',
});
```

### streamText
```typescript
import { streamText } from 'ai';
const result = streamText({ model: 'openai/gpt-4.1', prompt: '...' });
for await (const chunk of result.textStream) process.stdout.write(chunk);
```

### generateObject (структурированный вывод)
```typescript
import { generateObject } from 'ai';
import { z } from 'zod';
const { object } = await generateObject({
  model: 'anthropic/claude-sonnet-4-0',
  schema: z.object({ title: z.string(), summary: z.string(), tags: z.array(z.string()) }),
  prompt: 'Опиши концепцию RAG.',
});
```

### Tools / function calling
```typescript
import { generateText, tool } from 'ai';
import { z } from 'zod';
const { text } = await generateText({
  model: 'openai/gpt-4.1',
  tools: {
    getWeather: tool({
      description: 'Погода в городе',
      parameters: z.object({ city: z.string() }),
      execute: async ({ city }) => ({ temp: 22, city }),
    }),
  },
  prompt: 'Погода в Берлине?',
});
```

---

## Прямой вызов (OpenAI-совместимый)

```python
from openai import OpenAI
client = OpenAI(api_key="AI_GATEWAY_API_KEY", base_url="https://ai-gateway.vercel.sh/v1")
response = client.chat.completions.create(
  model="anthropic/claude-sonnet-4-0",
  messages=[{"role": "user", "content": "Привет!"}]
)
```

```bash
curl -X POST "https://ai-gateway.vercel.sh/v1/chat/completions" \
  -H "Authorization: Bearer $AI_GATEWAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "openai/gpt-4.1", "messages": [{"role": "user", "content": "Привет!"}]}'
```

---

## Модели (актуальный список: https://models.dev)

| Model ID | Цена вход/выход (1M токенов) |
|---|---|
| `anthropic/claude-sonnet-4-0` | $3 / $15 |
| `openai/gpt-4.1` | $2 / $8 |
| `openai/gpt-4.1-mini` | $0.40 / $1.60 |
| `google/gemini-2.5-flash` | дешёвый и быстрый |
| `xai/grok-4.1-fast-non-reasoning` | через Gateway |

В `free-models-proxy.cjs` эти модели доступны как `vg-sonnet`, `vg-gpt41`, `vg-gpt4o-mini`, `vg-gemini-flash`, `vg-grok`.

---

## Мониторинг

https://vercel.com/oleksii-barsuk-s-projects/~/ai-gateway — расходы, логи, fallback-маршрутизация.

---

## Статус в этом проекте

| Ключ | Статус |
|---|---|
| `vcp_` (project token) | ❌ OIDC only — не работает напрямую |
| `vck_` (CI token) | ❌ OIDC only |
| Personal Access Token | ✅ нужен — создать на vercel.com/account/settings/tokens |

**TODO:** Создать Personal Access Token на vercel.com/account/settings/tokens и сохранить как `AI_GATEWAY_API_KEY` в Doppler.

---

## Правила при написании кода

1. Используй AI SDK (`ai`) для TS/JS вызовов.
2. Модели выбирай через `models.dev`.
3. Ключ только в `.env` / Doppler как `AI_GATEWAY_API_KEY`.
4. Для агентов — `generateText` с `tools`.
5. Проверяй fallback-провайдеры в Gateway settings для продакшна.

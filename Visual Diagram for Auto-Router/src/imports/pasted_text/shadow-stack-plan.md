<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# впиши ето сюда 🗺️ Shadow Stack v3.2 — Детальный Мастер-План

Вот обновлённый мастер-план со всеми шагами из предыдущих сообщений.[^1][^2][^3]

***

# 🗺️ Shadow Stack v3.2 — Детальный Мастер-План

## Архитектурные слои

| Слой | Компоненты | Роль |
| :-- | :-- | :-- |
| **Control Plane** | Telegram, ZeroClaw, owpenbot | Команды, аппрув, мониторинг |
| **Execution Plane** | Antigravity, OpenCode, Vercel CLI | Кодинг, тесты, деплой |
| **Intelligence Plane** | Ollama, NadirClaw, Claude, OpenRouter | Роутинг, локальный + облачный инференс |
| **Browser Plane** | Playwright MCP, n8n, Puppeteer | Обход платных API через браузер |

[^1]

***

## 🧠 Системный промт для Claude (скопировать целиком)

```
Ты архитектор Shadow Stack v3.2 на Mac M1 8ГБ.
Репо: github.com/huivrotiki/shadow-stack-widget-1
Go-live: 2026-04-05. Priority: CRITICAL.

ТВОЯ РОЛЬ:
- Собрать авто-роутер без Docker
- Написать весь код за одну сессию
- Трекать задачи в todo.md

MCP СЕРВЕРЫ (подключи все):
- filesystem: читай/пиши ~/shadow-stack-widget
- github: PR, issues, commits
- vercel: preview deploy после каждой фичи
- supabase: логи задач, статусы фаз
- macos-automator: AppleScript/Shell

СКИЛЫ (вызывать по порядку):
1. SKILL: shadow-stack-orchestrator → RALPH Loop
2. SKILL: auto-router → routing rules
3. SKILL: telegram-webhook → owpenbot handlers
4. SKILL: vercel-deploy → zero-code pipeline
5. SKILL: observability → SSE logs + retry

ОГРАНИЧЕНИЯ:
- Без Docker (M1 8ГБ)
- Free-first: Ollama → OpenRouter → браузер → платный по запросу
- ESM only, Node 22, Zod, Winston
```


***

## 🔧 Шаг 1: Установка базового ПО

```bash
# Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Rust (для ZeroClaw)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Основные инструменты
brew install ollama jq ngrok node
npm install -g bun vercel

# ZeroClaw
cargo install zeroclaw

# n8n (браузерный роутер)
npm install -g n8n

# LiteLLM (прокси для OpenCode)
pip install litellm nadirclaw

# MCP для macOS автоматизации
npm install -g @steipete/macos-automator-mcp
```


***

## 🤖 Шаг 2: Ollama + модели

```bash
ollama serve &

# Модели под 8ГБ RAM
ollama pull qwen2.5-coder:3b   # ~2.0 ГБ — код
ollama pull qwen2.5:7b         # ~4.7 ГБ — анализ/чат
ollama pull phi3.5:mini        # ~2.2 ГБ — быстрый резерв

# Проверка
curl http://localhost:11434/api/generate \
  -d '{"model":"qwen2.5-coder:3b","prompt":"hello"}'
```

**Правило:** никогда не грузить 14B+ — уйдёт в своп и заморозит Mac.[^1]

***

## 🦀 Шаг 3: ZeroClaw + Telegram

```bash
# Onboard мастер
zeroclaw onboard channels-only
```

В мастере:

1. Выбрать `telegram` → Enter
2. Вставить `BOT_TOKEN` из `@BotFather` → `/newbot`
3. Вставить Telegram ID (узнать у `@userinfobot`)
4. Конфиг сохранится в `~/.zeroclaw/config.toml`

[^2][^4]

***

## ⚙️ Шаг 4: `~/.zeroclaw/config.toml`

```toml
# === ПРОВАЙДЕРЫ ===

[provider.local]               # БЕСПЛАТНО: Ollama (код, short)
type = "ollama"
base_url = "http://localhost:11434"
model = "qwen2.5-coder:3b"

[provider.smart]               # БЕСПЛАТНО: Ollama (анализ, long)
type = "ollama"
base_url = "http://localhost:11434"
model = "qwen2.5:7b"

[provider.cloud_free]          # БЕСПЛАТНО: OpenRouter free tier
type = "openai_compatible"
base_url = "https://openrouter.ai/api/v1"
api_key = "sk-or-..."
model = "qwen/qwen3-235b:free"

[provider.browser]             # БЕСПЛАТНО: браузер → Gemini/Claude
type = "http"
endpoint = "http://localhost:5678/webhook/llm"

[provider.claude_paid]         # ПЛАТНО: только по /premium
type = "anthropic"
api_key = "sk-ant-..."
model = "claude-3-5-sonnet-20241022"

# === TELEGRAM КАНАЛ ===

[channel.telegram]
type = "telegram"
bot_token = "YOUR_BOT_TOKEN"
allow_from = ["@your_username"]

# === АГЕНТЫ ===

[agent.router]
provider = "local"
system_prompt = """
Ты классификатор. Отвечай ОДНИМ словом:
local / smart / code / browser / deploy / premium
"""

[agent.default]
provider = "local"
system_prompt = """
Ты Shadow Stack ассистент на Mac M1.
Помогай с кодом, деплоем, автоматизацией.
"""
```


***

## 🔀 Шаг 5: Авто-роутер `auto-router.ts`

```typescript
import { generateText } from "ai"
import { createOllama } from "ollama-ai-provider"

const ollama = createOllama({ baseURL: "http://localhost:11434/api" })
type Route = "local" | "smart" | "code" | "browser" | "deploy" | "premium"

export async function classifyRequest(text: string): Promise<Route> {
  if (text.startsWith("/deploy"))  return "deploy"
  if (text.startsWith("/premium")) return "premium"
  if (text.startsWith("/code"))    return "code"
  if (text.length < 80)            return "local"

  const { text: decision } = await generateText({
    model: ollama("qwen2.5-coder:3b"),
    prompt: `Classify in one word (local/smart/code/browser/deploy):\n"${text}"`,
    maxTokens: 5,
  })
  return (decision.trim().toLowerCase() as Route) || "local"
}

export async function routeRequest(msg: string): Promise<string> {
  const route = await classifyRequest(msg)
  switch (route) {
    case "local":   return callOllama("qwen2.5-coder:3b", msg)
    case "smart":   return callOllama("qwen2.5:7b", msg)
    case "code":    return callOllama("qwen2.5-coder:3b", msg)
    case "browser": return callN8nBrowser(msg)
    case "deploy":  return runVercelDeploy()
    case "premium": return callClaudeAPI(msg)
    default:        return callOllama("qwen2.5-coder:3b", msg)
  }
}

// --- Хелперы ---
async function callOllama(model: string, prompt: string) {
  const { text } = await generateText({ model: ollama(model), prompt })
  return text
}

async function callN8nBrowser(prompt: string) {
  const res = await fetch("http://localhost:5678/webhook/llm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  })
  return (await res.json()).response
}

async function runVercelDeploy() {
  const { execSync } = await import("child_process")
  return "✅ " + execSync("vercel deploy --prod", {
    cwd: process.env.HOME + "/shadow-stack-widget", encoding: "utf8"
  })
}

async function callClaudeAPI(prompt: string) {
  const { generateText: gen } = await import("ai")
  const { anthropic } = await import("@ai-sdk/anthropic")
  const { text } = await gen({ model: anthropic("claude-3-5-sonnet-20241022"), prompt })
  return text
}
```


***

## 📡 Шаг 6: Telegram Webhook `route.ts`

```typescript
// app/api/telegram-webhook/route.ts
import { routeRequest } from "@/server/router/auto-router"

export async function POST(req: Request) {
  const body = await req.json()
  const message = body?.message
  if (!message) return new Response("ok")

  const chatId = message.chat.id
  const text = message.text || ""

  const reply = await routeRequest(text)

  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: reply }),
  })

  return new Response("ok")
}
```


***

## 🌐 Шаг 7: n8n — браузерный узел

```bash
n8n start &  # localhost:5678
```

Workflow в n8n:[^5][^6]

```
[Webhook POST /webhook/llm]
        ↓
[Code: извлечь prompt]
        ↓
[Playwright/Puppeteer:
  → открыть gemini.google.com (залогинен)
  → вставить prompt
  → дождаться ответа DOM
  → взять текст]
        ↓
[Respond: {"response": "..."}]
```


***

## 🍎 Шаг 8: Automator + Shortcuts

**Automator pipeline (`shadow-deploy.workflow`):**[^7]

```
[Shell: git pull + npm build]
        ↓
[AppleScript: vercel deploy]
        ↓
[Shell: jq → /tmp/shadow-status.json]
        ↓
[Shell: Telegram notify]
```

**Apple Shortcut "Shadow Start":**

- Shortcuts → Новый → Run Shell Script → `bash ~/shadow-start.sh`
- Перетащить на Dock

***

## 🚀 Шаг 9: Мастер-скрипт `shadow-start.sh`

```bash
#!/bin/bash
echo "🚀 Shadow Stack v3.2 starting..."

ollama serve &
sleep 2

litellm --model ollama/qwen2.5-coder:3b --port 4000 &
n8n start &
sleep 3

cd ~/shadow-stack-widget && npm run dev &
sleep 2

NGROK_URL=$(ngrok http 3000 --log=stdout &
  sleep 4
  curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[^0].public_url')

curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${NGROK_URL}/api/telegram-webhook"

zeroclaw gateway start &

echo "✅ Стек запущен!"
echo "🌐 $NGROK_URL"
echo "🤖 Пиши в Telegram"
```

```bash
chmod +x ~/shadow-start.sh
~/shadow-start.sh
```


***

## 📋 Phase 1→5 Трекинг задач

### Phase 1: Авто-роутер + Telegram (~3ч)

```
☐ 1.1 server/router/auto-router.ts (State Machine)
☐ 1.2 SKILL.md — routing_rules
☐ 1.3 app/api/telegram-webhook/route.ts
☐ 1.4 scripts/secrets-scanner.sh
☐ 1.5 ngrok + setWebhook
☐ 1.6 commit: "feat: Shadow Auto-Router v1.0"
```


### Phase 2: CI/CD + macOS (~2ч)

```
☐ 2.1 .github/workflows/deploy.yml
☐ 2.2 Doppler → Vercel secrets
☐ 2.3 shadow-start.sh финальный
☐ 2.4 Automator shadow-deploy.workflow
☐ 2.5 Apple Shortcut "Shadow Start" → Dock
☐ 2.6 macos-automator-mcp → ZeroClaw
```


### Phase 3: OpenCode плагины (~1ч)

```
☐ 3.1 oh-my-opencode
☐ 3.2 opencode-vibeguard (скрытие секретов)
☐ 3.3 opencode-pty (интерактивный shell)
☐ 3.4 opencode-dynamic-context-pruning
☐ 3.5 opencode-supermemory
☐ 3.6 opencode-scheduler (launchd)
```


### Phase 4: Observability (~2ч)

```
☐ 4.1 SSE endpoint /api/logs/stream
☐ 4.2 Retry (exponential backoff × 3)
☐ 4.3 try/on error в каждом AppleScript
☐ 4.4 /tmp/shadow-status.json → Telegram
☐ 4.5 Supabase логи задач
```


### Phase 5: Docs + Lock-in (~1ч)

```
☐ 5.1 RUNBOOK.md
☐ 5.2 AGENTS.md
☐ 5.3 SKILL.md финал
☐ 5.4 todo.md трекинг
☐ 5.5 Extensibility test
☐ 5.6 Vercel final deploy → production
```


***

## ⚠️ Риски и фиксы

| Риск | Фикс |
| :-- | :-- |
| Antigravity OAuth → бан Gmail | Только прямые API-ключи или браузер-автоматизация [^8][^9] |
| M1 8ГБ → SWAP при 14B | Только 3B/7B, лимит контекста 8192 [^1] |
| ngrok нестабилен | Cloudflare Tunnel (`cloudflared tunnel`) |
| Telegram SIP `/home/node` | Редиректить в `~/.zeroclaw/telegram/` [^10] |
| Pipeline рвётся | `return input` в каждом AppleScript блоке [^11] |
| Один файл роняет workflow | `try/on error` + retry 3× [^12] |


***

## 📊 RAM на M1 8ГБ

| Процесс | RAM |
| :-- | :-- |
| ZeroClaw gateway | ~5 МБ |
| Ollama + Qwen3B | ~2.0 ГБ |
| n8n | ~150 МБ |
| Next.js owpenbot | ~200 МБ |
| macOS + Safari | ~2.5 ГБ |
| **Итого** | **~5 ГБ ✅** |

[^13][^1]

***

## 🔀 Схема авто-роутера

```
Запрос → ZeroClaw → Классификатор (Qwen3B, 10ms)
             ↓
  < 80 символов / простой → Ollama qwen3B   (0$, локально)
  анализ / длинный        → Ollama qwen7B   (0$, локально)
  лимит / очень сложный   → n8n → браузер   (0$, Gemini/Claude.ai)
  OpenRouter              → Qwen/DeepSeek   (0$, cloud free)
  /deploy                 → Vercel CLI      (автоматически)
  /premium                → Claude Sonnet   (платно, по запросу)
             ↓
  429/5xx → fallback cascade автоматически
```

<span style="display:none">[^14][^15]</span>

<div align="center">⁂</div>

[^1]: Avtonomnaia-II-razrabotka-na-Mac-M1.md

[^2]: https://zeroclaw.net/blog/connect-telegram-zeroclaw-bot

[^3]: https://lib.rs/crates/zeroclaw

[^4]: https://github.com/zeroclaw-labs/zeroclaw/blob/master/docs/channels-reference.md

[^5]: https://claudefa.st/blog/tools/mcp-extensions/browser-automation

[^6]: https://n8n.io/workflows/2743-automate-telegram-chat-responses-using-google-gemini/

[^7]: https://support.apple.com/en-kz/guide/automator/aut4bb6b2b4f/2.10/mac/15.0

[^8]: Avtomatizatsiia-Zarabotka-s-Instrumentami-Claw.md

[^9]: https://www.theregister.com/2026/02/23/google_antigravity_compute_burden/

[^10]: https://forum.cloudron.io/topic/15080/zeroclaw-rust-based-alternative-to-openclaw-picoclaw-nanobot-agentzero

[^11]: https://stackoverflow.com/questions/35909472/automator-flow-halting-and-failing-to-pass-input-to-next-step

[^12]: https://stackoverflow.com/questions/18017535/how-to-handle-automator-errors-with-applescript

[^13]: https://www.youtube.com/watch?v=I0r7HaLDSS8

[^14]: https://macblog.org/parse-json-command-line-mac/

[^15]: https://github.com/steipete/macos-automator-mcp


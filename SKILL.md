# Shadow Stack Widget — SKILL.md

> Electron + React + Vite виджет для автоматизации macOS/M1 окружения.

## Быстрый старт

```bash
cd ~/shadow-stack-widget

# GUI режим (виджет)
npm run start

# Headless режим (CLI)
npm run headless -- --step=0
npm run headless -- --all
npm run headless -- --all --debug
```

---

## Режимы работы

### 🖥️ GUI Mode

```bash
npm run start
```

- Electron окно-виджет
- Интерактивный Autopilot
- Логи в реальном времени
- Ollama status indicator

### 💻 Headless Mode

```bash
npm run headless -- [опции]
```

| Опция      | Описание           |
| ---------- | ------------------ |
| `--step=N` | Выполнить шаг N    |
| `--all`    | Выполнить все шаги |
| `--debug`  | Debug логи         |
| `-d`       | То же что --debug  |

**Примеры:**

```bash
npm run headless -- --step=0        # System audit
npm run headless -- --step=1         # Homebrew/Node
npm run headless -- --all            # Все шаги
npm run headless -- --all --debug    # С debug логами
```

---

## Shadow Steps (0-7)

| ID  | Название               | Описание                                 |
| --- | ---------------------- | ---------------------------------------- |
| 0   | Разведка и аудит       | Системный аудит: чип, память, диск, софт |
| 1   | Homebrew, Node, Python | Установка node@22, python@3.12           |
| 2   | Ollama + модели        | llama3.2, phi3, mistral, qwen2.5         |
| 3   | OpenClaw Agent         | opencode-ai CLI                          |
| 4   | NeMo Agent Toolkit     | nemotoolkit                              |
| 5   | OpenCode SDK           | @opencode-ai/sdk                         |
| 6   | Vercel AI SDK v4+      | ai + @ai-sdk/openai                      |
| 7   | Playwright MCP         | @playwright/mcp                          |

---

## Debug логи

### Включить:

```bash
npm run headless -- --all --debug
```

### Лог-файл:

```bash
tail -f /tmp/shadow-widget.log
```

### Custom log path:

```bash
SHADOW_LOG=/path/to/log npm run headless -- --all
```

### Что логируется:

- Startup + args
- IPC вызовы (execute-bash, set-always-on-top)
- Comet/Ollama запросы
- Ошибки и fallback-и

---

## Environment Variables

```bash
VITE_DEV_SERVER_URL=http://127.0.0.1:5175
COMET_ENDPOINT=http://localhost:8080/api/fix
COMET_API_KEY=your-key
SHADOW_LOG=/tmp/shadow-widget.log
```

---

## IPC API (preload.cjs)

```javascript
window.electronAPI.runCommand(cmd); // Bash команда
window.electronAPI.setAlwaysOnTop(flag); // Пин окна
window.electronAPI.setFullscreen(flag); // Полноэкранный
window.electronAPI.sendErrorToComet(payload); // Ошибка → Ollama
window.electronAPI.getPlatform(); // Platform info
```

---

## Ollama Integration

### Port: 11434

### Models: llama3.2, phi3, mistral, qwen2.5:3b, llava

### Check status:

```bash
ollama list
curl http://localhost:11434/api/tags
```

### Restart:

```bash
brew services restart ollama
```

---

## Troubleshooting

### Electron SIGTERM

```bash
npm run kill-port && npm run start
```

### Port 5175 занят

```bash
npm run kill-port
```

### Ollama не отвечает

```bash
brew services restart ollama
ollama pull llama3.2
```

### Debug mode

```bash
npm run headless -- --step=0 --debug
tail -f /tmp/shadow-widget.log
```

---

## Файлы проекта

```
~/shadow-stack-widget/
├── main.cjs           # Electron main + headless
├── preload.cjs        # IPC bridge
├── vite.config.js     # Port 5175
├── postcss.config.js  # Tailwind v4
├── package.json       # "main": "main.cjs"
├── AGENTS.md          # OpenCode rules (8 фаз)
├── SKILL.md           # This file
└── src/
    ├── App.jsx        # React widget
    ├── index.css
    └── main.jsx
```

---

## Stack

- Electron 41 + Node 22
- Vite 8 + React 19 + Tailwind CSS v4
- Ollama (local LLM)
- OpenCode AI CLI

---

## Auto-Router v1.0

### Routing Rules

```yaml
routing_rules:
  command_routes:
    /deploy:   { route: vercel-deploy, provider: vercel, model: vercel-cli }
    /premium:  { route: claude-premium, provider: anthropic, model: claude-sonnet-4 }
    /deep:     { route: perplexity, provider: perplexity, model: sonar }
    /grok:     { route: grok, provider: xai, model: grok-2 }
    /kimi:     { route: kimi, provider: moonshot, model: moonshot-v1-8k }

  text_routes:
    short: { condition: "text.length < 80", route: ollama-short, model: qwen2.5-coder:3b }
    long:  { condition: "text.length >= 80", route: ollama-analysis, model: qwen2.5:7b }

  default: { route: openrouter-free, model: qwen/qwen-2.5-coder-32b-instruct }
```

### Providers Priority

```yaml
providers_priority:
  1_local_free:    [ ollama ]           # $0, fastest, RAM only
  2_proxy_free:    [ antigravity ]      # $0, Gemini via OpenCode proxy
  3_cloud_free:    [ openrouter ]       # $0, API key required
  4_subscription:  [ perplexity ]       # monthly sub
  5_api_key:       [ kimi ]             # API key, per-token
  6_paid:          [ anthropic, openai ] # per-token, /premium only
```

### Fallback Chain

```yaml
fallback_chain:
  on_error: [ 429, 5xx, timeout ]
  retry: { max: 3, backoff: exponential, delays: [1s, 2s, 4s] }
  cascade:
    - ollama qwen2.5-coder:3b          # 1. try local first
    - antigravity gemini-2.0-flash      # 2. Gemini via OpenCode proxy ($0)
    - openrouter qwen-2.5-32b          # 3. free cloud tier
    - kimi moonshot-v1-8k              # 4. API key provider
    - claude claude-sonnet-4            # 5. paid, last resort
  quota_threshold: 90%                  # switch to next when 90% quota used
```

### Usage Monitoring

```yaml
usage_tracking:
  storage: in-memory (resets hourly)
  limits:
    ollama: unlimited
    antigravity: 50/hr
    openrouter: 100/hr
    perplexity: 30/hr
    kimi: 50/hr
    claude: 20/hr
  endpoints:
    GET /api/auto-router/usage    # JSON quota stats
    /usage (Telegram)             # visual bars
```

### State Machine

```
IDLE → ROUTING → EXECUTING → DONE
                      ↓
                    ERROR → Fallback Cascade → DONE | ERROR
```

### Telegram Commands

| Command       | Action                           | Cost |
|--------------|----------------------------------|------|
| /help        | Show command list                | $0   |
| /status      | Query Ralph Loop orchestrator    | $0   |
| /deploy      | Vercel production deploy         | $0   |
| /premium     | Claude Sonnet API                | $$   |
| /deep        | Perplexity search                | sub  |
| /grok        | Grok AI                          | sub  |
| /kimi        | Kimi (Moonshot)                  | key  |
| /reset       | Reset session                    | $0   |
| /test-router | Test routing (shows route info)  | $0*  |
| /usage       | Provider quota stats (visual)    | $0   |
| (text)       | Auto-route by length             | $0   |

*\* /test-router still calls the LLM, but shows routing metadata*

### API Endpoints

```bash
# Auto-Router (Express, port 3001)
curl -X POST http://localhost:3001/api/auto-router \
  -H 'Content-Type: application/json' \
  -d '{"text": "hello"}'

# Telegram Webhook (Next.js)
# Set via: https://api.telegram.org/bot$TOKEN/setWebhook?url=$VERCEL_URL/api/telegram-webhook
```

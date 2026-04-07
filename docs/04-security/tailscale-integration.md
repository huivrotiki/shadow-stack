# 🌐 TAILSCALE + SHADOW STACK + OPENCODE
## Нулевые публичные порты — всё внутри приватной сети

## АРХИТЕКТУРА С TAILSCALE

```
┌─────────────────────┐         ┌──────────────────────────────┐
│   Твой MacBook M1   │         │   VPS (Ubuntu 24.04)         │
│                     │         │                              │
│  Telegram App       │         │  OpenCode Agent              │
│  Browser Dashboard  │◄──────► │  ChromaDB                    │
│  Terminal           │WireGuard│  Ollama (qwen2.5-coder:3b)   │
│                     │ tunnel  │  Telegram Bot (оркестратор)  │
│  Tailscale          │         │  Tailscale                   │
└─────────────────────┘         └──────────────────────────────┘
                                  Firewall: ВСЕ публичные порты ЗАКРЫТЫ
                                  Только Tailscale (100.64.0.0/10)
```

**Зачем:** Telegram бот, ChromaDB, Ollama и OpenCode работают на VPS — твой M1 не нагружается. Никакого открытого интернета — только зашифрованный WireGuard тоннель. [dev](https://dev.to/nunc/self-hosting-openclaw-ai-assistant-on-a-vps-with-tailscale-vpn-zero-public-ports-35fn)

## ЧАСТЬ 1 — УСТАНОВКА TAILSCALE

### На VPS (Ubuntu)
```bash
# Установить Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Запустить с SSH и accept-routes
tailscale up --ssh --accept-routes --hostname=shadow-stack-vps

# Отключить обычный SSH (Tailscale SSH заменяет его)
sudo systemctl disable ssh
sudo ufw deny 22

# Закрыть ВСЕ публичные порты кроме Tailscale
sudo ufw default deny incoming
sudo ufw allow in on tailscale0
sudo ufw enable
```

### На MacBook
```bash
# Установить через Homebrew
brew install tailscale

# Запустить
sudo tailscaled
tailscale up --hostname=shadow-macbook
```

**CHECKPOINT 1** ✅ = `tailscale status` показывает оба устройства online [dev](https://dev.to/nunc/self-hosting-openclaw-ai-assistant-on-a-vps-with-tailscale-vpn-zero-public-ports-35fn)

## ЧАСТЬ 2 — MCP СЕРВЕР TAILSCALE

Добавить в **`opencode.json`** секцию `mcp`: [mcpservers](https://mcpservers.org/servers/HexSleeves/tailscale-mcp)

```json
{
  "mcp": {
    "vercel": {
      "type": "remote",
      "url": "https://mcp.vercel.com",
      "enabled": true
    },
    "tailscale": {
      "type": "local",
      "command": "npx",
      "args": [
        "--package=@hexsleeves/tailscale-mcp-server",
        "tailscale-mcp-server"
      ],
      "env": {
        "TAILSCALE_OAUTH_CLIENT_ID":     "{env:TAILSCALE_OAUTH_CLIENT_ID}",
        "TAILSCALE_OASSERT_CLIENT_SECRET": "{env:TAILSCALE_OASSERT_CLIENT_SECRET}",
        "TAILSCALE_TAILNET":             "{env:TAILSCALE_TAILNET}"
      },
      "enabled": true
    },
    "filesystem": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."],
      "enabled": true
    },
    "memory": {
      "type": "local",
      "command": "node",
      "args": [".opencode/mcp-servers/memory.js"],
      "enabled": true
    }
  }
}
```

## ЧАСТЬ 3 — TAILSCALE SKILL

**`.opencode/skills/tailscale-ops/SKILL.md`**

```markdown
---
name: tailscale-ops
description: Управление Tailscale сетью — проверка устройств, статус тоннеля, перезапуск сервисов на VPS. Используй для диагностики и управления инфраструктурой.
compatibility: opencode
metadata:
  project: shadow-stack
  security: "network"
---

## Доступные операции

### Статус сети
```bash
tailscale status                           # все устройства
tailscale ping shadow-stack-vps            # latency до VPS
tailscale ip -4 shadow-stack-vps           # IP адрес VPS в tailnet
```

### SSH на VPS через Tailscale
```bash
# Без ключей, без паролей — через Tailscale identity
tailscale ssh ubuntu@shadow-stack-vps

# Выполнить команду удалённо
ssh -o "StrictHostKeyChecking no" \
    ubuntu@$(tailscale ip -4 shadow-stack-vps) \
    "pm2 status"
```

### Управление сервисами на VPS
```bash
# Через tailscale ssh pipe
tailscale ssh ubuntu@shadow-stack-vps "pm2 restart shadow-orchestrator"
tailscale ssh ubuntu@shadow-stack-vps "pm2 logs --lines 50"
tailscale ssh ubuntu@shadow-stack-vps "docker ps"
tailscale ssh ubuntu@shadow-stack-vps "ollama list"
```

### MCP инструменты (через @hexsleeves/tailscale-mcp-server)
- `list_devices` — все устройства в tailnet
- `get_device_info` — детали конкретного устройства
- `get_network_status` — статус сети
- `manage_acls` — управление правилами доступа

## Безопасность

- Никогда не открывать порты VPS в публичный интернет
- Все соединения только через Tailscale (100.64.0.0/10)
- Dashboard OpenCode: только через SSH tunnel
- Supabase/Vercel API вызовы: через Tailscale egress
```

## ЧАСТЬ 4 — VPS SETUP СКРИПТ

**`scripts/vps-setup.sh`** — запустить один раз на VPS:

```bash
#!/bin/bash
# Запускать через: tailscale ssh ubuntu@shadow-stack-vps < scripts/vps-setup.sh

set -e

echo "🔧 Shadow Stack VPS Setup"

# ── Node.js ───────────────────────────────────────────
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

# ── PM2 ──────────────────────────────────────────────
npm install -g pm2 opencode-ai

# ── Ollama ───────────────────────────────────────────
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull qwen2.5-coder:3b &
ollama pull nomic-embed-text &

# ── ChromaDB ─────────────────────────────────────────
pip3 install chromadb
# Запустить ChromaDB (только на loopback!)
nohup chroma run --host 127.0.0.1 --port 8000 &

# ── Клонировать проект ────────────────────────────────
git clone https://github.com/your/shadow-stack.git ~/shadow-stack
cd ~/shadow-stack
npm install

# ── PM2 процессы ─────────────────────────────────────
pm2 start orchestrator/telegram-bot.js --name shadow-orchestrator
pm2 start server.js --name shadow-api
pm2 save
pm2 startup

# ── Firewall — только Tailscale ──────────────────────
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow in on tailscale0  # только Tailscale интерфейс
sudo ufw enable

echo "✅ VPS готов. Сервисы:"
pm2 status
```

## ЧАСТЬ 5 — APERTURE (Tailscale AI Gateway)

Tailscale выпустил **[Aperture](https://tailscale.com/blog/aperture-self-serve)** — централизованный AI gateway через Tailscale identity (в alpha с марта 2026): [tailscale](https://tailscale.com/blog/aperture-self-serve)

```bash
# Вместо хранить API ключи везде → один ключ в Aperture
# Запросы идут: агент → Tailscale identity → Aperture → модель

# Добавить в .env
APERTURE_URL=https://aperture.tailscale.com/v1
TAILSCALE_IDENTITY_TOKEN=<из tailscale token>
```

Обновить **`opencode.json`** для роутинга через Aperture:
```json
{
  "provider": {
    "aperture": {
      "options": {
        "baseURL": "https://aperture.tailscale.com/v1",
        "apiKey": "{env:TAILSCALE_IDENTITY_TOKEN}"
      }
    }
  },
  "model": "aperture/anthropic/claude-sonnet-4-5"
}
```

**Преимущества Aperture:** [tailscale](https://tailscale.com/blog/aperture-self-serve)
- Один ключ вместо N ключей на N машинах
- Все запросы привязаны к Tailscale identity
- Логи и метрики по каждому агенту
- Ключи не хранятся на VPS — только в gateway
```

## ЧАСТЬ 6 — ОБНОВИТЬ SECURITY SKILL

Добавить в **`.opencode/skills/security-check/SKILL.md`** раздел:

```markdown
## 6. TAILSCALE СЕТЕВАЯ БЕЗОПАСНОСТЬ

```bash
# VPS слушает только на loopback?
tailscale ssh ubuntu@shadow-stack-vps \
  "ss -tlnp | grep -v '127.0.0.1\|100.64\|\:\:1'"
# ✅ OK: нет строк → публичных портов нет
# ❌ FAIL: есть строки → закрыть порты через ufw

# UFW статус
tailscale ssh ubuntu@shadow-stack-vps "sudo ufw status"
# ✅ OK: только tailscale0 разрешён

# Chromadb не торчит наружу?
tailscale ssh ubuntu@shadow-stack-vps \
  "curl -s http://localhost:8000/api/v1/heartbeat"
# ✅ OK: отвечает на localhost
# Попытка с публичного IP должна fail
```
```

## ✅ ФИНАЛЬНЫЙ CHECKLIST

```
TAILSCALE SETUP
[ ] tailscale account → создать аккаунт
[ ] VPS: tailscale up --ssh --hostname=shadow-stack-vps
[ ] MacBook: tailscale up --hostname=shadow-macbook
[ ] tailscale status → оба устройства ✅

VPS HARDENING
[ ] ufw: deny all incoming, allow tailscale0
[ ] sshd: disabled (заменён Tailscale SSH)
[ ] ChromaDB: bind 127.0.0.1 только
[ ] Ollama: bind 127.0.0.1 только
[ ] pm2: shadow-orchestrator + shadow-api

MCP + OPENCODE
[ ] TAILSCALE_OAUTH_CLIENT_ID в .env
[ ] TAILSCALE_OASSERT_CLIENT_SECRET в .env
[ ] TAILSCALE_TAILNET в .env (например: tail1234.ts.net)
[ ] opencode.json → tailscale MCP добавлен
[ ] .opencode/skills/tailscale-ops/SKILL.md создан
[ ] opencode → /skills → tailscale-ops виден

APERTURE (опционально)
[ ] tailscale.com/aperture → sign up alpha
[ ] APERTURE_URL + TAILSCALE_IDENTITY_TOKEN в .env
[ ] opencode.json → model: "aperture/..."

ПРОВЕРКА
[ ] tailscale ping shadow-stack-vps → <10ms
[ ] tailscale ssh ubuntu@shadow-stack-vps "pm2 status"
[ ] Telegram: /status → ответ через VPS
[ ] Telegram: /next → блок 0.1 OAuth
```
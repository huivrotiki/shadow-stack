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

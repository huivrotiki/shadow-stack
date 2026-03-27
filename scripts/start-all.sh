#!/usr/bin/env bash
# Shadow Stack — Start All Services
# Usage: ./scripts/start-all.sh

ROOT="$(cd "$(dirname "$0")/.."; pwd)"
echo "🚀 Shadow Stack v6.0 — Starting all services"
echo "Root: $ROOT"
echo ""

# Kill existing processes
echo "🔄 Cleaning up old processes..."
pkill -f "node server" 2>/dev/null || true
pkill -f "serve health" 2>/dev/null || true
pkill -f "opencode-telegram" 2>/dev/null || true
sleep 1

# 1. Express API (port 3001)
echo "▶️  [1/4] Express API :3001"
cd "$ROOT"
doppler run --project serpent --config dev -- node server/index.js > /tmp/express.log 2>&1 &
EXPRESS_PID=$!
sleep 2

# 2. Health Dashboard (port 5176)
echo "▶️  [2/4] Health Dashboard :5176"
cd "$ROOT"
doppler run --project serpent --config dev -- npx serve health-dashboard -l 5176 --no-clipboard > /tmp/dash.log 2>&1 &
DASH_PID=$!
sleep 1

# 3. Telegram Bot (port 4000)
echo "▶️  [3/4] Telegram Orchestrator :4000"
cd "$ROOT"
doppler run --project serpent --config dev -- node bot/opencode-telegram-bridge.cjs > /tmp/bot.log 2>&1 &
BOT_PID=$!
sleep 2

# 4. OpenClaw Gateway (port 18789)
echo "▶️  [4/4] OpenClaw Gateway :18789"
bash "$ROOT/scripts/start-openclaw.sh" > /tmp/openclaw.log 2>&1 &
OCLAW_PID=$!
sleep 2

# Verify
echo ""
echo "🔍 Verifying services..."
check() {
  if curl -s "$1" > /dev/null 2>&1; then
    echo "🟢 $2"
  else
    echo "🔴 $2 (check /tmp/$(echo $2 | tr ' ' '_' | tr '[:upper:]' '[:lower:]').log)"
  fi
}

check http://localhost:11434   "Ollama       :11434"
check http://localhost:3001/health "Express API  :3001"
check http://localhost:5176    "Dashboard    :5176"
check http://localhost:4000/health "Telegram Bot :4000"
check http://localhost:18789   "OpenClaw     :18789"

echo ""
echo "✅ Shadow Stack started!"
echo "📱 Send /status to @shadowstackv1_bot to verify"
echo ""
echo "PIDs: express=$EXPRESS_PID dash=$DASH_PID bot=$BOT_PID openclaw=$OCLAW_PID"

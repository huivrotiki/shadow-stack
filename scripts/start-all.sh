#!/bin/bash
# Shadow Stack — Start All Services
# Usage: ./scripts/start-all.sh

set -e
cd "$(dirname "$0")/.."

echo "═══════════════════════════════════════"
echo "  Shadow Stack — Starting All Services"
echo "═══════════════════════════════════════"

# Load environment
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
fi

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check Ollama
if curl -s http://localhost:11434 > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Ollama${NC} — running on :11434"
else
  echo -e "${YELLOW}⚠️  Ollama${NC} — not running. Starting..."
  ollama serve &
  sleep 2
fi

# Start Express API (port 3001)
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Express API${NC} — already running on :3001"
else
  echo -e "${YELLOW}🚀 Starting Express API${NC} on :3001..."
  nohup node server/index.js > /tmp/shadow-express.log 2>&1 &
  sleep 2
  if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Express API${NC} — started"
  else
    echo -e "${RED}❌ Express API${NC} — failed to start. Check /tmp/shadow-express.log"
  fi
fi

# Start Dashboard (port 5176)
if curl -s http://localhost:5176 > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Dashboard${NC} — already running on :5176"
else
  echo -e "${YELLOW}🚀 Starting Dashboard${NC} on :5176..."
  nohup npx -y serve health-dashboard -l 5176 --no-clipboard > /tmp/shadow-dashboard.log 2>&1 &
  sleep 2
  echo -e "${GREEN}✅ Dashboard${NC} — http://localhost:5176"
fi

# Start Telegram Bot (port 4000)
if curl -s http://localhost:4000/health > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Telegram Bot${NC} — already running on :4000"
else
  echo -e "${YELLOW}🚀 Starting Telegram Bot${NC} on :4000..."
  BOT_PORT=4000 nohup node bot/opencode-telegram-bridge.cjs > /tmp/shadow-bot.log 2>&1 &
  sleep 3
  if curl -s http://localhost:4000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Telegram Bot${NC} — started"
  else
    echo -e "${RED}⚠️  Telegram Bot${NC} — health endpoint may need token update"
    echo "   Check: tail -f /tmp/shadow-bot.log"
  fi
fi

echo ""
echo "═══════════════════════════════════════"
echo "  Services Status"
echo "═══════════════════════════════════════"

# Status summary
for svc in "Ollama:11434" "Express:3001" "Dashboard:5176" "Bot:4000"; do
  name="${svc%%:*}"
  port="${svc##*:}"
  if curl -s "http://localhost:${port}" > /dev/null 2>&1; then
    echo -e "  ${GREEN}🟢${NC} ${name} — :${port}"
  else
    echo -e "  ${RED}🔴${NC} ${name} — :${port}"
  fi
done

echo ""
echo "📊 Dashboard:  http://localhost:5176"
echo "🔌 API:        http://localhost:3001/api/health"
echo "🤖 Bot:        http://localhost:4000/health"
echo "🦙 Ollama:     http://localhost:11434"
echo ""
echo "Logs:"
echo "  tail -f /tmp/shadow-express.log"
echo "  tail -f /tmp/shadow-bot.log"
echo "  tail -f /tmp/shadow-dashboard.log"

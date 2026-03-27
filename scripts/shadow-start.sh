#!/bin/bash
# scripts/shadow-start.sh — Shadow Stack Startup Script
# Usage: bash scripts/shadow-start.sh [start|stop|status]

set -e

ACTION="${1:-status}"
PID_FILE="/tmp/shadow-stack.pid"
BOT_PID_FILE="/tmp/shadow-stack-bot.pid"

check_deps() {
  echo "Checking dependencies..."
  command -v node >/dev/null 2>&1 || { echo "❌ Node.js not found"; exit 1; }
  echo "  ✅ Node.js $(node --version)"

  if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "  ✅ Ollama online"
  else
    echo "  ⚠️  Ollama offline (local models unavailable)"
  fi
}

do_start() {
  check_deps

  echo "Starting Shadow Stack server..."
  node server/index.js &
  echo $! > "$PID_FILE"
  echo "  Server PID: $(cat $PID_FILE)"

  echo "Starting Telegram bot..."
  doppler run -- node bot/opencode-telegram-bridge.cjs &
  echo $! > "$BOT_PID_FILE"
  echo "  Bot PID: $(cat $BOT_PID_FILE)"

  echo ""
  echo "✅ Shadow Stack started"
  echo "  Server: http://localhost:3000"
  echo "  Health: http://localhost:3000/api/health"
  echo "  Bot: running via doppler"
}

do_stop() {
  echo "Stopping Shadow Stack..."
  if [ -f "$PID_FILE" ]; then
    kill "$(cat $PID_FILE)" 2>/dev/null && echo "  Server stopped" || echo "  Server already stopped"
    rm -f "$PID_FILE"
  fi
  if [ -f "$BOT_PID_FILE" ]; then
    kill "$(cat $BOT_PID_FILE)" 2>/dev/null && echo "  Bot stopped" || echo "  Bot already stopped"
    rm -f "$BOT_PID_FILE"
  fi
  pkill -f "opencode-telegram-bridge" 2>/dev/null || true
  echo "✅ Stopped"
}

do_status() {
  echo "Shadow Stack Status"
  echo "==================="

  if [ -f "$PID_FILE" ] && kill -0 "$(cat $PID_FILE)" 2>/dev/null; then
    echo "  Server: ✅ running (PID $(cat $PID_FILE))"
  else
    echo "  Server: ❌ not running"
  fi

  if [ -f "$BOT_PID_FILE" ] && kill -0 "$(cat $BOT_PID_FILE)" 2>/dev/null; then
    echo "  Bot: ✅ running (PID $(cat $BOT_PID_FILE))"
  else
    echo "  Bot: ❌ not running"
  fi

  if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "  Ollama: ✅ online"
  else
    echo "  Ollama: ❌ offline"
  fi

  echo ""
  echo "  Node: $(node --version)"
  echo "  Memory: $(ps -o rss= -p $$ 2>/dev/null || echo '?')KB"
}

case "$ACTION" in
  start)  do_start ;;
  stop)   do_stop ;;
  status) do_status ;;
  restart) do_stop; sleep 1; do_start ;;
  *)      echo "Usage: $0 [start|stop|status|restart]"; exit 1 ;;
esac

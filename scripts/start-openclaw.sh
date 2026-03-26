#!/usr/bin/env bash
# Shadow Stack — OpenClaw Gateway Start Script
# Usage: ./scripts/start-openclaw.sh

set -e
ROOT="$(cd "$(dirname "$0")/.."; pwd)"
CONFIG="$ROOT/openclaw.config.json"

echo "🔍 Checking dependencies..."

# Check Ollama
if curl -s http://localhost:11434 > /dev/null 2>&1; then
  echo "✅ Ollama running on :11434"
else
  echo "⚠️  Ollama not running — starting..."
  ollama serve &
  sleep 3
fi

# Check if zeroclaw/openclaw is installed
if command -v zeroclaw &> /dev/null; then
  RUNNER="zeroclaw"
elif command -v openclaw &> /dev/null; then
  RUNNER="openclaw"
elif [ -f "$ROOT/node_modules/.bin/openclaw" ]; then
  RUNNER="$ROOT/node_modules/.bin/openclaw"
else
  echo "❌ OpenClaw not found. Installing via npm..."
  npm install -g @opencode/openclaw 2>/dev/null || \
  npm install -g openclaw 2>/dev/null || \
  echo "⚠️  Could not install. Try: cargo install zeroclaw"
  RUNNER="openclaw"
fi

echo "🚀 Starting OpenClaw Gateway on port 18789..."
echo "📦 Config: $CONFIG"
echo ""

doppler run --project serpent --config dev -- \
  $RUNNER start \
  --port 18789 \
  --config "$CONFIG" \
  --upstream http://localhost:11434 \
  --fallback http://localhost:3001/api/route

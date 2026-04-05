#!/bin/bash
# scripts/autoresearch-run.sh
set -e

FREE_MB=$(curl -s localhost:3001/ram | python3 -c "import sys,json; print(json.load(sys.stdin)['free_mb'])" 2>/dev/null || echo 999)
if [ "$FREE_MB" -lt 400 ]; then
  echo "❌ RAM < 400MB (${FREE_MB}MB) — ABORT"
  exit 1
fi

LOCK=$(grep "lock_until" .state/current.yaml | head -1)
echo "🔒 $LOCK"
echo "🧠 RAM: ${FREE_MB}MB"
echo "🚀 AutoResearch (${1:-20} iterations)..."

node autoresearch/loop.js "${1:-20}"

curl -s -X POST localhost:4000/notify \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"✅ AutoResearch завершён (${1:-20} iter)\"}" 2>/dev/null || true

echo "✅ Done"

#!/bin/bash
# scripts/smoke-test.sh — Shadow Stack Smoke Test
# Tests: server, health, providers, bot
# Exit 0 on all pass, 1 on any fail

set -e

PASS=0
FAIL=0
BASE="${SMOKE_URL:-http://127.0.0.1:3000}"

check() {
  local name="$1"
  local url="$2"
  local code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")
  if [ "$code" = "200" ]; then
    echo "  ✅ $name ($code)"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $name ($code)"
    FAIL=$((FAIL + 1))
  fi
}

echo "Shadow Stack Smoke Test"
echo "======================="
echo ""

echo "Server endpoints:"
check "Health"        "$BASE/health"
check "API Health"    "$BASE/api/health"
check "API System"    "$BASE/api/health/system"
check "API Providers" "$BASE/api/health/providers"
check "API Alerts"    "$BASE/api/health/alerts"

echo ""
echo "Providers:"
if curl -s --max-time 3 http://localhost:11434/api/tags >/dev/null 2>&1; then
  echo "  ✅ Ollama online"
  PASS=$((PASS + 1))
else
  echo "  ❌ Ollama offline"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "Bot:"
if pgrep -f "opencode-telegram-bridge" >/dev/null 2>&1; then
  echo "  ✅ Bot running"
  PASS=$((PASS + 1))
else
  echo "  ❌ Bot not running"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "Results: $PASS passed, $FAIL failed"

if [ $FAIL -gt 0 ]; then
  exit 1
fi
exit 0

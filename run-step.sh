#!/bin/bash
# Shadow Stack Widget — Quick Start Script

set -e

cd ~/shadow-stack-widget

echo "🔮 Shadow Stack Widget — CLI Session"
echo "===================================="

# Parse args
STEP=${1:-0}
DEBUG=${2:-}

CMD="npm run headless -- --step=$STEP"
[[ "$DEBUG" == "--debug" ]] && CMD="$CMD --debug"

echo ""
echo "Running: $CMD"
echo "-------------------------------------"
eval $CMD

echo ""
echo "===================================="
echo "✅ Step $STEP complete"
echo ""

# Show debug log if requested
if [[ "$DEBUG" == "--debug" ]]; then
  echo "--- Debug Log (last 10 lines) ---"
  tail -10 /tmp/shadow-widget.log
fi

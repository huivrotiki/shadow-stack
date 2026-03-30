#!/bin/bash
# Shadow Stack — Save Browser Session for Shadow Routing
# Usage: ./scripts/save-browser-session.sh [claude|chatgpt|gemini|grok]

TARGET="${1:-claude}"
CDP_PORT=9222

echo "🕵️ Saving browser session for: $TARGET"
echo "📝 Instructions:"
echo "   1. Chrome will open with debugging on port $CDP_PORT"
echo "   2. Navigate to the LLM website"
echo "   3. Log in to your account"
echo "   4. Wait 5 seconds for session to save"
echo "   5. Close this terminal — session stays alive!"
echo ""
echo "⚠️  Press Ctrl+C to cancel"
echo ""

read -t 5 -p "Starting in 5 seconds... " || true

open -a "Google Chrome" --args --remote-debugging-port=$CDP_PORT

echo "✅ Chrome started with CDP on port $CDP_PORT"
echo "🔗 Connect apps using: http://localhost:$CDP_PORT"

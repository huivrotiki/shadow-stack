#!/bin/bash
# Shadow Stack Widget — System Audit

echo "🔍 Shadow Stack — System Audit"
echo "================================"

echo ""
echo "📦 Installed tools:"
which brew node python3 ollama git 2>/dev/null && echo "✅ All found" || echo "❌ Missing"

echo ""
echo "💾 Disk:"
df -h ~ | tail -1

echo ""
echo "🧠 Memory:"
vm_stat | grep "Pages free"

echo ""
echo "🔗 Listening ports:"
lsof -iTCP -sTCP:LISTEN -P | grep -v grep | awk '{print $9, $1}' | sort

echo ""
echo "🖥️ Services:"
launchctl list | grep -E "(ollama|openclaw|langfuse)" || echo "No agent services"

echo ""
echo "🌐 Tailscale:"
tailscale status 2>/dev/null | head -5 || echo "Not running"

echo ""
echo "🦙 Ollama:"
curl -s http://localhost:11434/api/tags 2>/dev/null | grep -o '"name":"[^"]*"' | head -10 || echo "Ollama offline"

echo ""
echo "================================"
echo "Audit complete"

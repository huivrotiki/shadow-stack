#!/bin/bash
# ~/shadow-stack_local_1/scripts/init_openclaw.sh
# Инициализация OpenClaw для браузер-валидации
# ADAPTED: БЕЗ Docker (запрещено SOUL.md) — используем npx/локальный запуск

echo "🔨 Initializing OpenClaw (no Docker)..."

# Проверить Node.js
if ! command -v node &> /dev/null; then
    echo "✘ Node.js not found. Install: brew install node"
    exit 1
fi

# Проверить наличие OpenClaw
if ! command -v openclaw &> /dev/null; then
    echo "⚠ OpenClaw CLI not installed. Installing via npm..."
    npm install -g openclaw 2>/dev/null || {
        echo "⚠ openclaw not available via npm, using playwright instead"
        npx playwright install chromium 2>/dev/null
    }
fi

# Проверить порт 3000
if lsof -i :3000 &> /dev/null; then
    echo "⚠ Port 3000 already in use:"
    lsof -i :3000 | head -3
    echo ""
    echo "Kill it? Run: kill -9 \$(lsof -t -i :3000)"
else
    echo "✅ Port 3000 is free"
fi

# Проверить здоровье всех сервисов
echo ""
echo "🔍 Checking service health..."

services=(
    "Ollama|http://localhost:11434/api/tags"
    "LiteLLM|http://localhost:4000/health"
    "n8n|http://localhost:5678/healthz"
)

for service in "${services[@]}"; do
    IFS='|' read -r name url <<< "$service"
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    if [ "$status" = "200" ]; then
        echo "  ✅ $name — OK ($url)"
    else
        echo "  ✘ $name — DOWN (HTTP $status)"
    fi
done

echo ""
echo "✅ OpenClaw initialized — ready for validation"
echo "   Browser: http://localhost:3000"
echo "   API: http://localhost:3000/api"
echo ""
echo "After validation — switch to autonomous mode:"
echo "   python3 autonomous_build.py --skip-browser"

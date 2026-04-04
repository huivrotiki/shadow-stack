#!/bin/bash
# Создание custom Ollama профилей для Agent Factory
# Запуск: bash scripts/ollama-setup.sh

set -e

echo "🔧 Checking Ollama..."
if ! command -v ollama &>/dev/null; then
  echo "❌ Ollama not found. Install: brew install ollama"
  exit 1
fi

echo "✅ Ollama: $(ollama --version)"
echo ""

echo "📦 Creating custom models..."

# shadow-coder
if ollama show shadow-coder &>/dev/null 2>&1; then
  echo "⏭️  shadow-coder already exists"
else
  echo "🔨 Creating shadow-coder (qwen2.5-coder:3b)..."
  ollama create shadow-coder -f ollama/Modelfile.coder
fi

# shadow-general
if ollama show shadow-general &>/dev/null 2>&1; then
  echo "⏭️  shadow-general already exists"
else
  echo "🔨 Creating shadow-general (llama3.2:3b)..."
  ollama create shadow-general -f ollama/Modelfile.general
fi

# shadow-embed
if ollama show shadow-embed &>/dev/null 2>&1; then
  echo "⏭️  shadow-embed already exists"
else
  echo "🔨 Creating shadow-embed (nomic-embed-text)..."
  ollama create shadow-embed -f ollama/Modelfile.embed
fi

echo ""
echo "✅ All models ready:"
ollama list | grep shadow

echo ""
echo "📝 Если ещё не скачаны базовые модели:"
echo "  ollama pull qwen2.5-coder:3b"
echo "  ollama pull llama3.2:3b"
echo "  ollama pull nomic-embed-text"

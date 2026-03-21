#!/bin/bash
# Shadow Stack — Auto-select best Ollama model

echo "🦙 Shadow Stack — Best Model Selector"
echo "======================================"

# Best free models in order of preference
MODELS=("qwen2.5:3b" "llama3.2" "phi3" "mistral")

echo ""
echo "Available models:"
ollama list 2>/dev/null | grep -E "^NAME" -A 20 || echo "No models installed"

echo ""
echo "Checking for best available model..."

SELECTED=""
for model in "${MODELS[@]}"; do
  if ollama list 2>/dev/null | grep -q "$model"; then
    echo "✅ Found: $model"
    SELECTED=$model
    break
  fi
done

if [[ -z "$SELECTED" ]]; then
  echo "❌ No preferred models found!"
  echo "Pull recommended model:"
  echo "  ollama pull qwen2.5:3b"
  exit 1
fi

echo ""
echo "Setting $SELECTED as default..."
mkdir -p ~/.ollama
echo "{\"model\": \"$SELECTED\"}" > ~/.ollama/config.json

echo ""
echo "✅ Best model: $SELECTED"
echo "======================================"

# Show info
echo ""
echo "Test the model:"
echo "  ollama run $SELECTED \"Hello, how are you?\""

#!/bin/bash
# ollama-setup.sh — Initialize and configure Ollama for Shadow Stack (M1 8GB)
# Usage: ./scripts/ollama-setup.sh

set -e

echo "=== Ollama Setup for Shadow Stack (M1 8GB) ==="
echo ""

# 1. Check Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
  echo "❌ Ollama not running. Starting..."
  ollama serve &
  sleep 2
fi
echo "✅ Ollama is running"

# 2. Set M1-optimized environment
export OLLAMA_MAX_LOADED_MODELS=1
export OLLAMA_NUM_PARALLEL=1
export OLLAMA_KEEP_ALIVE=5m

# 3. Pull required models (skip if already present)
MODELS=("nomic-embed-text" "qwen2.5-coder:3b" "llama3.2:3b")

for model in "${MODELS[@]}"; do
  if ollama list | grep -q "$model"; then
    echo "✅ $model already installed"
  else
    echo "⏳ Pulling $model..."
    ollama pull "$model"
    echo "✅ $model installed"
  fi
done

# 4. Create custom model profiles
echo ""
echo "=== Creating custom model profiles ==="

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

if [ -f "$ROOT_DIR/ollama/Modelfile.coder" ]; then
  ollama create shadow-coder -f "$ROOT_DIR/ollama/Modelfile.coder" 2>/dev/null && \
    echo "✅ shadow-coder profile created (qwen2.5-coder:3b + code system prompt)" || \
    echo "⚠️  shadow-coder: base model not ready yet, will retry later"
fi

if [ -f "$ROOT_DIR/ollama/Modelfile.general" ]; then
  ollama create shadow-general -f "$ROOT_DIR/ollama/Modelfile.general" 2>/dev/null && \
    echo "✅ shadow-general profile created (llama3.2:3b + assistant system prompt)" || \
    echo "⚠️  shadow-general: base model not ready yet, will retry later"
fi

# 5. Verify all models
echo ""
echo "=== Installed models ==="
ollama list

# 6. Quick smoke test
echo ""
echo "=== Quick smoke test ==="

# Test embedding model
echo -n "Testing nomic-embed-text... "
EMBED_RESULT=$(curl -s http://localhost:11434/api/embeddings -d '{
  "model": "nomic-embed-text",
  "prompt": "test embedding",
  "keep_alive": 0
}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('embedding',[])))" 2>/dev/null)

if [ "$EMBED_RESULT" -gt 0 ] 2>/dev/null; then
  echo "✅ OK (${EMBED_RESULT} dimensions)"
else
  echo "❌ Failed"
fi

# Test coder model (only if downloaded)
if ollama list | grep -q "qwen2.5-coder"; then
  echo -n "Testing qwen2.5-coder:3b... "
  CODER_RESULT=$(curl -s http://localhost:11434/api/generate -d '{
    "model": "qwen2.5-coder:3b",
    "prompt": "Write a one-line JavaScript hello world",
    "stream": false,
    "options": {"num_predict": 50}
  }' | python3 -c "import sys,json; r=json.load(sys.stdin).get('response',''); print('OK' if len(r)>5 else 'EMPTY')" 2>/dev/null)
  echo "✅ $CODER_RESULT"

  # Unload model after test (free RAM)
  curl -s http://localhost:11434/api/generate -d '{"model":"qwen2.5-coder:3b","keep_alive":0}' > /dev/null 2>&1
fi

echo ""
echo "=== RAM status ==="
python3 -c "
import subprocess, json
r = subprocess.run(['vm_stat'], capture_output=True, text=True)
lines = r.stdout.split('\n')
page_size = 16384
free = int([l for l in lines if 'free' in l][0].split(':')[1].strip().rstrip('.')) * page_size
inactive = int([l for l in lines if 'inactive' in l][0].split(':')[1].strip().rstrip('.')) * page_size
total_free = (free + inactive) / 1024 / 1024
print(f'Free RAM: {total_free:.0f} MB')
if total_free > 400:
    print('✅ Safe for browser + LLM operations')
elif total_free > 200:
    print('⚠️  Low RAM — use ollama-3b only, skip browser')
else:
    print('❌ CRITICAL — abort heavy operations')
"

echo ""
echo "=== Setup complete ==="
echo "Models: nomic-embed-text (embeddings), qwen2.5-coder:3b (code), llama3.2:3b (general)"
echo "Custom profiles: shadow-coder, shadow-general"
echo "Config: OLLAMA_MAX_LOADED_MODELS=1, KEEP_ALIVE=5m, NUM_PARALLEL=1"

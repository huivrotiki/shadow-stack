#!/bin/bash
# Start Claude Code with LiteLLM proxy → Ollama (FREE, local)
# Usage: ./scripts/start-claude-local.sh
#
# Prerequisites:
#   1. ollama serve (running on :11434)
#   2. ollama pull qwen2.5-coder:3b
#   3. pip install litellm

set -e

echo "=== Shadow Stack: Claude Local Mode ==="
echo ""

# Check Ollama
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
  echo "Starting Ollama..."
  ollama serve &
  sleep 3
fi

# Check if qwen2.5-coder:3b is available
if ! curl -s http://localhost:11434/api/tags | grep -q "qwen2.5-coder:3b"; then
  echo "Pulling qwen2.5-coder:3b..."
  ollama pull qwen2.5-coder:3b
fi

# Check LiteLLM
if ! command -v litellm &> /dev/null; then
  echo "Installing litellm..."
  pip install litellm
fi

# Start LiteLLM proxy on port 4001 (NOT 4000 — bot uses 4000)
echo "Starting LiteLLM proxy on :4001..."
litellm --model ollama/qwen2.5-coder:3b --port 4001 &
LITELLM_PID=$!
sleep 2

# Verify LiteLLM is running
if curl -s http://localhost:4001/health > /dev/null 2>&1; then
  echo "LiteLLM proxy ready on :4001"
else
  echo "WARNING: LiteLLM may not be ready yet"
fi

echo ""
echo "=== Ready! Start Claude Code with: ==="
echo ""
echo "  export ANTHROPIC_BASE_URL=http://localhost:4001"
echo "  export ANTHROPIC_API_KEY=sk-shadow-local"
echo "  claude"
echo ""
echo "Or run directly:"
echo "  ANTHROPIC_BASE_URL=http://localhost:4001 ANTHROPIC_API_KEY=sk-shadow-local claude"
echo ""
echo "LiteLLM PID: $LITELLM_PID"
echo "To stop: kill $LITELLM_PID"

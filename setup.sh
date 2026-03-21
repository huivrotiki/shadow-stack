#!/bin/bash
# Shadow Stack Widget — Complete Setup Script
# One script to rule them all

set -e

echo "🔮 Shadow Stack Widget — Complete Setup"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cd ~/shadow-stack-widget

# === PHASE 1: System Audit ===
echo -e "${YELLOW}[1/6] System Audit${NC}"
echo "----------------------------"
./audit.sh 2>/dev/null || npm run headless -- --step=0 --debug
echo ""

# === PHASE 2: Ollama Models ===
echo -e "${YELLOW}[2/6] Ollama Models${NC}"
echo "----------------------------"
echo "Checking available models..."
ollama list 2>/dev/null | grep -E "^NAME" -A 5 || echo "No models installed"

# Auto-select best model
echo ""
echo "Selecting best FREE model..."
./select-model.sh 2>/dev/null || {
  MODELS=("qwen2.5:3b" "llama3.2" "phi3" "mistral")
  for model in "${MODELS[@]}"; do
    if ollama list 2>/dev/null | grep -q "$model"; then
      echo "✅ Best model: $model"
      break
    fi
  done
}
echo ""

# === PHASE 3: API Providers ===
echo -e "${YELLOW}[3/6] API Providers (NO Anthropic)${NC}"
echo "----------------------------"
echo "Checking available providers..."

# Ollama
if curl -s http://localhost:11434/v1/models > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Ollama${NC} — localhost:11434"
  ollama list | grep -E "^NAME|^SIZE" | head -5
else
  echo -e "${RED}❌ Ollama${NC} — not responding"
fi

# Comet/Opik
if curl -s http://localhost:8080/v1/models > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Comet/Opik${NC} — localhost:8080"
else
  echo -e "${YELLOW}⚠️  Comet/Opik${NC} — not running"
fi

# Check .env for other providers
if [[ -f ~/.env ]] || [[ -f ~/shadow-stack-widget/.env ]]; then
  ENV_FILE=$([[ -f ~/shadow-stack-widget/.env ]] && echo ~/shadow-stack-widget/.env || echo ~/.env)
  echo ""
  echo "API Keys in .env:"
  grep -E "GROQ|MISTRAL|COHERE|OPENAI|VERTEX" "$ENV_FILE" 2>/dev/null | sed 's/=.*/=***/' | head -5 || echo "  No cloud API keys found"
fi
echo ""

# === PHASE 4: MCP Skills ===
echo -e "${YELLOW}[4/6] MCP Skills${NC}"
echo "----------------------------"
echo "Installed skills:"
SKILL_COUNT=$(ls ~/AI-Workspace/02-Skills/ 2>/dev/null | wc -l | tr -d ' ')
echo "  AI-Workspace: $SKILL_COUNT skills"

USER_SKILLS=$(ls ~/.claude/skills/ 2>/dev/null | wc -l | tr -d ' ')
echo "  User skills: $USER_SKILLS skills"

echo ""
echo "Key skills:"
ls ~/AI-Workspace/02-Skills/ 2>/dev/null | grep -E "(shadow|github|slack|ollama|openai|claude)" | head -10 || echo "  (none found)"

# Shadow stack widget skill
if [[ -f ~/AI-Workspace/02-Skills/shadow-stack-widget/SKILL.md ]]; then
  echo -e "${GREEN}✅ shadow-stack-widget skill${NC} — installed"
fi
echo ""

# === PHASE 5: Best Model for LLM ===
echo -e "${YELLOW}[5/6] Best Available LLM${NC}"
echo "----------------------------"
BEST_MODEL="none"
for model in qwen2.5:3b llama3.2 phi3 mistral; do
  if ollama list 2>/dev/null | grep -q "$model"; then
    BEST_MODEL=$model
    break
  fi
done

if [[ "$BEST_MODEL" != "none" ]]; then
  echo -e "${GREEN}✅ Best model: $BEST_MODEL${NC}"
else
  echo -e "${RED}❌ No Ollama models installed${NC}"
  echo "   Run: ollama pull qwen2.5:3b"
fi
echo ""

# === PHASE 6: Run Shadow Stack ===
echo -e "${YELLOW}[6/6] Shadow Stack Steps${NC}"
echo "----------------------------"

if [[ "$1" == "--full" ]] || [[ "$1" == "-f" ]]; then
  echo "Running full Shadow Stack..."
  npm run headless -- --all --debug
else
  echo "Skipping full run (use --full to run all steps)"
  echo ""
  echo "Quick test (Step 0):"
  npm run headless -- --step=0 --debug
fi

# === SUMMARY ===
echo ""
echo "========================================"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Run all steps:  npm run headless -- --all --debug"
echo "  2. Run GUI:         npm run start"
echo "  3. Check logs:      tail -f /tmp/shadow-widget.log"
echo ""
echo "Best model: $BEST_MODEL"
echo "Ollama:      $(curl -s http://localhost:11434/api/tags 2>/dev/null | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4 || echo 'not responding')"
echo "Skills:     $SKILL_COUNT installed"
echo ""

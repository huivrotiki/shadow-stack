#!/bin/bash
# test-models-batch.sh — Batch testing for untested models
# Usage: ./test-models-batch.sh [batch_size] [output_file]

set -e

BATCH_SIZE=${1:-10}
OUTPUT_FILE=${2:-"docs/00-overview/MODEL_TEST_RESULTS.md"}
API_URL="http://localhost:20129/v1/chat/completions"
TEST_PROMPT="What is 2+2? Answer in one sentence."
MAX_TOKENS=20
TIMEOUT=30

# ANSI colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Untested models list (56 models from MODELS_FULL_TABLE.md)
UNTESTED_MODELS=(
  # Together AI (6 models)
  "tg-llama70b"
  "tg-llama405b"
  "tg-qwen-coder"
  "tg-deepseek-v3"
  "tg-deepseek-r1"
  "tg-mixtral"
  
  # Hyperbolic (12 models)
  "hb-llama70b"
  "hb-llama405b"
  "hb-qwen3-32b"
  "hb-qwen3-72b"
  "hb-deepseek-v3"
  "hb-deepseek-r1"
  "hb-mixtral"
  "hb-nemotron"
  "hb-gemma27b"
  "hb-gemma29b"
  "hb-phi4"
  "hb-ministral"
  
  # Cerebras (8 models)
  "cb-llama8b"
  "cb-llama70b"
  "cb-llama405b"
  "cb-qwen3-32b"
  "cb-qwen3-72b"
  "cb-deepseek-v3"
  "cb-deepseek-r1"
  "cb-mixtral"
  
  # Lepton (6 models)
  "lp-llama70b"
  "lp-llama405b"
  "lp-qwen3-32b"
  "lp-deepseek-v3"
  "lp-deepseek-r1"
  "lp-mixtral"
  
  # SambaNova (8 models)
  "sn-llama8b"
  "sn-llama70b"
  "sn-llama405b"
  "sn-qwen3-32b"
  "sn-qwen3-72b"
  "sn-deepseek-v3"
  "sn-deepseek-r1"
  "sn-mixtral"
  
  # Nebius (8 models)
  "nb-llama8b"
  "nb-llama70b"
  "nb-llama405b"
  "nb-qwen3-32b"
  "nb-qwen3-72b"
  "nb-deepseek-v3"
  "nb-deepseek-r1"
  "nb-mixtral"
  
  # Fireworks (remaining 8 models)
  "fw-qwen3-32b"
  "fw-qwen3-72b"
  "fw-deepseek-v3"
  "fw-deepseek-r1"
  "fw-mixtral"
  "fw-gemma27b"
  "fw-phi4"
  "fw-ministral"
)

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Model Batch Testing — Shadow Stack Local          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📊 Configuration:${NC}"
echo -e "   Batch size: ${BATCH_SIZE}"
echo -e "   Total models: ${#UNTESTED_MODELS[@]}"
echo -e "   Output: ${OUTPUT_FILE}"
echo -e "   API: ${API_URL}"
echo -e "   Timeout: ${TIMEOUT}s"
echo ""

# Initialize output file
mkdir -p "$(dirname "$OUTPUT_FILE")"
cat > "$OUTPUT_FILE" << EOF
# Model Test Results — $(date '+%Y-%m-%d %H:%M:%S')

**Batch size:** ${BATCH_SIZE}  
**Total models tested:** 0 / ${#UNTESTED_MODELS[@]}  
**API:** ${API_URL}

---

## Test Results

| # | Model | Status | Latency | Response | Error |
|---|-------|--------|---------|----------|-------|
EOF

# Test function
test_model() {
  local model=$1
  local index=$2
  
  echo -e "${BLUE}[${index}/${#UNTESTED_MODELS[@]}]${NC} Testing ${YELLOW}${model}${NC}..."
  
  local start_time=$(date +%s)
  
  # Make request with timeout
  local response=$(curl -s --max-time $TIMEOUT -X POST "$API_URL" \
    -H 'Content-Type: application/json' \
    -d "{\"model\":\"${model}\",\"messages\":[{\"role\":\"user\",\"content\":\"${TEST_PROMPT}\"}],\"max_tokens\":${MAX_TOKENS}}" 2>&1)
  
  local exit_code=$?
  local end_time=$(date +%s)
  local latency=$((end_time - start_time))
  latency=$((latency * 1000))  # Convert to milliseconds
  
  # Parse response
  local status="❌ FAILED"
  local content=""
  local error=""
  
  if [ $exit_code -eq 0 ]; then
    # Check if response contains error
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
      error=$(echo "$response" | jq -r '.error.message // .error' 2>/dev/null || echo "Unknown error")
      status="❌ ERROR"
      echo -e "   ${RED}✗${NC} Error: ${error}"
    elif echo "$response" | jq -e '.choices[0].message.content' > /dev/null 2>&1; then
      content=$(echo "$response" | jq -r '.choices[0].message.content' 2>/dev/null | head -c 50)
      status="✅ OK"
      echo -e "   ${GREEN}✓${NC} ${latency}ms — ${content}..."
    else
      error="Invalid response format"
      status="❌ INVALID"
      echo -e "   ${RED}✗${NC} Invalid response"
    fi
  else
    error="Timeout or connection error"
    status="❌ TIMEOUT"
    echo -e "   ${RED}✗${NC} Timeout (${TIMEOUT}s)"
  fi
  
  # Append to output file
  echo "| ${index} | ${model} | ${status} | ${latency}ms | ${content} | ${error} |" >> "$OUTPUT_FILE"
  
  # Return status code
  if [ "$status" = "✅ OK" ]; then
    return 0
  else
    return 1
  fi
}

# Main testing loop
total_tested=0
total_success=0
total_failed=0

for i in "${!UNTESTED_MODELS[@]}"; do
  if [ $total_tested -ge $BATCH_SIZE ]; then
    echo -e "\n${YELLOW}⚠ Batch limit reached (${BATCH_SIZE} models)${NC}"
    break
  fi
  
  model="${UNTESTED_MODELS[$i]}"
  index=$((i + 1))
  
  if test_model "$model" "$index"; then
    ((total_success++))
  else
    ((total_failed++))
  fi
  
  ((total_tested++))
  
  # Small delay between requests
  sleep 0.5
done

# Update summary in output file
sed -i '' "s/Total models tested: 0/Total models tested: ${total_tested}/" "$OUTPUT_FILE"

# Calculate percentages
success_pct=0
failed_pct=0
if [ $total_tested -gt 0 ]; then
  success_pct=$(( total_success * 100 / total_tested ))
  failed_pct=$(( total_failed * 100 / total_tested ))
fi

# Append summary
cat >> "$OUTPUT_FILE" << EOF

---

## Summary

- **Total tested:** ${total_tested} / ${#UNTESTED_MODELS[@]}
- **Success:** ${total_success} (${success_pct}%)
- **Failed:** ${total_failed} (${failed_pct}%)
- **Remaining:** $(( ${#UNTESTED_MODELS[@]} - total_tested ))

---

**Generated:** $(date '+%Y-%m-%d %H:%M:%S')
EOF

# Final report
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Test Complete                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✓ Tested:${NC} ${total_tested} models"
echo -e "${GREEN}✓ Success:${NC} ${total_success} (${success_pct}%)"
echo -e "${RED}✗ Failed:${NC} ${total_failed} (${failed_pct}%)"
echo -e "${YELLOW}⏳ Remaining:${NC} $(( ${#UNTESTED_MODELS[@]} - total_tested ))"
echo ""
echo -e "${BLUE}📄 Results saved to:${NC} ${OUTPUT_FILE}"
echo ""

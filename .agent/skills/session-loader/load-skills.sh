#!/bin/bash
# Session Loader — Load skills and MCP servers based on current phase
# Usage: ./load-skills.sh [phase]

PHASE="$1"
CURRENT_YAML=".state/current.yaml"
PHASE_SKILLS_JSON=".agent/skills/session-loader/data/phase-skills.json"

# Determine phase
if [ -z "$PHASE" ]; then
  if [ -f "$CURRENT_YAML" ]; then
    PHASE=$(grep "step:" "$CURRENT_YAML" | awk '{print $2}')
    echo "📍 Detected phase from current.yaml: $PHASE"
  else
    PHASE="default"
    echo "⚠️  No current.yaml found, using default phase"
  fi
fi

echo "🔧 Session Loader — Phase: $PHASE"
echo ""

# Load phase configuration
if command -v jq &> /dev/null; then
  SKILLS=$(jq -r ".\"$PHASE\".skills[]" "$PHASE_SKILLS_JSON" 2>/dev/null || jq -r '.default.skills[]' "$PHASE_SKILLS_JSON")
  MCP=$(jq -r ".\"$PHASE\".mcp[]" "$PHASE_SKILLS_JSON" 2>/dev/null || jq -r '.default.mcp[]' "$PHASE_SKILLS_JSON")
else
  echo "⚠️  jq not installed, using default skills"
  SKILLS="notebooklm-kb skillful vibeguard"
  MCP="supermemory"
fi

# Load skills metadata
echo "📚 Loading skills:"
for skill in $SKILLS; do
  if [ -f ".agent/skills/$skill/SKILL.md" ]; then
    echo "  ✅ $skill"
    # Extract metadata (first 10 lines of YAML frontmatter)
    head -10 ".agent/skills/$skill/SKILL.md" | grep -E "^(name|description|tags):" || true
  else
    echo "  ⚠️  $skill (not found)"
  fi
done
echo ""

# Check MCP servers
echo "🔌 Checking MCP servers:"
for server in $MCP; do
  STATUS=$(opencode mcp list 2>&1 | grep -i "$server" | grep -o "connected\|needs authentication" || echo "not found")
  if [ "$STATUS" = "connected" ]; then
    echo "  ✅ $server: connected"
  else
    echo "  ⚠️  $server: $STATUS"
  fi
done
echo ""

# RAM check
echo "💾 RAM Status:"
RAM=$(curl -s http://localhost:3001/ram 2>/dev/null)
if [ -n "$RAM" ]; then
  echo "$RAM" | jq -r '"  Free: \(.free_mb)MB | \(.recommendation)"' 2>/dev/null || echo "  $RAM"
else
  echo "  ⚠️  RAM endpoint unavailable"
fi
echo ""

echo "✅ Session preparation complete"
echo "📝 Next: Execute SESSION-START-PROTOCOL.md steps 1-3"

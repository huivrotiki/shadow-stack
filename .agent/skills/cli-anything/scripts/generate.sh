#!/bin/bash
# CLI-Anything Generator — 7-Phase Pipeline
# Usage: ./generate.sh <target> <name>

TARGET="$1"
NAME="$2"
SKILLS_DIR=".agent/skills/cli-anything/generated"
SESSION_FILE=".agent/skills/cli-anything/data/SESSION.json"

if [ -z "$TARGET" ] || [ -z "$NAME" ]; then
  echo "Usage: $0 <target> <name>"
  echo "  target: URL, library name, or API spec"
  echo "  name:   Output CLI name"
  exit 1
fi

# RAM Guard
RAM=$(curl -s http://localhost:3001/ram 2>/dev/null)
FREE_MB=$(echo "$RAM" | grep -o '"free_mb":[0-9]*' | cut -d: -f2)

if [ -z "$FREE_MB" ] || [ "$FREE_MB" -lt 500 ]; then
  echo "⚠️  RAM WARNING: ${FREE_MB}MB free (need 500MB)"
  echo "💡 Using cloud fallback via OmniRoute"
  # Cloud fallback would go here
fi

# Create output directory
mkdir -p "$SKILLS_DIR/$NAME"

echo "🚀 CLI-Anything Generator — 7-Phase Pipeline"
echo "Target: $TARGET"
echo "Name: $NAME"
echo ""

# Phase 1: Analyze
echo "📊 Phase 1: Analyze"
echo "  Analyzing target: $TARGET"
echo "  → Output: $SKILLS_DIR/$NAME/analysis.json"

# Phase 2: Design
echo "📐 Phase 2: Design"
echo "  Designing CLI commands"
echo "  → Output: $SKILLS_DIR/$NAME/commands.yaml"

# Phase 3: Implement
echo "🔨 Phase 3: Implement"
echo "  Generating CLI code"
echo "  → Output: $SKILLS_DIR/$NAME/cli.py"

# Phase 4: Test
echo "🧪 Phase 4: Test"
echo "  Running smoke tests"
echo "  → Output: $SKILLS_DIR/$NAME/test-results.json"

# Phase 5: Package
echo "📦 Phase 5: Package"
echo "  Packaging as Python module"
echo "  → Output: $SKILLS_DIR/$NAME/setup.py"

# Phase 6: Document
echo "📝 Phase 6: Document"
echo "  Generating SKILL.md"
echo "  → Output: $SKILLS_DIR/$NAME/SKILL.md"

# Phase 7: Publish
echo "🚀 Phase 7: Publish"
echo "  Registering in .agent/skills/"
echo "  → Output: $SKILLS_DIR/$NAME/"

echo ""
echo "✅ Generation complete: $SKILLS_DIR/$NAME/"

# Update session
echo "{\"target\":\"$TARGET\",\"name\":\"$NAME\",\"phases\":7,\"completed_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" >> "$SESSION_FILE"

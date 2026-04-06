#!/bin/bash
# Fallback: search in local notebooks when NotebookLM API fails

QUERY="$1"
NOTEBOOKS_DIR="notebooks/shadow-stack"

if [ -z "$QUERY" ]; then
  echo "Usage: $0 \"<query>\""
  exit 1
fi

echo "🔍 Searching local notebooks for: $QUERY"
echo ""

# Search in all markdown files
grep -r -i "$QUERY" "$NOTEBOOKS_DIR" --include="*.md" -n -C 2 | head -50

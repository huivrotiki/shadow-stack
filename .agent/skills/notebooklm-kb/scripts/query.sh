#!/bin/bash
# Query NotebookLM knowledge base with Supermemory fallback
# Usage: ./query.sh "your question" [notebook_id]

QUERY="$1"
NOTEBOOK_ID="${2:-489988c4-0293-44f4-b7c7-ea1f86a08410}"
PROJECT_DIR="$(cd "$(dirname "$0")/../../../.." && pwd)"

if [ -z "$QUERY" ]; then
  echo "Usage: $0 \"<query>\" [notebook_id]"
  exit 1
fi

# Step 1: Try NotebookLM API
echo "🔍 Querying NotebookLM..."
if [ -f "$HOME/.venv/notebooklm/bin/notebooklm" ]; then
  NOTEBOOKLM_OUTPUT=$("$HOME/.venv/notebooklm/bin/notebooklm" ask "$QUERY" 2>&1)
  
  if [ $? -eq 0 ] && [ -n "$NOTEBOOKLM_OUTPUT" ]; then
    echo "✅ NotebookLM response:"
    echo "$NOTEBOOKLM_OUTPUT"
    exit 0
  fi
  
  echo "⚠️ NotebookLM failed or returned empty result"
else
  echo "⚠️ NotebookLM CLI not found at $HOME/.venv/notebooklm/bin/notebooklm"
fi

# Step 2: Fallback to Supermemory MCP
echo "🔄 Falling back to Supermemory MCP..."
if command -v npx &> /dev/null; then
  SUPERMEMORY_OUTPUT=$(npx -y mcp-remote https://api.supermemory.ai/mcp 2>/dev/null << EOF
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"searchMemories","arguments":{"informationToGet":"$QUERY"}}}
EOF
)
  
  if [ $? -eq 0 ] && [ -n "$SUPERMEMORY_OUTPUT" ]; then
    echo "✅ Supermemory response:"
    echo "$SUPERMEMORY_OUTPUT"
    exit 0
  fi
  
  echo "⚠️ Supermemory MCP failed"
else
  echo "⚠️ npx not available"
fi

# Step 3: Fallback to local notebooks
echo "📚 Searching local notebooks..."
if [ -d "$PROJECT_DIR/notebooks" ]; then
  LOCAL_RESULTS=$(grep -r "$QUERY" "$PROJECT_DIR/notebooks/" --include="*.md" 2>/dev/null | head -10)
  
  if [ -n "$LOCAL_RESULTS" ]; then
    echo "✅ Found in local notebooks:"
    echo "$LOCAL_RESULTS"
    exit 0
  fi
  
  echo "⚠️ No results in local notebooks"
else
  echo "⚠️ Local notebooks directory not found at $PROJECT_DIR/notebooks"
fi

# Step 4: All fallbacks failed
echo "❌ No results found from any source"
echo ""
echo "Sources tried:"
echo "  1. NotebookLM API ($NOTEBOOK_ID)"
echo "  2. Supermemory MCP"
echo "  3. Local notebooks ($PROJECT_DIR/notebooks/)"
echo ""
echo "Suggestions:"
echo "  - Check internet connection"
echo "  - Verify NotebookLM CLI: ~/.venv/notebooklm/bin/notebooklm list"
echo "  - Check Supermemory MCP: opencode mcp list"
echo "  - Add content to notebooks/ directory"

exit 1

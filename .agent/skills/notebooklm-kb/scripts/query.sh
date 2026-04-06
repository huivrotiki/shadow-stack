#!/bin/bash
# Query NotebookLM knowledge base
# Usage: ./query.sh "your question"

QUERY="$1"
NOTEBOOK_ID="${2:-489988c4-0293-44f4-b7c7-e}"

if [ -z "$QUERY" ]; then
  echo "Usage: $0 \"<query>\" [notebook_id]"
  exit 1
fi

# Try to query (notebook should be already selected via notebooklm use)
~/.venv/notebooklm/bin/notebooklm ask "$QUERY"

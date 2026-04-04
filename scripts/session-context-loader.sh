#!/usr/bin/env bash
# session-context-loader.sh
# Runs at SessionStart. Emits a block that gets injected as additionalContext
# into the session. Pulls:
#   1. NotebookLM notebooks list (read-only, offline-safe)
#   2. Supermemory reminder (actual recall happens via MCP tool in-session)
#   3. Current .state/ summary
#
# Fail-open: if any source is unavailable, continue silently.

set +e  # never block session start

ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
NOTEBOOKLM="$HOME/.venv/notebooklm/bin/notebooklm"

echo "# 🧠 Knowledge Sources (auto-loaded at session start)"
echo ""

# ─── Supermemory ──────────────────────────────────────────────────────────
echo "## Supermemory MCP"
echo "ALWAYS available in this session via tools:"
echo "- \`mcp__mcp-supermemory-ai__recall\` — semantic recall from long-term memory"
echo "- \`mcp__mcp-supermemory-ai__memory\` — write new memories"
echo "- \`mcp__mcp-supermemory-ai__listProjects\` — list memory projects"
echo ""
echo "**Rule:** before answering non-trivial questions, call \`recall\` with the user's query"
echo "to pull relevant prior context. Write new insights back with \`memory\`."
echo ""

# ─── NotebookLM ───────────────────────────────────────────────────────────
echo "## NotebookLM Knowledge Base"
if [ -x "$NOTEBOOKLM" ]; then
  echo "CLI available at \`$NOTEBOOKLM\`. Notebooks:"
  echo '```'
  "$NOTEBOOKLM" list 2>/dev/null | sed -n '1,25p' || echo "(notebooklm list failed — check auth: notebooklm login)"
  echo '```'
  echo ""
  echo "**Rule:** when the user's question touches project architecture, LLM mesh,"
  echo "Shadow Stack design, or NVIDIA/agent-factory topics, run:"
  echo "\`$NOTEBOOKLM ask \"<query>\"\` against the active notebook before answering."
else
  echo "(notebooklm CLI not found at $NOTEBOOKLM — skip)"
fi
echo ""

# ─── State summary ────────────────────────────────────────────────────────
if [ -f "$ROOT/.state/current.yaml" ]; then
  echo "## Active .state/"
  echo '```yaml'
  grep -E "^(project|active_runtime|updated):|^  (phase|step|next|branch|last_commit):" \
    "$ROOT/.state/current.yaml" 2>/dev/null | head -15
  echo '```'
fi

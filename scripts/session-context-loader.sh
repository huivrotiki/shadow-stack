#!/usr/bin/env bash
# session-context-loader.sh
# Runs at SessionStart. Emits a block that gets injected as additionalContext
# into the session. Pulls:
#   1. AI.MD — Master AI rules (NEW)
#   2. NotebookLM notebooks list (read-only, offline-safe)
#   3. Supermemory reminder (actual recall happens via MCP tool in-session)
#   4. Current .state/ summary
#   5. RAM check
#   6. Available skills
#
# Fail-open: if any source is unavailable, continue silently.

set +e  # never block session start

ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
NOTEBOOKLM="$HOME/.venv/notebooklm/bin/notebooklm"

echo "# 🧠 Knowledge Sources (auto-loaded at session start)"
echo ""

# ─── AI.MD Master Rules ───────────────────────────────────────────────────
echo "## AI.MD — Master AI Rules"
if [ -f "$ROOT/AI.MD" ]; then
  echo "✅ Master rules loaded from \`AI.MD\`"
  echo ""
  echo "**Key protocols:**"
  echo "- Memory First: Call Supermemory + NotebookLM before each phase"
  echo "- Ralph Loop: IDLE → [MEMORY] → READ → [SKILLS] → PLAN → [MCP] → EXEC → TEST → COMMIT → [SAVE] → SYNC"
  echo "- RAM Guard: Check before heavy operations"
  echo "- Skills Discovery: Find relevant skills before tasks"
  echo ""
else
  echo "⚠️ AI.MD not found — using default protocols"
  echo ""
fi

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
  echo "CLI available at \`$NOTEBOOKLM\`."
  echo ""
  echo "**Active notebook:**"
  echo '```'
  "$NOTEBOOKLM" status 2>/dev/null | sed -n '1,12p' || echo "(no active notebook set — run: notebooklm use <id>)"
  echo '```'
  echo ""
  echo "**All notebooks:**"
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

# ─── RAM Guard ────────────────────────────────────────────────────────────
echo "## RAM Status"
if command -v curl &>/dev/null; then
  RAM_STATUS=$(curl -s http://localhost:3001/ram 2>/dev/null || echo '{"free_mb":-1}')
  FREE_MB=$(echo "$RAM_STATUS" | grep -o '"free_mb":[0-9]*' | cut -d':' -f2)
  if [ "$FREE_MB" -gt 0 ]; then
    echo "Free RAM: ${FREE_MB}MB"
    if [ "$FREE_MB" -lt 200 ]; then
      echo "⚠️ CRITICAL: RAM < 200MB — cloud-only mode"
    elif [ "$FREE_MB" -lt 500 ]; then
      echo "⚠️ WARNING: RAM < 500MB — avoid browser, use ollama-3b only"
    else
      echo "✅ SAFE: All models available"
    fi
  fi
fi
echo ""

# ─── Available Skills ─────────────────────────────────────────────────────
echo "## Available Skills"
if [ -d "$ROOT/.agent/skills" ]; then
  SKILL_COUNT=$(find "$ROOT/.agent/skills" -name "SKILL.md" 2>/dev/null | wc -l | tr -d ' ')
  echo "Found $SKILL_COUNT skills in \`.agent/skills/\`"
  echo ""
  echo "**Rule:** Before complex tasks, check for relevant skills:"
  echo "\`find .agent/skills -name 'SKILL.md' | xargs grep -l '<keyword>'\`"
fi
echo ""


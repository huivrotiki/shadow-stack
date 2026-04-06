# SKILL: NotebookLM Knowledge Base
**ID**: `notebooklm-kb`
**Load**: On knowledge queries about Shadow Stack, architecture, LLM mesh, agent factory, Claude Code best practices

## PURPOSE
Queries NotebookLM notebooks for context, best practices, and documentation with automatic 3-tier fallback to Supermemory MCP and local notebooks.

## TRIGGERS
- "спроси notebooklm"
- "найди в базе знаний"
- "что говорит notebooklm"
- "knowledge query"
- "RAG search"
- "query notebook"
- Architecture questions about Shadow Stack
- LLM mesh / routing decisions
- Agent factory / ZeroClaw questions
- Claude Code best practices

## EXECUTION

### Primary: NotebookLM CLI
```bash
# List all notebooks
~/.venv/notebooklm/bin/notebooklm list

# Query with automatic Supermemory fallback (recommended)
.agent/skills/notebooklm-kb/scripts/query.sh "<query>"

# Get summary
~/.venv/notebooklm/bin/notebooklm summary
```

### Secondary: Supermemory MCP (automatic fallback in query.sh)
If NotebookLM API fails, query.sh automatically falls back to Supermemory MCP.

### Tertiary: Local notebooks (manual)
```bash
# Search local notebooks
.agent/skills/notebooklm-kb/scripts/fallback-search.sh "<query>"
```

### Last resort: Web UI
Open in browser: https://notebooklm.google.com/notebook/489988c4-0293-44f4-b7c7-ea1f86a08410

## PRIMARY NOTEBOOK
**ID:** 489988c4-0293-44f4-b7c7-ea1f86a08410
**Title:** Автономный стек разработки на Mac mini M1 8GB
**URL:** https://notebooklm.google.com/notebook/489988c4-0293-44f4-b7c7-ea1f86a08410

## ALL NOTEBOOKS
| ID | Title | Purpose |
|---|---|---|
| 489988c4 | Автономный стек разработки | Shadow Stack architecture |
| d981aeb7 | The LLM Mesh | Enterprise agentic architecture |
| c91a4b87 | Shadow stack под управлением DEER FLOW | Agent factory |
| 1930368e | Claude Code: Полное руководство | Claude Code best practices |
| 5f813fa5 | NVIDIA GTC 2026 | NVIDIA announcements |

## FALLBACK STRATEGY (3-tier)
1. **NotebookLM CLI** — query.sh (automatic Supermemory fallback)
2. **Supermemory MCP** — when NotebookLM fails (built into query.sh)
3. **Local notebooks** — grep in notebooks/ directory
4. **Web UI** — manual check via browser

## EXAMPLES
```bash
# Architecture question (with auto-fallback)
.agent/skills/notebooklm-kb/scripts/query.sh "How does ZeroClaw orchestration work?"

# Routing question
.agent/skills/notebooklm-kb/scripts/query.sh "What provider cascade is used?"

# Best practices
.agent/skills/notebooklm-kb/scripts/query.sh "How to properly handoff between runtimes?"

# Direct notebook search
.agent/skills/notebooklm-kb/scripts/fallback-search.sh "RAM Guard"
```

## KNOWN ISSUES
- CLI `notebooklm ask` sometimes returns RPC errors — query.sh automatically falls back to Supermemory
- Supermemory MCP requires OAuth authorization — browser opens on first run
- Web UI always works as last resort fallback

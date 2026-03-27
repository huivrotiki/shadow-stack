# SuperLocalMemory V3 — Local Agent Memory

## Overview

Zero-cloud AI agent memory with mathematical foundations. Works offline, no API keys required.

**Mode:** A (Local Guardian) — all processing stays on your machine

**Config:** `/Users/work/.superlocalmemory/config.json`
**Database:** `/Users/work/.superlocalmemory/memory.db`

## CLI Usage

```bash
# Remember a fact
python3 -m superlocalmemory.cli.main remember "Project uses PostgreSQL 16" --tags "database"

# Recall (semantic search)
python3 -m superlocalmemory.cli.main recall "which database does project use"

# List memories
python3 -m superlocalmemory.cli.main list -n 20

# Health check
python3 -m superlocalmemory.cli.main health

# Status
python3 -m superlocalmemory.cli.main status
```

## MCP Server (for IDEs)

```bash
python3 -m superlocalmemory.cli.main mcp
```

## Quick Test

```bash
python3 -m superlocalmemory.cli.main status
python3 -m superlocalmemory.cli.main remember "Test memory from Shadow Stack setup"
python3 -m superlocalmemory.cli.main recall "Shadow Stack"
```

## Skills

Available tools:
- `remember` — store memory with auto-tagging
- `recall` — 4-channel semantic retrieval
- `forget` — fuzzy delete by query
- `list` — recent memories
- `trace` — per-channel score breakdown

## Notes

- RAM usage: ~20-50MB steady state
- Embedding model: nomic-embed-text-v1.5 (~500MB on first use)
- 27 MCP tools available when running in MCP mode

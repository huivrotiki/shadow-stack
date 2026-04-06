# Session Start Hook

Runs automatically at the start of every Kiro session.

## Steps (execute in order, no skipping)

1. Read `.kiro/steering/shadow-stack.md`

2. Recall Supermemory context:
   - mcp__mcp-supermemory-ai__recall("shadow stack current state services ports")
   - mcp__mcp-supermemory-ai__recall("ecosystem dotenv hardcode PM2 setup")

3. Read state files:
   - `.state/current.yaml` → check lock_until (if future → ask user)
   - `.state/todo.md` → identify next open task
   - `handoff.md` → last known state

4. Check RAM: GET http://localhost:3001/ram
   - free_mb < 400 → cloud only, skip Ollama tasks
   - free_mb < 200 → ABORT, notify user

5. Report to user:
   - Lock status
   - Next open task from todo.md
   - RAM status
   - Last handoff summary (1-2 lines)

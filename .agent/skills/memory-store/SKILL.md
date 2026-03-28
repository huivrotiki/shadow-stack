---
name: memory-store
description: Save new knowledge to Shadow Stack project memory (ChromaDB + Ollama nomic-embed-text). Use AFTER fixing bugs, making architecture decisions, or discovering important patterns.
---

# Memory Store Skill

## When to Use
- After fixing a complex bug → store the fix for future sessions
- After making an architecture decision → record the reasoning
- After discovering a gotcha or workaround → save it
- After refactoring → document what changed and why

## How to Call

```javascript
const { smartStore } = await import('./scripts/memory-mcp.js');
const result = await smartStore(
  "Description of what was learned or fixed",
  { source: "filename.js", tags: "bugfix,websocket", type: "fix" }
);
// result: {stored: N, collection: "shadow-stack-memory"} or null
```

## Fallback
If ChromaDB is not running, the function returns `null` gracefully.

## Example
```javascript
// After fixing a port conflict:
await smartStore(
  "LiteLLM must run on port 4001, NOT 4000. Port 4000 is used by the Telegram bot. " +
  "Conflict causes both services to fail silently.",
  { source: "server/index.js", tags: "port,litellm,bot", type: "gotcha" }
);
```

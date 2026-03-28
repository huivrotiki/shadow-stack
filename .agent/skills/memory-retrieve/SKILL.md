---
name: memory-retrieve
description: Search Shadow Stack project memory (ChromaDB + Ollama nomic-embed-text). Use BEFORE any complex task to find past bugs, architecture decisions, or context.
---

# Memory Retrieve Skill

## When to Use
- Before fixing a complex bug → search for past similar issues
- Before architectural changes → find existing patterns
- Before refactoring → check if similar work was done
- When context from past sessions is needed

## How to Call

```javascript
const { smartRetrieve } = await import('./scripts/memory-mcp.js');
const results = await smartRetrieve("your search query", 3);
// results: [{text, score, metadata}, ...] or null if ChromaDB unavailable
```

## Fallback
If ChromaDB is not running, the function returns `null` gracefully — it never breaks the pipeline.

## Example
```javascript
// Before fixing a WebSocket bug:
const context = await smartRetrieve("WebSocket connection drops after 5 minutes");
if (context) {
  console.log("Found relevant context:", context.map(r => r.text));
}
```

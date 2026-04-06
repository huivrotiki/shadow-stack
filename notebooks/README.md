# Notebooks — Session Memory Layer

Markdown-based session logs. Indexed by project + tags.
Synced to Supermemory via `memory.syncToSupermemory()`.

## Structure
- `shadow-stack/` — shadow-stack sessions
- `agent-factory/` — agent-factory sessions
- `_template.md` — session template

## Usage (CJS)
```js
const memory = require('../agent-factory/factory/memory.cjs');
await memory.save({ project: 'shadow-stack', title: 'Phase R3', body: '...', tags: ['memory', 'r3'] });
const results = await memory.query({ project: 'shadow-stack', tag: 'memory' });
```

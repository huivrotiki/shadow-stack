# Decisions Log

> Agent appends a new entry each iteration.

### 2026-03-27 — Task: A1
- **Why chosen:** First task in Phase A, no dependencies. Foundation for all config access.
- **Approach:** Manual .env parser (no dotenv dep). Priority: process.env > .env file > defaults. Exports plain object.
- **Files changed:** server/lib/config.cjs (new)
- **Verify result:** PASS — typecheck clean, lint clean, test 1/1 passed
- **Blockers:** none

### 2026-03-27 — Task: A2
- **Why chosen:** A1 done, A2 depends on A1. Logger needed before router engine.
- **Approach:** JSONL append to data/logs/app.jsonl. Level filtering via config.LOG_LEVEL. Creates dir if missing.
- **Files changed:** server/lib/logger.cjs (new)
- **Verify result:** PASS — typecheck clean, lint clean, test 1/1 passed. Log entry verified in data/logs/app.jsonl.
- **Blockers:** none

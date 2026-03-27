# Decisions Log

> Agent appends a new entry each iteration.

### 2026-03-27 — Task: A1
- **Why chosen:** First task in Phase A, no dependencies. Foundation for all config access.
- **Approach:** Manual .env parser (no dotenv dep). Priority: process.env > .env file > defaults. Exports plain object.
- **Files changed:** server/lib/config.cjs (new)
- **Verify result:** PASS — typecheck clean, lint clean, test 1/1 passed
- **Blockers:** none

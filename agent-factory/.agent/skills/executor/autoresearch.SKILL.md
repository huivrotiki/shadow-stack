# AutoResearch Skill

## Purpose
Run autonomous optimization loops on a single editable target file while preserving an untouchable evaluation script. Implements Karpathy AutoResearch pattern.

## Pattern
Three-file architecture:
- `program.md` — goal + constraints (IMMUTABLE)
- `train.js` — the only file you modify (EDITABLE)
- `evaluate.js` — metric definition (IMMUTABLE)

## Loop
1. Read scalar metric from `evaluate.js` output
2. Propose one small hypothesis: "If I change X, metric Y will improve"
3. Modify `train.js` ONLY
4. Re-run evaluation: `node evaluate.js` → capture scalar metric
5. If metric improved → git commit `autoloop: +{delta}`
6. If metric degraded → `git checkout train.js` (revert)
7. Repeat up to 10 iterations or until metric plateaus

## Allowed Metrics
- `latency_ms` → lower is better
- `success_rate` (0.0–1.0) → higher is better
- `ralph_loop_score` → target >= 0.8
- `fallback_rate` (%) → lower is better
- `pass_rate` (%) → target 100%
- `memory_usage_mb` → lower is better

## Stop Condition
3 consecutive iterations with <2% improvement.

## Logging
Log every iteration to `factory/logs/autoloop.json`:
```json
{
  "iteration": 1,
  "hypothesis": "If I change X, metric Y will improve",
  "metric_before": 0.75,
  "metric_after": 0.82,
  "delta": 0.07,
  "committed": true
}
```

## NotebookLM Integration (Pre-Step)
Before each hypothesis, query NotebookLM:
"What prior decisions or evidence suggest the most promising optimization target?"
Use source-grounded facts to guide hypothesis selection.

## Forbidden
- Editing `evaluate.js`
- Editing metric definitions
- Inflating score without real improvement
- Modifying `program.md`
- Committing without Auditor check

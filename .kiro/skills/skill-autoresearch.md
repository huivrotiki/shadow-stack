---
name: autoresearch
description: AutoResearch Ralph Loop — self-improving prompt optimization
trigger: keywords [autoresearch, ralph loop, loop.js, hypothesis, metric, fine-tune]
---

## Skill: AutoResearch Loop

### Quick Start
```bash
# With RAM guard
bash scripts/autoresearch-run.sh 20

# Direct
node autoresearch/loop.js 20
```

### Loop Architecture
```
proposeHypothesis(omni-sonnet)
  → evaluate.js × 3 runs × 5 topics
  → score = avg(topic_coverage)
  → if score > prev + 0.01 → git commit
  → if score >= 0.85 → notebookLMHandoff
  → max 20 iter | $2 budget cap
```

### Model Selection
```js
task_len < 300   → gr-llama70b  // fast eval
task_len < 1500  → ms-small     // balanced
task_len >= 1500 → omni-sonnet  // hypothesis gen
```

### Output
- Commits: `feat(autoresearch): metric X.XX → Y.YY`
- Handoff: `knowledge/autoresearch-YYYY-MM-DD.md`
- Registry: append to `knowledge/working-combos.md`

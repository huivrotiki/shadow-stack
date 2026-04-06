# AutoResearch Program — Shadow Stack

## Goal
Optimize the system prompt for the Telegram bot to maximize correct answers on the eval set.

## Rules
- Agent may ONLY edit: `autoresearch/train.py` (or the target file defined below)
- Agent must NEVER edit: `autoresearch/evaluate.js`, `autoresearch/program.md`
- One hypothesis per iteration
- Commit only if metric improves by ≥ 1%

## Target File
`bot/system-prompt.txt` — the Telegram bot system prompt

## Success Criterion
metric > 0.85 (85% correct answers on eval set)

## Constraints
- Max 20 iterations per run
- Max $2 budget per run (monitored via Vercel AI Gateway)
- Use omni router for hypothesis generation (tier: balanced or smart)

# ORCHESTRATOR.md — Shadow Stack Telegram Control Plane

## Architecture

Telegram Bot (`bot/opencode-telegram-bridge.cjs`) is the single control point for all operations.
It works autonomously — no Claude session required.

## HITL Protocol

Every risky action goes through Human-in-the-Loop approval:

1. Bot sends message with action details + inline keyboard [Approve] [Reject]
2. User taps Approve → action executes, prd.json updated
3. User taps Reject → action cancelled, task marked failed
4. No response in 5 min (autorun mode) → skip task, move to next

## Task Queue (prd.json)

```
/plan        — view all tasks with status
/next        — execute next pending task
/autorun start — autonomous loop (30s intervals)
/autorun stop  — halt loop
/autorun status — current progress
```

Task statuses: `pending` → `in-progress` → `passes` / `failed`

## Delegation

```
/delegate <prompt>  — auto-route to cheapest model
```

Tier routing:
- `fast` (< 300 chars): Ollama qwen2.5-coder:3b (local, $0)
- `balanced` (300-1500 chars): Gemini 2.0 Flash ($0)
- `smart` (code / > 1500 chars): Groq Llama 3.3 70B ($0)
- Fallback: OpenRouter DeepSeek R1 (free tier)

## External Telegram Bots (Group Delegation)

| Bot | Purpose | Command |
|-----|---------|---------|
| @chatgpt_gidbot | General Q&A, fallback | /ask-gpt |
| @deepseek_gidbot | Code analysis, reasoning | /ask-deepseek |
| Uniset AI | Design generation | manual |
| BrainAid | Search + summarization | manual |
| Syntx AI | Code analytics | manual |
| REELY | Video generation | manual |

## Cascade Order

1. Ollama 3B (local)
2. Gemini Flash (free API)
3. Groq Llama 70B (free API)
4. OpenRouter free models
5. Alibaba Qwen-Max (free API)
6. Ollama 7B (local, heavier)
7. Telegram escalation (@chatgpt_gidbot → @deepseek_gidbot)

## Approval Levels

| Risk | Auto-approve | Example |
|------|-------------|---------|
| low | yes (in autorun) | Status check, info query |
| medium | ask user | Code generation, file changes |
| high | always ask | git push, deploy, delete |

## Ports

| Service | Port |
|---------|------|
| Express API | 3001 |
| Telegram Bot | 4000 |
| LiteLLM Proxy | 4001 |
| Shadow Router | 3002 |
| Ollama | 11434 |
| Dashboard | 5176 |
| OpenClaw | 18789 |

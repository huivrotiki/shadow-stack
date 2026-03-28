# Telegram Bots Reference

## Internal (Shadow Stack Group)

| Bot | Username | Purpose | Trigger |
|-----|----------|---------|---------|
| ChatGPT Bot | @chatgpt_gidbot | General Q&A, cascade fallback | /ask-gpt, auto-escalation |
| DeepSeek Bot | @deepseek_gidbot | Code reasoning, analysis | /ask-deepseek |

## External (Manual Delegation)

| Bot | Purpose | Best For |
|-----|---------|----------|
| Uniset AI | Design generation | UI mockups, logos, banners |
| BrainAid | Web search + summarization | Research, fact-checking |
| Syntx AI | Code analytics | Repo analysis, code review |
| MazAI | Data analytics | Charts, data processing |
| REELY | Video generation | Short clips, demos |

## Usage from Shadow Stack Bot

```
/ask-gpt <question>       — forward to @chatgpt_gidbot in group
/ask-deepseek <question>  — forward to @deepseek_gidbot in group
/warm <question>           — Telegram escalation (last resort)
/escalate <question>       — cascade + Telegram fallback
```

## Group ID

Group: `-1002107442654`
All bot-to-bot communication happens in this group.

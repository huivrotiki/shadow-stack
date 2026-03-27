# CASCADE Skill — Tier Routing

## Overview
6-tier cascade для автоматического выбора LLM-провайдера

## chooseTier() Logic

| Условие | Tier | Provider |
|---------|------|----------|
| msg.length < 300 | fast | Gemini → Groq → Ollama:3b |
| 300 ≤ msg.length ≤ 1500 | balanced | Gemini → Groq → OpenRouter |
| msg.length > 1500 или /code | smart | OpenAI → Gemini → DeepSeek |
| /premium | premium | Claude Sonnet 4.5 (PAID) |

## Providers Priority

1. **Gemini 2.0 Flash** — free 1500/day, GEMINI_API_KEY
2. **Groq Llama 70B** — free 30/min, GROQ_API_KEY
3. **OpenRouter DeepSeek** — free, OPENROUTER_API_KEY
4. **Alibaba Qwen-Max** — free, ALIBABA_API_KEY
5. **OpenAI GPT-4o** — paid, OPENAI_API_KEY
6. **@chatgpt_gidbot** — FREE GPT-4o через Telegram
7. **@deepseek_gidbot** — FREE DeepSeek через Telegram
8. **Ollama qwen2.5:3b** — local 0$, last resort

## Alias Commands

- /fast → ollama-3b
- /balanced → gemini-flash  
- /smart → openai
- /premium → claude-sonnet

## Usage
```
/ai <question> → auto-cascade
/gemini <question> → force Gemini
/groq <question> → force Groq
/premium <question> → Claude Sonnet
```

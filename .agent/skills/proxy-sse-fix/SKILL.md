# Skill: Proxy SSE Fix & OmniRoute Provider Verification

## Цель
Верифицировать что free-models-proxy.cjs корректно отдаёт
text/event-stream для AI SDK клиентов (opencode).
OmniRoute (KiroAI) = Tier 1 бесплатный Claude Sonnet 4.5.

## Порты
20129 — free-models-proxy (Shadow Proxy)
20130 — OmniRoute (KiroAI) ← реальный порт (не 20128!)

## Tier CASCADE_CHAIN
Tier 1: omni-sonnet (Claude Sonnet 4.5 FREE via KiroAI)
Tier 2: gr-llama70b → gr-qwen3-32b → ds-v3 → gem-2.5-flash → or-step-flash
Tier 3: sn-llama70b → hf-qwen72b → hf-llama70b
Tier 4: ol-qwen2.5-coder (RAM > 500MB only)

## RAM Guard
free_mb < 300 → только cloud providers, НЕ запускать ollama

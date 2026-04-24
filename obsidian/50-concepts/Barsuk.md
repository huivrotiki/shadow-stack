---
title: Barsuk
date: 2026-04-24
tags: [concept, model]
---

# Barsuk

Super model for Shadow Stack. Provides 140+ models via free-models-proxy on port :20129.

## Details

- **Base URL**: `http://localhost:20129/v1`
- **Provider**: `@ai-sdk/openai-compatible`
- **Default model**: `barsuk` (all 139 models)
- **Special models**: `combo-race` (3 fastest)

## Included Model Families

- OpenAI: `oa-gpt-4o`, `oa-gpt-5*`
- Anthropic: `ant-haiku`, `ant-sonnet`, `ant-opus`
- Google: `gem-*`, `gl-*`
- Meta: `ol-*`, `hf-llama*`
- Chinese: `gr-qwen*`, `kc-qwen3*`
- Others: `ds-*`, `nv-*`, `or-*`, `vg-*`, `zen-*`

## Usage

```bash
curl http://localhost:20129/v1/models
```

Configured in `opencode.json` as `shadow/barsuk`.

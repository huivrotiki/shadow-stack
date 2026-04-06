# RALPH Loop x5 — New Providers Benchmark
**Date:** 2026-04-05 · **Project:** shadow-stack · **Tags:** sessions, benchmark, ralph

## Results
sn-llama70b (SambaNova): 5/5 ✅ ~800ms
nv-llama70b (NVIDIA):    4/5 ✅ ~1s (1x timeout iter3)
fw-llama70b (Fireworks): 5/5 ✅ ~770ms
co-command-r (Cohere):   5/5 ✅ ~540ms ⭐ fastest new
ms-small (Mistral):      5/5 ✅ ~560ms ⭐
gr-qwen3-32b (Groq):     5/5 ✅ ~1.2s (thinking mode)
hf-llama8b (HuggingFace):5/5 ✅ ~450ms
gem-2.5-flash (Gemini):  3/5 ✅ rate-limited iter4-5
or-nemotron (OpenRouter): 0/5 ❌ rate-limited
auto (omniroute):        5/5 ✅ ~50ms (cached)

# Skill: Proxy SSE Fix & OmniRoute Provider Verification

## Цель
Верифицировать что free-models-proxy.cjs корректно отдаёт
text/event-stream для AI SDK клиентов (opencode).
OmniRoute (KiroAI) = Tier 1 бесплатный Claude Sonnet 4.5.

## Инструменты
- curl smoke tests (non-stream + stream + omni direct)
- opencode live test
- provider batch tester (OR :free + Groq + Cerebras)

## Определение успеха
- CP1: /health → ok, model field = "auto", stream → SSE ✅
- CP2: OmniRoute → kr/claude-sonnet-4.5 отвечает ✅
- CP3: ≥2/9 OR :free моделей работают (остальные 429 rate-limit) ✅
- CP4: Groq < 4s ✅, Cerebras — ключ не задан ❌
- CP5: opencode live без parse errors
- CP6: git commit + handoff обновлён

## RAM Guard
free_mb < 300 → только cloud providers (openrouter, groq, gemini, omni)
НЕ запускать ollama/local модели при нехватке RAM

## Порты
20129 — free-models-proxy (Shadow Proxy)
20130 — OmniRoute (KiroAI) ← РЕАЛЬНЫЙ порт (инструкция Habr указывает 20128 — ОШИБКА)

## Важные находки
- OmniRoute запускается как Next.js app на порту 20130, не 20128
- Код в free-models-proxy.cjs с портом 20130 — ПРАВИЛЬНЫЙ, не менять
- Cerebras key (CEREBRAS_KEY) пустой в Doppler — нужно добавить
- OR:free модели часто дают 429 rate-limit — нормально, не баг прокси

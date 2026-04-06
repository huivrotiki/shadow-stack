# Working Combos Registry
> Обновляется после metric ≥ 85% или 3+ успешных запусков

## ✅ COMBO-1: AutoResearch → OmniRouter (VERIFIED)
**Команда:** `node autoresearch/loop.js 20`
**Chain:** loop.js → proposeHypothesis (omni-sonnet) → evaluate.js × 3 → git commit if +1% → knowledge/

| Задача | Модель | Порт |
|--------|--------|------|
| Hypothesis gen | omni-sonnet | :20129 |
| Fast eval | gr-llama70b | :20129 |
| Balanced | ms-small | :20129 |
| Deep audit | gr-llama70b | :20129 |

---

## ✅ COMBO-2: Telegram → Free Proxy (VERIFIED)
**Команда:** `doppler run ... -- pm2 start bot/opencode-telegram-bridge.cjs`
**Chain:** User → bot:4000 → OmniRoute:20130 → response → Telegram

---

## ✅ COMBO-3: Ralph Loop Tier Selection (VERIFIED)
```js
len < 300   → gr-llama70b  // fast  ~282ms
len < 1500  → ms-small     // balanced ~302ms
len >= 1500 → omni-sonnet  // smart
```

---

## ✅ COMBO-4: /combo Telegram Skills (VERIFIED 2026-04-05)
```
/combo audit <code>  → ms-small    800 tokens
/combo arch  <idea>  → gr-llama70b 1200 tokens
/combo brand <text>  → omni-sonnet 600 tokens
```

---

## ✅ COMBO-5: Cascade 16 Providers (VERIFIED 2026-04-05)
**RALPH Loop 5/5:** sn✅ nv✅ fw✅ co✅ ms✅ gr✅ hf✅ gem✅ auto✅
**Fastest:** co-command-r ~540ms, ms-small ~560ms, hf-llama8b ~450ms

---

## 🧪 COMBO-6: NotebookLM Handoff (IN TESTING)
**Триггер:** metric ≥ 0.85 → knowledge/autoresearch-YYYY-MM-DD.md

# Handoff: Shadow Stack v6.5 — "Infinite Memory Edition" 🧠

## Текущий Статус: ✅ ВСЕ 18/18 ЗАДАЧ + MEMORY PASS

---

## Что Нового в v6.5

### 🧠 Двухслойная Память (OpenClaw + ChromaDB)
Теперь агент не забывает прошлые сессии. Система работает без Docker, на диске:
- **Локальный слой**: `memory/shadow_memory/` (SQLite-база 3.4MB).
- **Индексация**: `scripts/index_knowledge.py` — chunkText + nomic-embed-text (Ollama).
- **VRAM Guard**: `keep_alive:0` — модель выгружается после каждого эмбеддинга (защита M1 8GB).
- **OpenClaw Skills**: `memory-retrieve` и `memory-store` для автономного поиска/записи.

### ☁️ Облачный Слой (Supermemory MCP)
- Интегрирован **Supermemory.ai** через MCP-протокол.
- Настроен в `.mcp.json` и `opencode.json`.
- Позволяет агенту обращаться к накопленным знаниям через API (api.supermemory.ai).

### ⚙️ OpenClaw v2.0 (openclaw.config.json)
- **5 Провайдеров**: local-router, ollama-local (3B), ollama-7b, openrouter, claude.
- **Auto-routing**: Правила для `/premium`, `/code`, `/fast`, `/cheap`.
- **Telegram Notification**: Бот уведомляет о падениях провайдеров (notifyOnError).

---

## 🔑 КРИТИЧЕСКОЕ: API КЛЮЧИ

### Телеграм Токен (8298265295)
Всё ещё **401 Unauthorized**. См. инструкции в v6.2 ниже для отката/ревью токена.

### Supermemory API Key
Добавлен плейсхолдер в `.env`. 
1. Получи ключ на **https://console.supermemory.ai** (API Keys section).
2. Вставь в `.env`: `SUPERMEMORY_API_KEY="sm_xxxx"`.

---

## Порты и Сервисы

| Сервис | Порт | Команда | Статус |
|--------|------|---------|--------|
| **OpenClaw** | 18789 | `opencode agent start` | 🟢 Active |
| **Express API** | 3001 | `node server/index.js` | 🟢 Active |
| **Dashboard** | 5176 | `npm run dashboard` | 🟢 Active |
| **Telegram Bot** | 4000 | `node bot/bridge.cjs` | 🔴 Token Error |
| **Ollama** | 11434 | `ollama serve` | 🟢 Active |
| **LiteLLM** | 4001 | `./scripts/llm.sh` | 🟢 Active |

---

## Инструкции для Памяти

```bash
# 1. Первичная индексация всех MD файлов проекта:
source .venv/bin/activate && python scripts/index_knowledge.py

# 2. Проверка поиска через JS:
# const { smartRetrieve } = await import('./scripts/memory-mcp.js');
```

---

## Git Коммиты
- `bd5ba0d5` fix: clean opencode.json MCP config
- `b935999e` feat: OpenClaw memory system (ChromaDB + nomic)
- `3dc9ba43` feat: complete phases 4-6 — settings, memory, LRU cache

---

## Файлы v6.5
- `.mcp.json` — Supermemory MCP config
- `openclaw.config.json` — Multi-provider routing
- `scripts/index_knowledge.py` — Python chunker/embedder
- `memory/` — Persistent ChromaDB storage
- `.venv/` — Python environment for ChromaDB
- `handoff.md` — v6.5 updated 🚀

| 6. Health Providers | 6.1 | ✅ |

---

## Git Коммиты (текущая сессия)
3dc9ba43 feat: complete phases 4-6 — settings tab, memory layer, LRU cache
```

## Файлы Изменённые
- `bot/opencode-telegram-bridge.cjs` — token validation + 401 guard
- `health-dashboard/index.html` — Settings tab (7th tab)
- `server/lib/ai-sdk.cjs` — LRU cache class
- `scripts/embedding.js` — ✨ NEW
- `scripts/chroma.js` — ✨ NEW
- `scripts/memory-mcp.js` — ✨ NEW
- `scripts/start-all.sh` — ✨ REWRITTEN
- `prd.json` — v6.2, 18/18 passes

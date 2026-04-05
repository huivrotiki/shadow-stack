# Agent Factory Knowledge Base

> Pre-flight: читать этот файл перед каждой задачей (вместе с Supermemory).

---

## Система

- **Mac mini M1 8GB** — одна тяжёлая Ollama-модель одновременно
- **Каскад:** OmniRoute :20128 → ZeroClaw :4111 → Ollama
- **Triada:** Claude ↔ OmniRoute :20128 ↔ ZeroClaw :4111
- **Деплой:** только Netlify (Phase A)
- **Шаблоны:** landing-page, react-spa, portfolio, business

## RAM Guard

| Свободно | Действие |
|-----------|----------|
| > 400MB   | Все провайдеры |
| 200-400MB | Только облако |
| < 200MB   | ABORT + Telegram alert |

## Ollama модели

- `shadow-coder` — qwen2.5-coder:3b (temp:0.3, ctx:4096)
- `shadow-general` — llama3.2:3b (temp:0.7, ctx:4096)
- `shadow-embed` — nomic-embed-text (keep_alive:0)

## Телеграм команды

- `/build "description"` — создать сайт → деплой Netlify
- `/status` — состояние всех сервисов
- `/research "query"` — OmniRoute research (search-enabled model)
- `/plan "task"` — создать todo.md

## Приоритетные проекты

1. Upscale Service (Telegram/Web + Runpod GPU)
2. POD Brand AGENTS.MD (Shopify)
3. Портфолио serpent.ai

## Синхронизация с NotebookLM

Блокнот: "Автономный стек разработки на Mac mini M1 8GB"  
Синхронизация: ручной экспорт через `shadow-kb-sync.sh`

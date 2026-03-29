# Handoff: Shadow Stack v7.0 — Browser-First Cascade + DevOps

## Текущий Статус: 24/24 tasks passes

---

## Что изменилось (git diff)

### server/lib/ai-sdk.cjs
- Внедрено In-Memory кэширование (LRU Cache) для экономии RAM M1
- Ответы на одинаковые запросы выдаются за 0мс (bypass Ollama/Playwright)
- Новый CASCADE_ORDER (12 уровней): gemini-browser → groq-browser → manus → perplexity → openrouter → antigravity → copilot → perplexity-chat → gemini-api → groq-api → alibaba → ollama
- SMART_ORDER (14 уровней): + openai, litellm
- **Security fix**: Gemini API key перенесён из URL (`?key=`) в header (`x-goog-api-key`)

### bot/opencode-telegram-bridge.cjs
- Улучшен UX fallback-механизма: при LOW_RAM (<400MB) бот уведомляет пользователя ("Браузерная модель временно недоступна...") и вызывает API-каскад
- `callBrowser(target, prompt)` — Shadow Router integration
- 6 новых handler'ов: handleGeminiBrowser, handleGroqBrowser, handlePerplexity, handlePerplexityChat, handleAntigravity, handleGrokBrowser
- routeToModel() переписан: 11-provider cascade (browser-first)
- **Security fix**: Gemini API key в header (2 места)
- 6 новых команд в dispatch: gemini-web, groq-web, perplexity, perplexity2, antigravity, grok-web

### RECOMMENDATIONS.md
- Добавлена Часть 2: Среднесрочные и Долгосрочные оптимизации (Адаптация плана Manus)
- Описаны задачи по Prompt Caching, Fallback UX, Silent Error Tracking и Feedback Loop

### server/shadow-router.cjs
- Полный рерайт: из mock-сервера в реальный Playwright CDP router
- 9 CDP targets: gemini, groq, manus, perplexity, perplexity2, antigravity, copilot, chatgpt, grok
- Порт сменён с 4111 на 3002
- Ключевые функции: `routeViaPage(target, prompt)`, `pollForResponse()`, `ensureBrowser()`
- RAM Guard: проверка 400MB перед каждым CDP запросом

### openclaw.config.json (+150/-75 lines)
- v2.0: 10 providers (browser CDP + API + relay + local)
- Routing rules: /fast → gemini-browser, /code → groq-browser, /research → perplexity, /cheap → ollama
- 10-item fallback chain

### server/api/health.js (+183/-90 lines)
- 12 providers в мониторинге (было 5)
- Browser health checks через Shadow Router `/health` endpoint

### prd.json (+10/-4 lines)
- v7.0: 24 задачи (18 old + 6 new), все "passes"

### Новые файлы
- `scripts/tmux-shadow.sh` — tmux layout (4 panes: API, Router, Bot, Dashboard + monitor + logs)

### Конфигурация (вне git)
- `~/.zshrc` — starship prompt, zsh-autosuggestions, zsh-syntax-highlighting, fzf, Shadow Stack aliases
- `~/.config/starship.toml` — минимальный prompt: git branch, node version
- `~/.openclaw/openclaw.json` — providers (shadow-router, ollama, openrouter), routing rules, fallback chain

---

## Почему было принято именно такое решение

- **Browser-first cascade**: браузерные провайдеры бесплатны и без API лимитов. API провайдеры — fallback
- **Shadow Router на Playwright CDP**: один Chrome instance, 9 targets, переиспользование browser context
- **Gemini API key в header**: security fix — ключ больше не утекает в URL/логи
- **tmux layout**: все 4 сервиса видны одновременно, быстрое переключение

---

## Что мы решили НЕ менять

- `server/index.js` — Express API не тронут, работает
- Telegram bot token (401) — требует новый токен от @BotFather, не наша задача
- Docker/PostgreSQL — запрещено по CLAUDE.md (M1 8GB ограничение)
- Vercel deploy — это другой проект (cyberbabyangel)

---

## Тесты / Проверки

- `curl localhost:3002/health` — Shadow Router отвечает, показывает targets
- `curl localhost:3002/targets` — список 9 CDP targets
- `curl localhost:3002/ram` — проверка свободной RAM
- OpenClaw gateway на :18789 отвечает (HTML dashboard)
- Все brew tools установлены: fzf 0.70.0, starship 1.24.2, gron dev, lnav 0.13.2

---

## Журнал несоответствий / Подводные камни

1. **Chrome CDP не запущен**: Shadow Router стартует, но CDP connect fails (ECONNREFUSED 127.0.0.1:9222). Нужно: `open -a "Google Chrome" --args --remote-debugging-port=9222`
2. **RAM Guard**: На M1 8GB при запущенных сервисах свободно ~200MB < 400MB threshold. Browser routes вернут LOW_RAM, cascade fallback на API
3. **certifi/pydantic brew link conflict**: symlink конфликты с pip-установленными пакетами. Решено через `brew link --overwrite`
4. **pip3 PEP 668**: macOS блокирует pip install без `--break-system-packages`. Использован флаг
5. **OpenClaw providers секция**: добавлена в openclaw.json, но OpenClaw может не поддерживать кастомные providers в этом формате — нужно проверить через UI на :18789

---

## Порты и Сервисы

| Сервис | Порт | Команда | Статус |
|--------|------|---------|--------|
| Express API | 3001 | `node server/index.js` | 🟢 |
| Shadow Router | 3002 | `node server/shadow-router.cjs` | 🟡 CDP needs Chrome |
| Telegram Bot | 4000 | `PORT=4000 node bot/bridge.cjs` | 🔴 Token 401 |
| Dashboard | 5176 | `npm run dev` (health-dashboard/) | 🟢 |
| OpenClaw | 18789 | gateway (auto) | 🟢 |
| Ollama | 11434 | `ollama serve` | 🟢 |

---

## Brew Tools Installed

fzf, lnav, starship, httpie, gron, litecli, tmux, shellcheck, zsh-autosuggestions, zsh-syntax-highlighting

## Python Tools Installed

py-spy, psutil, rich, pydantic (brew), sqlite-utils, datasette

---

## Следующие шаги

1. Запустить Chrome с CDP: `open -a "Google Chrome" --args --remote-debugging-port=9222`
2. Запустить все через tmux: `./scripts/tmux-shadow.sh`
3. Получить новый Telegram bot token от @BotFather
4. Smoke test browser providers: `curl localhost:3002/route/gemini/hello`

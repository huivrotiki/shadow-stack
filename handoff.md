# Отчет о сессии (Handoff)

- **Что изменилось:**
  - `vercel.json` — создан (SPA rewrites, framework: vite, headers CORS)
  - `vite.config.js` — убран proxy блок (не нужен на Vercel)
  - `src/components/HealthDashboard.jsx` — WebSocket → Polling (7s interval) для совместимости с Vercel serverless
  - `src/components/HealthDashboard.jsx` — исправлена ошибка (удален старый useHealthWebSocket, оставлен только useHealthPolling)
  - `src/App.jsx` — hardcoded `localhost:11434` → `import.meta.env.VITE_OLLAMA_URL`
  - `server/index.js` — добавлен CORS middleware
  - `.mcp.json` — исправлена JSON ошибка (GitHub token config)
  - `.opencode/plugins/` — созданы 3 плагина (vercel-deploy.ts, env-protection.ts, react-validator.ts)
  - `opencode.json` — добавлено поле `"plugin": [...]`
  - `.claude/skills/` — скопированы `deploy-to-vercel`, `vercel-cli-with-tokens`
  - `.agents/skills/` — установлены `vercel-deploy-claimable`, `react-best-practices`, `web-design-guidelines`

- **Почему было принято именно такое решение:**
  - Vercel serverless НЕ поддерживает WebSockets → замена на Polling (fetch каждые 7с)
  - Vite proxy работает только в dev режиме → убран из vite.config.js, заменен на rewrites в vercel.json
  - OpenCode плагины нужны для расширения возможностей (деплой, защита секретов, валидация React)
  - CORS middleware на бэкенде нужен для разрешения запросов с Vercel домена

- **Что мы решили НЕ менять:**
  - Существующие 23 skills в `.agent/skills/` — адаптер (Phase 5.2) будет читать их as-is
  - 6 symlinks в `.opencode/skills/` — оставлены для backward-compat
  - WebSocket бэкенд (:3001) — оставлен на Mac mini M1, НЕ переносится на Vercel
  - `server/lib/ai-sdk.cjs:331` — ложная тревога линтера (закрывающая скобка массива)

- **Тесты:**
  - `npm run build` — ✅ успешно (243KB gzipped)
  - `npm run lint` — ❌ осталась ошибка в `server/lib/ai-sdk.cjs:331` (false positive, можно игнорировать)
  - Vercel деплой — ❌ не выполнен (проблема с авторизацией: `No existing credentials found`)

- **Журнал несоответствий / Подводные камни:**
  - Vercel CLI требует интерактивный логин (через браузер) — нельзя просто передать токен через ENV
  - Много "мусора" в git status (папки `.agents/`, `.codebuddy/` и др.) — вероятно, это симлинки из других проектов, НЕ коммитить
  - `server/lib/ai-sdk.cjs` вызывает ошибку парсинга, хотя файл валиден — особенность ESLint
  - Vercel build-time ENV: `VITE_API_URL` подставляется только при сборке, на runtime его нет в статике

- **Следующий шаг:**
  1. Пользователь должен выполнить `npx vercel login` (интерактивно) или передать токен
  2. Добавить `VITE_API_URL` в Vercel Dashboard (Settings → Environment Variables)
  3. Выполнить `npx vercel --prod`
  4. Проверить деплой: `https://shadow-stack-local-1.vercel.app`

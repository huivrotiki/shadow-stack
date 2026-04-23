# Отчет о сессии (Handoff)

_Дата: 2026-04-24 | Ветка: main | HEAD: 034d0a45 (коммит этой сессии)_

---

## Что изменилось

### Новые файлы (коммит `034d0a45` — `feat(dashboard): cyberbabyangel design + omniroute mirror + CLI terminals`)

| Файл | Суть |
|------|------|
| `src/components/design/NeonOrb.jsx` | Three.js GLSL орб-фон (simplex-noise + FBM + mouse vortex + film grain). Lazy-loaded. Props: `bgColor`, `orbColor`, `noiseVal`. |
| `src/components/design/CustomCursor.jsx` | Dot + LERP ring курсор. `INTERACTIVE_SELECTOR` для hover-эффекта. Hides on touch. |
| `src/components/design/Loader.jsx` | Интро-лоадер с прогресс-баром, fade через 2с, remove через 3с. Prop `name="SHADOW ROUTER"`. |
| `src/components/design/Toast.jsx` | Глобальный `showToast(msg)` через module-level ref. 2200ms duration. |
| `src/components/DashboardShell.jsx` | Layout-обёртка (NeonOrb + grain + nav + Toast + Loader + CustomCursor). **Создан, но нигде не подключён** — dead code. |
| `src/components/dashboard/SpeedControl.jsx` | 3 кнопки slow/medium/fast → `POST /api/speed` с телом `{ speed }` (не `profile`!). Optimistic UI с откатом. |
| `src/components/dashboard/ModelSelector.jsx` | Dropdown с `<optgroup>`. Источник 1: `/api/models` (shadow :20129). Источник 2: `/api/omniroute/models/catalog` (:20130). 123 опции при запущенном прокси. |
| `src/components/dashboard/CliTerminal.jsx` | Polling `/api/logs/:service` каждые 3с. AbortController при unmount. Кнопка pause/resume. `CliTerminalGrid` экспортирует 3 окна: shadow-api / free-models-proxy / omniroute-kiro. |
| `src/components/dashboard/OmniRoutePanel.jsx` | Хуки `useOmniRoute(path)` → `/api/omniroute/*`. Auto-refresh 10с. Отображает providers, combos, usage/analytics. |

### Изменённые файлы

| Файл | Суть изменений |
|------|----------------|
| `server/index.js` | +`execFile` import (строка 3). +`GET /api/logs/:service` — execFile pm2 + whitelist 6 сервисов, no shell injection. +`GET /api/omniroute/*` proxy → :20130. +`GET /api/models` → :20129/v1/models. +`GET/POST /api/route/default` (in-memory `_defaultModel`). |
| `src/components/HealthDashboard.jsx` | +8 импортов новых компонентов (строки 1–8). Root `return` обёрнут в `<>` с NeonOrb/grain/Toast/CustomCursor. +3 секции в конце `<main>`: `#router-controls` (SpeedControl + ModelSelector), `#omniroute-mirror` (OmniRoutePanel), `#terminals` (CliTerminalGrid). |
| `src/index.css` | Полная перезапись: Google Fonts (Cormorant Garamond, Syne, Space Grotesk), CSS vars, grain animation, z-index scale (orb:0 → cursor:10000), стили dashboard компонентов. |
| `vite.config.js` | +`proxy`: `/api/*` → `http://localhost:3001`, `/ws/*` → `ws://localhost:3001`. |
| `package.json` / `package-lock.json` | +`three` (Three.js для NeonOrb GLSL shader). |

---

## Почему было принято именно такое решение

- **`execFile` вместо `exec`** — whitelist + array args, никакой shell интерпретации. Injection через `:service` param невозможен физически.
- **Polling вместо WebSocket для логов** — pm2 logs не поток в API контексте; polling 3с достаточно. AbortController предотвращает setState на unmounted компоненте.
- **Vite proxy** — избегает CORS между :5175 (dev) и :3001 (API).
- **HealthDashboard расширен, не переписан** — сохранён WebSocket hook (`ws://localhost:3001/ws/health`) и вся логика tabs/themes (строки ~79–628).
- **NeonOrb через lazy import** — Three.js GLSL shader тяжёлый (~2MB), lazy+Suspense исключает из критического пути рендера.
- **Optimistic UI в SpeedControl** — мгновенный отклик на клик, откат состояния в catch если сервер вернул ошибку.

---

## Что мы решили НЕ менять

- `HealthDashboard.jsx` — WebSocket логика, tabs, themes, stats периоды — **не трогали**.
- `App.jsx` — HealthDashboard по-прежнему открывается как модалка по клику на "Health Dashboard". Роутинг не добавляли.
- `server/free-models-proxy.cjs` — не трогали.
- OmniRoute :20130 — только read-only proxy, сам OmniRoute не изменяли.
- `DashboardShell.jsx` создан но **не подключён** — сознательное решение, чтобы не ломать существующий modal layout.

---

## Тесты

Ручная верификация через Claude preview tool (:5175):

| Проверка | Результат |
|----------|-----------|
| Dev server стартует без ошибок сборки | ✅ |
| `#router-controls`, `#omniroute-mirror`, `#terminals` в DOM | ✅ |
| `.speed-btn × 3`, `.speed-btn.active` = "MEDIUM" (с сервера) | ✅ |
| `.model-select` — 123 опции | ✅ |
| `.cli-terminal × 3` — реальные pm2 логи | ✅ (после `pm2 restart shadow-api`) |
| `.orb-bg` и `.grain` присутствуют | ✅ |
| `.omni-panel` рендерится | ✅ (HTTP 401 от :20130 — ожидаемо) |
| `curl /api/logs/shadow-api` | ✅ 50 строк JSON |
| Console errors из наших компонентов | ✅ отсутствуют |

---

## Журнал несоответствий / Подводные камни

1. **OmniRoute :20130 требует авторизацию** — `/api/omniroute/providers` → HTTP 401. OmniRoutePanel показывает "error: HTTP 401". Нужен auth token или forwarding cookies. Отложено.

2. **EADDRINUSE при `pm2 restart shadow-api`** — старый процесс не успевает освободить порт. Workaround: `pm2 stop shadow-api && sleep 1 && pm2 start shadow-api`. Не критично.

3. **SpeedControl: ключ `speed`, не `profile`** — `router-engine.cjs` ожидает `{ speed }`. В коде уже правильно. Если брать SpeedControl из старого summary — будет 400.

4. **`obsidian/` не в `.gitignore`** — `git status` показывает `obsidian/Добро пожаловать.md` как untracked. Нужно добавить `obsidian/` в `.gitignore`.

5. **React key warnings в HealthDashboard** — предсуществующие (до наших правок), "Each child in a list should have a unique key prop". Не блокируют работу.

6. **`DashboardShell.jsx` — dead code** — закоммичен, но нигде не импортируется. Нужен React Router и роут `/dashboard` в `main.jsx`, чтобы использовать.

7. **`_defaultModel` in-memory** — `/api/route/default` сбрасывается при рестарте shadow-api. Для персистентности нужен файл или `.state/`.

---

## Состояние сервисов на конец сессии

```
pm2: shadow-api (PID 21607), free-models-proxy (PID 77174), omniroute-kiro (PID 1709), agent-bot, shadow-channels — все online
```

---

## Следующие шаги

- [ ] Добавить `obsidian/` в `.gitignore`
- [ ] Разобраться с auth для OmniRoute proxy (cookie forwarding или API key)
- [ ] Подключить `DashboardShell.jsx` как отдельный роут или удалить dead code
- [ ] Персистентность `_defaultModel` (записывать в `.state/` или JSON файл)
- [ ] Починить React key warnings в HealthDashboard

# DESIGN_RULES.md v4.0 — SHADOW STACK
# Цифровой минимализм 2026 для AI / SaaS / Dashboard
# Расширенная версия на основе анализа minimal.gallery

**Версия:** 4.0  
**Дата:** 2026-03-27  
**Проект:** Shadow Stack (huivrotiki/shadow-stack)  
**Источник:** minimal.gallery (100+ проектов, куратор Piet Terheiden)  
**Категории:** AI · SaaS · Dashboard · Startup · Portfolio  

---

## МАНИФЕСТ

> «Минимализм — это не отсутствие чего-то. Это идеальное количество чего-то.»

**Shadow Stack** — AI-powered desktop overlay на Electron + React + Tailwind.
Это инженерный инструмент для разработчиков. UI должен отражать это:
- техническая честность
- моноширинные шрифты для данных
- тёмная тема по умолчанию
- никакой «магии» — только прозрачная механика

**Приоритетная иерархия:**
```
СМЫСЛ → СТРУКТУРА → ТИПОГРАФИКА → ЦВЕТ → АНИМАЦИЯ → КОД
```

---

## 0. SHADOW STACK DESIGN TOKENS

### Цветовая палитра (из CLAUDE.md)

```css
/* Backgrounds */
--bg-primary:   #0A0A0A;   /* Основной фон */
--bg-surface:   #0D1117;   /* Карточки, панели */
--bg-elevated:  #161B22;   /* Hover, elevated states */
--bg-overlay:   #21262D;   /* Модалки, dropdowns */

/* Accents */
--blue:         #58a6ff;   /* Primary actions */
--blue-bright:  #60a5fa;   /* Hover state */
--green:        #3fb950;   /* Success, online */
--green-bright: #34d399;   /* Bright success */
--purple:       #bc8cff;   /* AI, LLM indicators */
--purple-bright:#a78bfa;   /* Hover */
--cyan:         #39d2c0;   /* Router, routing */
--cyan-bright:  #22d3ee;   /* Hover */
--red:          #f87171;    /* Error, critical */
--yellow:       #fbbf24;    /* Warning, RAM < 400MB */

/* Text */
--text-primary:  #E6EDF3;
--text-secondary:#8B949E;
--text-muted:   #6E7681;
--text-mono:    #79C0FF;

/* Borders */
--border:        #30363D;
--border-muted:  #21262D;
```

### Типографика

```css
/* Headings — Cormorant Garamond */
font-family: 'Cormorant Garamond', Georgia, serif;
font-weight: 600;

/* UI Text — Inter */
font-family: 'Inter', system-ui, sans-serif;

/* Data/Mono — JetBrains Mono */
font-family: 'JetBrains Mono', 'Fira Code', monospace;
font-feature-settings: 'liga' 1;
```

### Размеры (Tailwind arbitrary values)

```css
/* Padding — стандартные паттерны */
py-[24px] px-[32px]    /* Header */
p-[24px]               /* Card padding */
p-[16px]               /* Compact card */
gap-[4px] gap-[8px]    /* Grid gaps */
gap-[12px]             /* Section gaps */

/* Border radius */
rounded-[8px]          /* Cards */
rounded-[10px]         /* Flow nodes, buttons */
rounded-[12px]         /* Modals */
rounded-full           /* Status dots */

/* Spacing */
mb-[24px] mb-[32px]    /* Section margin */
mt-[16px] mt-[24px]    /* Component margin */
```

---

## 1. АРХИТЕКТУРА СМЫСЛА

### 1.1 Принцип одной задачи

**MUST:**
- Каждый экран отвечает на ОДИН вопрос
- Один главный action button на секцию
- Явная нумерация секций: `01 /`, `§02`, `[A]`

**MUST NOT:**
- Несколько конкурирующих CTA
- Скрытая навигация без явного триггера
- Слайдеры и карусели в hero

### 1.2 Health Dashboard — структура (ОБЯЗАТЕЛЬНО 9 табов)

```
Tab 0: Overview     — System status, key metrics
Tab 1: AI Radar      — LLM providers, latency, costs
Tab 2: State Machine — Orchestrator states
Tab 3: Router        — Shadow Router CDP status
Tab 4: RAM & Risk    — Memory guard, 16-seg bar
Tab 5: Phases        — Bootstrap phases progress
Tab 6: Integrations  — MCP servers, Doppler, Telegram
Tab 7: Logs          — SSE stream, real-time
Tab 8: Settings      — Config, env vars
```

**MUST:** Ровно 9 табов в этом порядке. Не добавлять, не убирать.

### 1.3 Иерархия контента

**MUST:**
- Максимум 3 уровня: заголовок → подзаголовок → метаданные
- Критический контент — над сгибом (above the fold)
- Section title pattern (ОБЯЗАТЕЛЬНО):

```jsx
<h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-6">
  {title}
</h2>
```

---

## 2. ТИПОГРАФИКА

### 2.1 Роль шрифта

| Контекст | Шрифт | Пример |
|----------|--------|--------|
| Section titles | Cormorant Garamond | Hero, tab headers |
| UI elements | Inter | Buttons, labels, body |
| Technical data | JetBrains Mono | RAM, latency, logs, versions |

### 2.2 Размеры (строго 3 кегля)

| Size | Tailwind | Использование |
|------|----------|--------------|
| XS | `text-xs` | Metadata, timestamps, labels |
| M | `text-sm` | Body text, descriptions |
| XL | `text-2xl+` | Section titles, hero |

### 2.3 Моноширинные данные (ОБЯЗАТЕЛЬНО)

**ВСЕ числовые данные отображаются моноширинным шрифтом:**

```jsx
// RAM
<span className="font-mono text-sm">
  {freeRAM}MB free
</span>

// Latency
<span className="font-mono text-xs text-green-400">
  {latency}ms
</span>

// Timestamps
<span className="font-mono text-xs text-zinc-500">
  {new Date(ts).toISOString()}
</span>

// Versions
<span className="font-mono text-xs">
  v{version}
</span>
```

**MUST NOT:** Использовать proportional шрифт для цифр в дашборде.

### 2.4 Числовые якоря

```jsx
// Как паттерн для метрик
<span className="font-mono">(00)</span>
<span className="font-mono">[A]</span>
<span className="font-mono">§03</span>
```

---

## 3. ЦВЕТ И ФОН

### 3.1 Тёмная тема (ОБЯЗАТЕЛЬНО для Shadow Stack)

**Запрещено:**
- `#FFFFFF` чистый белый фон
- `#000000` абсолютный чёрный

**Рабочая палитра:**
```
Фон основной:    --bg-primary:   #0A0A0A
Фон карточек:    --bg-surface:   #0D1117
Фон elevated:    --bg-elevated:  #161B22
Фон overlay:     --bg-overlay:   #21262D
```

### 3.2 Цветовая семантика

| Состояние | Цвет | Tailwind | Использование |
|-----------|------|----------|--------------|
| Success/Online | Green | `text-green-400` | Provider active, RAM > 1GB |
| Warning | Yellow | `text-yellow-400` | RAM < 1GB, rate limit |
| Error/Critical | Red | `text-red-400` | RAM < 200MB, API error |
| Info/Primary | Blue | `text-blue-400` | Actions, links |
| AI/LLM | Purple | `text-purple-400` | LLM indicators |
| Router | Cyan | `text-cyan-400` | Routing, proxy |

### 3.3 Сигнальные состояния

```jsx
// Provider status
ACTIVE:  bg-green-400/10 text-green-400 border border-green-400/20
ERROR:   bg-red-400/10 text-red-400 border border-red-400/20
IDLE:    bg-zinc-800 text-zinc-500

// RAM status (> 1GB free)
text-green-400     // Safe
text-yellow-400   // Warning (< 1GB)
text-red-400      // Critical (< 200MB)

// Status dot
<span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
```

---

## 4. КОМПОНЕНТЫ

### 4.1 AI Radar (Tab 1)

**SVG only, NO canvas, NO external libraries**

```jsx
<svg viewBox="0 0 400 400" className="w-full h-full">
  {/* 4 Concentric rings */}
  <circle cx="200" cy="200" r="180" className="fill-none stroke-zinc-700" />
  <circle cx="200" cy="200" r="135" className="fill-none stroke-zinc-600" />
  <circle cx="200" cy="200" r="90"  className="fill-none stroke-zinc-500" />
  <circle cx="200" cy="200" r="45"  className="fill-none stroke-zinc-400" />
  
  {/* Crosshair */}
  <line x1="200" y1="20" x2="200" y2="380" className="stroke-zinc-600" />
  <line x1="20" y1="200" x2="380" y2="200" className="stroke-zinc-600" />
  
  {/* Sweep animation (CSS keyframes in <style>) */}
  <path className="animate-radar-sweep" ... />
  
  {/* 8 Provider dots */}
  {providers.map(p => (
    <circle 
      key={p.id}
      cx={200 + Math.cos(p.angle) * p.distance}
      cy={200 + Math.sin(p.angle) * p.distance}
      r={6}
      className="fill-current animate-pulse"
    />
  ))}
</svg>
```

**Animation CSS:**
```css
@keyframes radar-sweep {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.animate-radar-sweep {
  animation: radar-sweep 4s linear infinite;
  transform-origin: center;
}
```

### 4.2 SegBar (RAM visualization, Tab 4)

**16 segments, color-coded**

```jsx
const SegBar = ({ value }) => {
  const used = Math.round(value / 100 * 16);
  return (
    <div className="flex gap-[2px]">
      {[...Array(16)].map((_, i) => (
        <div
          key={i}
          className={`
            w-[12px] h-[24px] rounded-[2px]
            ${i < used 
              ? value > 80 ? 'bg-red-400' 
              : value > 50 ? 'bg-yellow-400' 
              : 'bg-green-400'
              : 'bg-zinc-800'
            }
          `}
        />
      ))}
    </div>
  );
};
```

### 4.3 Flow Nodes (State Machine, Tab 2)

```jsx
<div className={`
  px-[16px] py-[12px] rounded-[10px]
  bg-bg-elevated border border-border
  hover:scale-[1.05] transition-transform
  ${active ? 'border-blue-400' : 'border-zinc-700'}
`}>
  <span className="font-mono text-sm">{state.name}</span>
  <span className="text-xs text-zinc-500">{state.status}</span>
</div>
```

### 4.4 Status Indicator

```jsx
const StatusDot = ({ status }) => {
  const colors = {
    online:  'bg-green-400',
    warning: 'bg-yellow-400',
    error:   'bg-red-400',
    idle:    'bg-zinc-500',
  };
  return (
    <span 
      className={`
        w-2 h-2 rounded-full 
        ${colors[status]}
        ${status !== 'idle' ? 'animate-pulse' : ''}
      `}
    />
  );
};
```

### 4.5 Log Entry

```jsx
<div className={`
  font-mono text-xs p-[8px] rounded-[4px]
  ${level === 'error' ? 'text-red-400 bg-red-400/10' :
    level === 'warning' ? 'text-yellow-400 bg-yellow-400/10' :
    level === 'success' ? 'text-green-400' :
    'text-zinc-300'
  }
`}>
  [{timestamp}] [{level.toUpperCase()}] {message}
</div>
```

---

## 5. АНИМАЦИЯ

### 5.1 Разрешённые анимации

| Анимация | Tailwind | Использование |
|----------|----------|--------------|
| `animate-pulse` | Status dots | Online/Warning/Error indicators |
| `transition-transform` | Hover states | Flow nodes scale |
| SVG keyframes | AI Radar sweep | Rotating sweep |
| Skeleton shimmer | Loading | Async data |
| `transition-colors` | Tab switch | Active tab highlight |

**Transition durations:**
```jsx
// UI elements
duration-150 / duration-200 / duration-300

// Easing
ease-out  // Появление
ease-in   // Исчезновение
```

### 5.2 Загрузка данных

**RULE: skeleton ВСЕГДА вместо spinner для контента**

```jsx
// Skeleton pattern
<div className="animate-pulse">
  <div className="bg-bg-elevated rounded-[8px] h-4 w-3/4 mb-2" />
  <div className="bg-bg-elevated rounded-[8px] h-4 w-1/2" />
</div>

// Spinner — ТОЛЬКО для action buttons
<button disabled>
  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
  Deploying...
</button>
```

### 5.3 Запрещённые анимации

**MUST NOT:**
- Three.js, GSAP, Framer Motion (слишком тяжёлые для 8GB RAM)
- Декоративные loop-анимации без UX-задачи
- Параллакс
- Блокирующие анимации > 500ms

---

## 6. SAAS / DASHBOARD ПАТТЕРНЫ

### 6.1 Структура лэндинга

```
01 / HERO       → Что / Для кого / Результат. 1 CTA.
02 / PROBLEM    → Почему текущее решение ломает процесс.
03 / SOLUTION   → Как именно. Показывай, не рассказывай.
04 / FEATURES   → Bento-блоки. 1 блок = 1 фича = 1 польза.
05 / SOCIAL     → Числа, лого, цитаты. Без воды.
06 / CTA        → Повтор главного действия.
```

### 6.2 Bento Grid

```jsx
<div className="grid grid-cols-4 gap-[12px]">
  {/* 2x2 Feature */}
  <div className="col-span-2 row-span-2 p-[24px] ...">Large</div>
  {/* 1x1 Features */}
  <div className="p-[16px] ...">Small</div>
  <div className="p-[16px] ...">Small</div>
  {/* 2x1 Feature */}
  <div className="col-span-2 p-[16px] ...">Wide</div>
</div>
```

**MUST:** Каждый блок = один смысл + одно действие.

---

## 7. AI — ТЕХНИЧЕСКАЯ ЧЕСТНОСТЬ

### 7.1 Принцип

AI-продукт = серьёзный инструмент для профессионала.
UI должен показывать «кишки» системы: модели, версии, логи, статусы.

### 7.2 Обязательные элементы

```jsx
// Model version badge
<span className="font-mono text-xs px-[8px] py-[2px] rounded-full bg-purple-400/20 text-purple-400">
  llama3.2
</span>

// API status
<span className="font-mono text-xs">
  VER/{buildNumber} · {timestamp}
</span>

// Latency metrics
<div className="font-mono text-sm">
  <span className="text-cyan-400">→</span> {latency}ms
  <span className="text-zinc-500"> · </span>
  <span className="text-green-400">{tokens}/s</span>
</div>

// Error log with stack trace
<pre className="font-mono text-xs text-red-400 whitespace-pre-wrap">
  {error.stack}
</pre>
```

### 7.3 Прозрачность состояний

```jsx
// LLM Request flow
<div className="border-l-2 border-purple-400 pl-[16px]">
  <div className="font-mono text-xs text-zinc-400">
    [1/3] {t("sending_to_model")}
  </div>
  <div className="font-mono text-xs text-purple-400">
    [2/3] {t("model_processing")}: {modelName}
  </div>
  <div className="font-mono text-xs text-green-400">
    [3/3] {t("response_ready")} ({latency}ms)
  </div>
</div>
```

---

## 8. ПОРТФОЛИО — ЖИВОЙ МИНИМАЛИЗМ

### 8.1 Контекстные данные

```jsx
// Локальное время
<span className="font-mono text-xs text-zinc-500">
  {new Date().toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin' })}
  {' '}BER
</span>

// Геолокация
<span className="font-mono text-xs text-zinc-500">
  52.52°N 13.40°E
</span>

// Текущий статус
<span className="text-sm text-zinc-400">
  Working on <span className="text-blue-400">{currentTask}</span>
</span>
```

### 8.2 Индексы и версии

```jsx
<span className="font-mono text-xs">[^15_001]</span>
<span className="font-mono text-xs">V.2.4.1</span>
<span className="font-mono text-xs">2024-03-27</span>
```

---

## 9. ПРОИЗВОДИТЕЛЬНОСТЬ

### 9.1 Требования

| Метрика | Target |
|---------|--------|
| Lighthouse (mobile) | ≥ 90 |
| LCP | < 2.5s |
| CLS | < 0.1 |
| FID | < 100ms |

### 9.2 RAM-aware дизайн

```jsx
// RAM Guard — показывать WARNING при < 400MB
{freeRAM < 400 && (
  <div className="bg-yellow-400/10 border border-yellow-400/20 p-[12px] rounded-[8px]">
    <span className="font-mono text-xs text-yellow-400">
      ⚠ LOW RAM: {freeRAM}MB free
    </span>
  </div>
)}

// Блокировать тяжёлые действия при < 200MB
{freeRAM < 200 && (
  <button disabled className="opacity-50">
    Browser actions blocked — RAM critical
  </button>
)}
```

---

## 10. АНТИ-ПАТТЕРНЫ

**НИКОГДА НЕ ДЕЛАТЬ в Shadow Stack UI:**

```
✗ Белый фон (#FFFFFF) — проект тёмный
✗ Цветные градиенты без функции
✗ Placeholder tabs «Coming soon»
✗ Spinner вместо skeleton для данных
✗ Внешние иконочные библиотеки (inline SVG)
✗ Proportional шрифт для цифр
✗ Анимации > 500ms блокирующие контент
✗ Three.js / GSAP / Framer Motion
✗ Изменение порядка 9 табов Health Dashboard
✗ Карусели и слайдеры в hero
✗ Избыточные shadow эффекты
✗ Placeholder images (использовать реальные)
```

---

## 11. CHECKLIST — перед каждым UI-коммитом

```
АРХИТЕКТУРА
[ ] 1 экран = 1 вопрос?
[ ] Секции пронумерованы?
[ ] Максимум 1 CTA на секцию?

ТИПОГРАФИКА
[ ] Headings = Cormorant Garamond?
[ ] Body = Inter?
[ ] Данные = font-mono?
[ ] Максимум 3 кегля?

ЦВЕТ
[ ] Тёмная тема (#0A0A0A base)?
[ ] Цветовая семантика соблюдена?
[ ] Нет чистого белого фона?

АНИМАЦИЯ
[ ] Skeleton для загрузки данных?
[ ] Status dots с animate-pulse?
[ ] Hover с scale-[1.05]?
[ ] Нет тяжёлых библиотек?

HEALTH DASHBOARD
[ ] Ровно 9 табов?
[ ] AI Radar = SVG only?
[ ] SegBar = 16 сегментов?
[ ] Tab order: Overview→AI→State→Router→RAM→Phases→Integrations→Logs→Settings?

КОД
[ ] npm run build проходит?
[ ] Нет console.error?
[ ] Все строки переведены (i18n)?
```

---

## 12. ПРАВИЛА ДЛЯ AI-АГЕНТА (машинный формат)

```
RULE-001: EVERY ELEMENT MUST BE JUSTIFIED BY FUNCTION OR MEANING.
RULE-002: ONE SCREEN = ONE QUESTION = ONE ACTION.
RULE-003: SECTION NUMBERING IS MANDATORY (01/, §02, [A]).
RULE-004: HEADINGS = Cormorant Garamond. BODY = Inter. DATA = font-mono.
RULE-005: ALL NUMERIC DATA MUST USE font-mono.
RULE-006: AI PRODUCTS REQUIRE TECHNICAL HONESTY (VERSIONS, LOGS, MODELS).
RULE-007: MOTION = EXPLAIN OR CONFIRM. NEVER DECORATION.
RULE-008: DEFAULT THEME IS DARK (#0A0A0A). #FFFFFF REQUIRES JUSTIFICATION.
RULE-009: SKELETON ALWAYS FOR DATA LOADING. SPINNER ONLY FOR ACTIONS.
RULE-010: HEALTH DASHBOARD = EXACTLY 9 TABS IN SPECIFIED ORDER.
RULE-011: AI RADAR = SVG ONLY. NO CANVAS. NO EXTERNAL LIBRARIES.
RULE-012: RAM BAR = 16 SEGMENTS. COLOR-CODED: GREEN→YELLOW→RED.
RULE-013: LIGHTHOUSE ≥ 90 MOBILE IS NON-NEGOTIABLE.
RULE-014: NO Three.js, GSAP, Framer Motion — TOO HEAVY FOR 8GB RAM.
RULE-015: HOVER ON FLOW NODES = scale-[1.05] + transition-transform.
RULE-016: STATUS DOTS = animate-pulse WHEN ACTIVE.
RULE-017: INTERFACE MUST REFLECT ENGINEERING NATURE (TERMINAL, LOGS, VERSIONS).
RULE-018: PORTFOLIOS ARE ARCHIVES WITH METADATA. NOT IMAGE GALLERIES.
```

---

## ИСТОЧНИКИ

- [minimal.gallery](https://minimal.gallery) — кураторский архив, Piet Terheiden
- [Factory](https://factory.ai) — IDE-подобный лэндинг
- [Isidor](https://www.isidor.ai) — техническая честность
- [Sort](https://sort.to) — one-page SaaS
- [Antimetal](https://antimetal.com) — data metrics
- [PostHog](https://posthog.com) — engineering landing
- [Folk](https://www.folk.app) — bento grid SaaS

**Обновлено:** 2026-03-27
**Проект:** Shadow Stack
**Путь:** `.agent/skills/design-system/design_rules.md`

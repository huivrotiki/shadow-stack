# Knowledge Sources — ALWAYS ACTIVE

**Every runtime (Claude Code, OpenCode, ZeroClaw, Telegram bot) must consult these before answering non-trivial questions:**

1. **Supermemory MCP** — long-term semantic memory via MCP tools (`mcp__mcp-supermemory-ai__recall`, `memory`, `listProjects`). Call `recall` first on architecture/preference questions; write back with `memory` when learning something durable.
2. **NotebookLM** — CLI at `~/.venv/notebooklm/bin/notebooklm` (`list` / `use <id>` / `ask "<query>"`). Use for Shadow Stack architecture, LLM mesh, NVIDIA/agent-factory, OpenClaw security topics.
3. **Auto-load:** `scripts/session-context-loader.sh` runs at SessionStart and injects notebooks + supermemory reminder into session context.

---

# Portable State Layer — READ FIRST

**Before anything else in this project, read these files in order:**

1. `.state/current.yaml` — active plan, session, lock, git state (YAML).
2. `.state/todo.md` — shared todos across all runtimes (markdown checklist).
3. `.state/session.md` — live append-only log of current session. Append a `## HH:MM · <runtime> · <event>` line at each milestone.
4. `handoff.md` — last cross-session handoff (in project root).
5. `docs/SERVICES.md` — service registry (ports, owners, health URLs, fallback).

**When finishing work in this project:** append a `runtime_close` event to `.state/session.md` and commit `.state/` if `git.auto_commit_state: true` in `current.yaml`.

**If another runtime holds the lock** (see `.state/current.yaml:lock_until`), ask the user before proceeding.

---

# Shadow Stack Widget — AGENTS.md

> Multi-agent autonomous development system for macOS M1 development environment.

---

## PART 1 — System Prompt

### Роль и миссия

Ты — senior full-stack разработчик, специализирующийся на:

- macOS M1/M2 development environment automation
- Electron + React + Vite widgets
- Local LLM integration (Ollama, Comet/Opik)
- Playwright browser automation
- WebSocket real-time systems

### Принципы работы

1. **Всегда показывай PLAN перед IMPL** — сначала анализ, потом код
2. **Используй ASSUMPTION: маркеры** — явно помечай допущения
3. **START CONDITION** — начинай только после подтверждения плана
4. **OUTPUT Contract** — всегда выводи: PLAN → IMPL → RUNBOOK → CHECKLIST
5. **Security first** — не уезжай в небезопасный режим

---

## PART 2 — Skills

### SK1: Architecture (4 слоя)

```
┌─────────────────────────────────────────┐
│           Presentation (React)           │
├─────────────────────────────────────────┤
│     Orchestrator (State Machine)        │
├─────────────────────────────────────────┤
│    Tool Loops (Playwright, CLI)         │
├─────────────────────────────────────────┤
│   Infrastructure (WS, LLM, Chrome)     │
└─────────────────────────────────────────┘
```

**State Machine States:**

- `IDLE` → `PLANNING` → `EXECUTING` → `REPORTING` → `IDLE`
- `ERROR` → `RETRY` или `ABORT`

### SK2: Refactor (совместимость)

- Electron files: `.cjs` (CommonJS)
- Vite/React: `.jsx` (ESM)
- package.json: `"type": "module"`
- IPC bridge: `contextBridge` (security)

### SK3: Realtime (WebSocket events)

**Event Contract:**

```typescript
type AgentEvent =
  | { type: "STATE_CHANGE"; payload: ExecutionState }
  | { type: "TOOL_CALL"; payload: { tool: string; args: any } }
  | { type: "TOOL_RESULT"; payload: { tool: string; result: any } }
  | { type: "LLM_RESPONSE"; payload: { model: string; text: string } }
  | { type: "ERROR"; payload: { code: string; message: string } }
  | { type: "HEARTBEAT"; payload: { timestamp: number } };
```

### SK4: Browser (Playwright actions)

**Available Actions:**

- `navigate(url)` → Promise<void>
- `click(selector)` → Promise<void>
- `type(selector, text)` → Promise<void>
- `screenshot()` → Promise<Buffer>
- `evaluate(script)` → Promise<any>

### SK5: Local LLM (Comet/Ollama)

**Fallback Chain:**

1. Comet/Opik API (если настроен COMET_ENDPOINT)
2. Ollama localhost:11434 (модели: llama3.2, qwen2.5:3b)
3. Error message с инструкцией

**Request Format:**

```json
{
  "model": "llama3.2",
  "prompt": "...",
  "stream": false
}
```

### SK6: Reliability (backoff/retry/timeout)

```typescript
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await withTimeout(fn(), 60000);
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
};
```

### SK7: State (ExecutionState shape)

```typescript
interface ExecutionState {
  phase: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  status: "idle" | "running" | "done" | "error";
  currentStep?: number;
  steps: StepResult[];
  logs: LogEntry[];
  metrics: {
    startTime: number;
    endTime?: number;
    errors: number;
  };
}
```

### SK8: Security (no default user ID)

**GUARDRAIL:**

```
⚠️ ЗАПРЕЩЕНО: Использовать default user ID в production
ASSUMPTION: Безопасный режим требует явной авторизации
```

**manageConnections: true** в security skill для безопасной обработки OAuth.

### SK9: DX (scripts, модули)

```bash
npm run start        # GUI mode
npm run headless     # CLI mode
npm run build        # Production build
npm run test         # Tests
npm run lint         # ESLint
```

---

## PART 3 — Task

### Routes x6

1. `/api/execute` — POST, выполнение команды
2. `/api/state` — GET, текущее состояние
3. `/api/ws` — WebSocket, real-time events
4. `/api/llm/generate` — POST, запрос к LLM
5. `/api/browser/action` — POST, браузерная команда
6. `/api/health` — GET, health check

### Files x20

```
src/
├── main.cjs              # Electron main process
├── preload.cjs           # IPC bridge
├── server/
│   ├── index.ts          # Express server
│   ├── websocket.ts      # WS handler
│   ├── orchestrator.ts   # State machine
│   └── tools/
│       ├── browser.ts    # Playwright
│       ├── cli.ts        # Shell commands
│       └── llm.ts        # Ollama/Comet
├── components/
│   ├── Widget.tsx        # Main widget
│   ├── Terminal.tsx      # Log output
│   └── StatusBar.tsx     # Status indicators
├── hooks/
│   ├── useWebSocket.ts   # WS client
│   └── useAgent.ts       # Agent state
└── styles/
    └── widget.css        # Tailwind
```

### CLI Flags

```bash
--step=N         # Run specific step
--all            # Run all steps
--debug          # Debug output
--headless       # No GUI
--config=PATH    # Config file path
```

### npm Scripts

```json
{
  "start": "concurrently vite electron",
  "headless": "node main.cjs --headless",
  "dev": "vite",
  "build": "vite build",
  "test": "vitest",
  "lint": "eslint src"
}
```

---

## PART 4 — TODO (8 фаз)

### Phase 1: WebSocket (1-2 ч)

- [ ] Express server setup
- [ ] WebSocket event contract
- [ ] Client connection handling
- [ ] Event broadcasting

### Phase 2: Orchestrator (2-3 ч)

- [ ] State machine implementation
- [ ] Step execution engine
- [ ] Error handling
- [ ] Retry logic

### Phase 3: Chrome (1-2 ч)

- [ ] Playwright integration
- [ ] Browser actions
- [ ] Screenshot capture
- [ ] Page evaluation

### Phase 4: Comet (1-2 ч)

- [ ] Comet/Opik API client
- [ ] Fallback to Ollama
- [ ] Error reporting
- [ ] Fix suggestions

### Phase 5: Parallel modes (1 ч)

- [ ] Headless CLI mode
- [ ] GUI widget mode
- [ ] Mode switching

### Phase 6: Reports + CI (1 ч)

- [ ] Execution reports
- [ ] CI/CD integration
- [ ] GitHub Actions

### Phase 7: UI Polish (1-2 ч)

- [ ] Tailwind styling
- [ ] Animations
- [ ] Status indicators

### Phase 8: Hardening (1 ч)

- [ ] Security audit
- [ ] Error boundaries
- [ ] Performance optimization

---

## PART 5 — Output Contract

### Standard Output Format

````
═══════════════════════════════════════
PLAN #<номер> — <название фазы>
═══════════════════════════════════════

Что делаем:
1. ...
2. ...
3. ...

ASSUMPTION: ...
START CONDITION: [ ] Подтвердить план

───────────────────────────────────────
IMPL — Реализация
───────────────────────────────────────

<code>

───────────────────────────────────────
RUNBOOK — Как запустить
───────────────────────────────────────

```bash
<команды>
````

───────────────────────────────────────
CHECKLIST — Что проверить
───────────────────────────────────────

- [ ] Пункт 1
- [ ] Пункт 2
- [ ] Пункт 3

═══════════════════════════════════════

````

---

## PART 5.5 — Known Package Corrections

> Исправления для шагов 6 и 7 ( актуально на 2026-03-21)

### Step 6 — Vercel AI SDK

```bash
# ❌ НЕПРАВИЛЬНО (пакет не существует)
npm install vercel-ai
npm install @vercel/ai-sdk-core

# ✅ ПРАВИЛЬНО
npm install ai @ai-sdk/openai
```

### Step 7 — Playwright MCP

```bash
# ❌ НЕПРАВИЛЬНО (пакеты не существуют)
npm install @modelcontextprotocol/server-playwright
npm install @modelcontextprotocol/server-puppeteer

# ✅ ПРАВИЛЬНО
npm install -g @playwright/mcp@latest
npx playwright install chromium
```

---

## PART 6 — Guardrails (10 запретов)

1. **ЗАПРЕТ: default user ID в production**
2. **ЗАПРЕТ: секреты в коде** — используй .env
3. **ЗАПРЕТ: игнорировать ошибки** — всегда логируй
4. **ЗАПРЕТ: синхронный I/O** — только async/await
5. **ЗАПРЕТ: memory leaks** — очищай event listeners
6. **ЗАПРЕТ: insecure IPC** — всегда contextBridge
7. **ЗАПРЕТ: shell injection** — валидируй input
8. **ЗАПРЕТ: игнорировать type safety** — TypeScript strict mode
9. **ЗАПРЕТ: блокировать main thread** — выноси в workers
10. **ЗАПРЕТ: silently fail** — всегда есть fallback

---

## PART 7 — Success Definition (7 критериев)

### Критерий 1: Functionality
- [ ] Widget запускается без ошибок
- [ ] Все 8 шагов выполняются
- [ ] WebSocket events работают

### Критерий 2: Performance
- [ ] Startup < 3 секунды
- [ ] Memory < 200MB
- [ ] No blocking operations

### Критерий 3: Reliability
- [ ] Retry logic работает
- [ ] Error boundaries не дают крашу
- [ ] Graceful degradation

### Критерий 4: Security
- [ ] contextBridge isolation
- [ ] No default credentials
- [ ] Secrets in .env only

### Критерий 5: Developer Experience
- [ ] `npm run start` работает
- [ ] `npm run headless` работает
- [ ] Debug logs informative

### Критерий 6: Testing
- [ ] Unit tests for orchestrator
- [ ] Integration tests for WS
- [ ] E2E tests for widget

### Критерий 7: Documentation
- [ ] AGENTS.md актуален
- [ ] README с примерами
- [ ] JSDoc для функций

---

## Quick Start

```bash
# 1. Перейти в проект
cd ~/shadow-stack_local_1

# 2. Запустить все сервисы через tmux
./scripts/tmux-shadow.sh

# 3. Или открыть OpenCode
opencode

# 4. Первая команда агенту
"Read AGENTS.md and CLAUDE.md, then start with PLAN for Phase 1"
```

---

## Resources

1. AGENTS.md (this file)
2. tr-userid-best-practices.md
3. Автономная ИИ-разработка на Mac M1.md
4. Полезные ресурсы от Вали Денисова.md

---

## Steps 8–11 Status

| Step | Компонент         | Команда запуска                                                                              |
| ---- | ----------------- | -------------------------------------------------------------------------------------------- |
| 8    | Supabase/pgvector | docker start shadow-pgvector (⚠️ запрещено на M1 8GB — используй fallback файл)             |
| 9    | Langfuse          | cd ~/shadow-stack/langfuse && docker-compose up -d (⚠️ только если есть свободная RAM)      |
| 10   | Tailscale         | sudo tailscale up && tailscale serve 3001                                                    |
| 11   | Telegram Bot      | cd ~/shadow-stack_local_1 && PORT=4000 node bot/opencode-telegram-bridge.cjs                |

---

## MEMORY INTEGRATION (OmniRoute / Agents)

### Правило 1: MEMORY FIRST
Перед любой сложной задачей:
→ Вызови `memory-retrieve` skill, чтобы найти прошлые баги, архитектурные решения или контекст.

```javascript
const { smartRetrieve } = await import('./scripts/memory-mcp.js');
const context = await smartRetrieve("описание задачи", 3);
```

### Правило 2: STORE KNOWLEDGE
После фикса сложного бага, рефакторинга или архитектурного решения:
→ Вызови `memory-store` skill, чтобы сохранить знания для будущих сессий.

```javascript
const { smartStore } = await import('./scripts/memory-mcp.js');
await smartStore("описание решения", { source: "файл", tags: "тип", type: "fix" });
```

### Правило 3: COMPACTION
- Порог компрессии: 80% контекста использовано
- После компрессии: записать summary в SESSION.md
- Приоритеты загрузки: CLAUDE.md → handoff.md → SESSION.md → SKILL.md

### Правило 4: EMBEDDING SAFETY (M1 8GB)
- **КРИТИЧНО**: Всегда `keep_alive: 0` после эмбеддингов (nomic-embed-text)
- Никогда `Promise.all` для множественных эмбеддингов — только `for...of`
- Модель занимает ~280MB VRAM — выгружай сразу после использования

### Индексация базы знаний
```bash
source .venv/bin/activate && python scripts/index_knowledge.py
```

### Конфиг памяти
Файл: `openclaw.config.json`
- Vector DB: `./memory/shadow_memory` (ChromaDB PersistentClient, на диск)
- Embedding: `nomic-embed-text` через Ollama REST API
- Chunks: 500 chars с 50-char overlap

---

## Browser Fallback Fix

When running in browser mode (not Electron), `window.electronAPI` is undefined. The widget now handles this gracefully:

```js
if (window.electronAPI?.runCommand) {
  result = await window.electronAPI.runCommand(step.code);
} else {
  result = [
    "⚠️  Браузерный режим — bash команды недоступны.",
    "Для реального выполнения запустите:",
    "  cd ~/shadow-stack-widget && npm run start",
    "",
    "📋 Команда для ручного выполнения:",
    step.code,
  ].join("\n");
}
```

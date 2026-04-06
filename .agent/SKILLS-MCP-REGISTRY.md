# Shadow Stack — Skills & MCP Registry

**Updated:** 2026-04-06 05:16 UTC
**Total Skills:** 24
**MCP Servers:** 2

## Skills Registry

### Knowledge & Memory
1. **notebooklm-kb** — RAG к базе знаний через NotebookLM CLI/Web
   - Tags: knowledge, rag, notebooklm, research
   - Web: https://notebooklm.google.com/notebook/489988c4-0293-44f4-b7c7-ea1f86a08410

2. **memory-store** — Сохранение знаний в ChromaDB + Ollama nomic-embed-text
   - Use: AFTER fixing bugs, architecture decisions

3. **memory-retrieve** — Поиск в ChromaDB памяти
   - Use: BEFORE complex tasks

4. **memory** — Hierarchical memory (Supermemory RAG + ChromaDB)

5. **kb** — Knowledge base sync (NotebookLM, shadow-stack-kb)

### Context Optimization
6. **skillful** — Ленивая загрузка skills (метаданные → полный SKILL.md по требованию)
   - Tags: context-optimization, lazy-loading, memory-efficiency

7. **session-loader** — Автоматическая загрузка skills и MCP на основе фазы
   - Tags: session-management, skill-loading, mcp, automation

### Security
8. **vibeguard** — Защита секретов и PII перед отправкой в облако
   - Tags: security, secrets, pii-protection

9. **safety** — RAM monitoring and protection (prevent OOM on M1 8GB)

### Generators
10. **cli-anything** — Генератор CLI из API/документации (7-фазный pipeline)
    - Tags: cli-generation, automation, tool-construction

11. **ui-dashboard-designer** — Генерация React компонентов из дизайн-токенов
    - Tags: ui-generation, design-tokens, react, pixel-perfect

### Orchestration
12. **shadow-stack-orchestrator** — Anti-Gravity orchestrator (фазы, задачи, Ralph Loop)
    - Tags: orchestrator, shadow-stack, phases, electron

13. **ralph-loop** — Autonomous coding loop (READ → PLAN → EXEC → TEST → COMMIT)

14. **ralph** — Ralph Loop methodology

### Infrastructure
15. **devops** — Deploy ops (Vercel, backup, secrets management)

16. **cascade** — Cascade model routing (Groq → Mistral → OpenRouter → Ollama)

17. **proxy-sse-fix** — SSE streaming fix для proxy

18. **telegram-bot** — Telegram bot integration

19. **shadow-router** — Playwright CDP router

20. **vector-memory-sync** — Vector memory synchronization

### Design
21. **design-system** — Design tokens and system

### Other
22. **superlocalmemory-memory** — Local memory implementation

## MCP Servers

### 1. Supermemory ✅
- **Status:** Connected
- **Endpoint:** https://api.supermemory.ai/mcp
- **Auth:** OAuth (authenticated)
- **Use:** Hierarchical memory, cross-session knowledge

### 2. Vercel ⚠️
- **Status:** Needs authentication
- **Endpoint:** https://mcp.vercel.com
- **Auth:** OAuth (not configured)
- **Use:** Vercel deployments (optional)

## Phase → Skills Mapping

### Phase 5.2 (OpenCode Plugins)
- Skills: notebooklm-kb, skillful, vibeguard
- MCP: supermemory

### Phase 5.3 (Generators)
- Skills: cli-anything, ui-dashboard-designer, notebooklm-kb
- MCP: supermemory

### Phase 5.4 (Session Protocol)
- Skills: session-loader, notebooklm-kb, skillful
- MCP: supermemory

### Phase 6 (ChromaDB Migration)
- Skills: chromadb-migration, notebooklm-kb, memory
- MCP: supermemory, chromadb

### Default
- Skills: notebooklm-kb, skillful, vibeguard
- MCP: supermemory

## Usage

### Load skills for current phase
```bash
.agent/skills/session-loader/load-skills.sh
```

### Check MCP status
```bash
opencode mcp list
```

### Query NotebookLM
```bash
~/.venv/notebooklm/bin/notebooklm ask "question"
```

### Recall from Supermemory
```bash
# Via MCP
mcp__mcp-supermemory-ai__recall "query"
```

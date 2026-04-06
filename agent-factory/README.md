# Agent Factory

Автономный агентный конвейер для генерации сайтов/приложений по командам из Telegram.  
Работает на Mac mini M1 8GB, $0 бюджет, свободные LLM.

## Архитектура

```
Telegram /build "описание"
    ↓
  Orchestrator (Claude)
    ├─ Researcher → OmniRoute :20130
    ├─ Planner    → todo.md
    ├─ Executor   → Ralph Loop → OmniRoute :20130
    └─ Auditor    → QA + deploy Netlify
```

## Сервисы

| Сервис | Порт | Роль |
|---------|------|------|
| Express API | 3001 | REST gateway + /health |
| OmniRoute | 20130 | Unified cloud cascade |
| ZeroClaw | 4111 | Ollama proxy |
| n8n | 5678 | Emergency workflows |
| Ollama | 11434 | Локальные модели |

## Быстрый старт

```bash
git clone https://github.com/huivrotiki/agent-factory
cd agent-factory
cp .env.example .env  # заполнить токены
npm install
npm run dev
```

## Каскад LLM

```
anthropic → openrouter → ollama → n8n
```

## Документация

- [CLAUDE.md](./CLAUDE.md) — мастер конфиг
- [.claude/rules/routing.md](./.claude/rules/routing.md) — правила делегации
- [.agent/knowledge/agent-factory-kb.md](./.agent/knowledge/agent-factory-kb.md) — база знаний

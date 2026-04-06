# Workflow Rules — Shadow Stack (единственный источник истины)

> Все агенты (claude-code, opencode, kiro, zeroclaw) обязаны следовать этим правилам.
> CLAUDE.md и AGENTS.md ссылаются сюда, не дублируют.

## 1. Secrets
Только через Doppler: `doppler run --project serpent --config dev -- <cmd>`
Хардкод ключей = reject коммита (pre-commit hook).

## 2. Commits
Conventional Commits: `feat: / fix: / refactor: / docs: / chore:`
Server = CJS. Frontend = JSX. TypeScript запрещён в `server/`.

## 3. Sync Protocol
Перед коммитом: `git status` → читать `handoff.md` → обновить `.state/session.md` → сохранить в Supermemory.

## 4. Routing
Любой LLM-запрос → OmniRoute `:20130`.
Исключение: local-first Ollama через ZeroClaw `:4111`.
`shadow-api /api/cascade` = тонкий HTTP forward к OmniRoute.

## 5. RAM Guard
`free_mb < 400` → только cloud. `< 200` → ABORT + Telegram alert.

## 6. Handoff
В конце сессии обновлять `handoff.md` с реальным состоянием (порты, сервисы, провайдеры).

## 7. Vercel
Запрещён из `shadow-stack_local_1` (другой проект).

## 8. ESM
Запрещён в `server/`. Только CJS.

## Порты (актуальные)
| Сервис | Порт |
|--------|------|
| shadow-api | 3001 |
| free-models-proxy | 20129 |
| OmniRoute (KiroAI) | 20130 |
| ZeroClaw Control | 4111 |
| agent-bot (Telegram) | 4000 |

## Supermemory Namespaces
| Namespace | Tag | TTL | Когда использовать |
|-----------|-----|-----|-------------------|
| routing | routing | 90d | Изменения routing/каскада |
| architecture | architecture | 365d | Архитектурные решения, удаление компонент |
| sessions | sessions | 30d | Краткие summary сессий |
| incidents | incidents | 180d | Баги, падения провайдеров |

# ZeroClaw — Full Specification

## QUESTION POLICY
1. Внутренний вопрос → **Antigravity** (Search)
2. Не найдено → **NotebookLM** (KB)
3. Failed → `.state/unresolved.md` + продолжить
4. Эскалация → только бизнес-решения

**Никаких технических вопросов пользователю.**

## TASK ROUTING
- **Claude Code**: только новый `active-spec.md` или смена архитектуры
- **OpenCode**: основной исполнитель (Files/Shell/Git)
- **Antigravity**: веб-поиск, анализ зависимостей
- **Kiro**: генерация по жёстким шаблонам (Configs/README/Tables)

## COGNITIVE SYNC
- Supermemory tag: `shadow-stack-v1` → архитектурные решения прошлых сессий
- NotebookLM query: *"Какие skills из .agent/skills/ нужны для задачи [X]? Стратегия с учётом M1 8GB?"*
- Output: `context_bridge.json` → Claude Code

## RALPH LOOP DETAIL
| Step | Action |
|------|--------|
| R — Retrieve | Antigravity / Supermemory |
| A — Act | OpenCode / Kiro |
| L — Learn | Анализ логов и ошибок |
| P — Persist | `.state/session.md` + Supermemory |
| H — Handoff | Следующий CP или пользователю |
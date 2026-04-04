# Auditor Agent

## Проверки
- [ ] HTML валиден
- [ ] Нет пластехолдеров
- [ ] Нет API ключей в коде
- [ ] Lighthouse baseline (рендер Netlify)
- [ ] Каскад работает (tag: cascade_bug)

## Стоп-фразы
"я не знаю", "попробуй сам", "это сложно" — если Executor пишет такое, эскалация к Orchestrator.

## Деплой
Коммит только после Auditor PASS.

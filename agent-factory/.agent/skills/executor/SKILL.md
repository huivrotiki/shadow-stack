# Executor Agent — Ralph Loop

## Цикл

```
read PRD → pick task → implement → test → commit → повтор
```

## Правила

1. Брать только первую незаконченную задачу из todo.md
2. Лимит контекста → суммаризация shadow-general → передача
3. Никогда не пишешь placeholder-код
4. Коммит после каждой фазы

## Инструменты
`anthropic → openrouter → ollama:shadow-coder`

# OpenCode Ralph Loop Prompt

Copy-paste this into OpenCode to start the autonomous loop.

---

```
@PRD.md
@progress.txt
@.agent/implementation-plan.md
@.agent/decisions.md

Ты работаешь в Ralph-loop режиме.

Правила:
1. Прочитай progress.txt и выбери ОДИН следующий PRD-элемент с максимальным риском или зависимостью (незавершенный, dependencies выполнены).
2. Работай только над ОДНИМ логическим изменением. Не делай 2 задачи за итерацию.
3. После изменений обязательно запусти:
   - npm run typecheck
   - npm run lint
   - npm run test
4. Если что-то упало — исправь в этой же итерации. Не переходи к следующей задаче с красными проверками.
5. Обнови progress.txt:
   - измени статус задачи на "done"
   - укажи какие файлы изменены
   - запиши блокеры если есть
6. Обнови PRD.md: поставь passes: true у выполненной задачи.
7. Обнови .agent/decisions.md:
   - почему выбрана именно эта задача
   - что было сделано
   - что проверено
8. Сделай один маленький git commit с сообщением вида: "feat(A1): config loader"
9. Если ВСЕ задачи в PRD имеют passes: true и все проверки зеленые — выведи <promise>DONE</promise>.
10. Если PRD не завершен — НЕ останавливайся с заявлением "готово". Заверши только текущую итерацию.

Начинай с Фазы A, задачи A1 (Config Loader) — это первая задача без зависимостей.
```

---

## AFK Loop (bash)

```bash
for i in {1..8}; do
  echo "=== Iteration $i ==="
  result=$(opencode "@PRD.md @progress.txt @.agent/implementation-plan.md @.agent/decisions.md
  Продолжай Ralph-loop.
  Выбери следующий незавершенный PRD-элемент.
  Сначала проверь git diff, progress.txt и результаты прошлых проверок.
  Выполни только один маленький шаг.
  Обязательно прогони typecheck, lint, test.
  Обнови progress.txt, PRD.md и decisions.md.
  Если всё PRD завершено и проверки зеленые, выведи <promise>DONE</promise>.")
  echo "$result"
  if [[ "$result" == *"<promise>DONE</promise>"* ]]; then
    echo "All done after $i iterations."
    break
  fi
done
```

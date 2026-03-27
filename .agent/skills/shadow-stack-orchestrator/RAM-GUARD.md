# RAM-GUARD Skill

## Trigger
Запускать ПЕРЕД: browser / playwright / shadow-router / ollama-7b

## Check
GET http://localhost:3001/ram
→ parse: { free_mb, safe, critical }

## Decision Tree
| free_mb   | Действие                               |
|-----------|----------------------------------------|
| < 200 MB  | 🔴 ABORT + notify telegram             |
| < 400 MB  | 🟡 ollama-3b only, skip browser        |
| < 2000 MB | 🟡 ollama-7b ok, skip browser          |
| ≥ 2000 MB | 🟢 all providers available             |

## Never
- 2 Ollama models simultaneously
- Models > 4GB
- Playwright if safe === false

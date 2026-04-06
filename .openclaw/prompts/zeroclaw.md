# 🧠 ZEROCLAW: THE HUB (v5.3)
**Runtime: Node.js/Rust | Port: 4111 | Telegram: :4000**

→ Full spec: [zeroclaw-spec.md](./zeroclaw-spec.md)
→ Bootstrap: [skill-bootstrapper.md](../skills/skill-bootstrapper.md)

## INIT_SEQUENCE (ОБЯЗАТЕЛЕН)
1. **Skill Loader** → `.openclaw/skills/` метаданные (lazy)
2. **Supermemory** → `recall(tag: "shadow-stack-v1")`
3. **NotebookLM** → стратегический запрос → `context_bridge.json`
4. **RAM Check** → `curl http://localhost:3001/ram` (abort < 250MB)
5. **Telegram** → если 409 → `deleteWebhook` → restart

## ROUTING
| Тип | Куда |
|-----|------|
| Routine | Claude Proxy (ответить самому) |
| Complex | Claude Code (plan) |
| Technical | Antigravity |
| Urgent | Emergency Action (pkill/reset) |

## RALPH LOOP (autonomous)
`R → A → L → P → H`

## HEARTBEAT
- 30 min interval; Morning Brief 09:00 → `.state/todo.md`
- RAM < 300MB → предложить `pkill -f ollama`
- Idle > 25 min & phase ≠ idle → `triggerResume`

## OUTPUT (Telegram)
```
🔔 *[ZeroClaw PM]*
- Status: <Phase/CP>
- Action: <Current Work>
- Context: <RAM/Latency>
```
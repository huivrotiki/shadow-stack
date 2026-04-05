# Handoff — 2026-04-05m

## Статус: ✅ ПОЛНОСТЬЮ РАБОЧИЙ

### Что работает
- `free-models-proxy` на `:20129` — SSE streaming, echo model id, tier-first routing
- `omniroute-kiro` на `:20130` — PM2 + doppler, autostart через launchd
- `auto` route → openrouter/qwen3.6-plus:free (не ollama)
- Fallback: copilot → openrouter → ollama

### Текущие процессы
- PID 17155 — free-models-proxy (doppler run, shadow-stack_local_1)
- PM2 id 12 — omniroute-kiro (PORT=20130)

### Проблема которую решили
TaskRouter.classify() матчил "test" как fast-tier → ollama. Фикс:
1. Убрали "test" из fast-паттернов
2. Tier dominance over score — score только circuit breaker (score < 0.3)
3. Default chat: copilot-first
4. provider-scores.json сброшен (были 30s timeout biases)

### Следующие задачи
1. **Persist прокси в PM2** с doppler:
   ```
   pm2 start "doppler run --project serpent --config dev -- node server/free-models-proxy.cjs" \
     --name free-models-proxy --cwd /Users/work/shadow-stack_local_1
   pm2 save
   ```
2. **ZeroClaw оркестратор** — проверить pm2 drift (cwd reconcile)
3. **Claude Code через прокси** — shim на :20130 или /v1/messages endpoint
4. **git pull --rebase** — ветка разошлась с origin

### Первая команда для новой сессии
```bash
lsof -i :20129 -i :20130 | grep LISTEN
pm2 ls
git -C ~/shadow-stack_local_1 status
```

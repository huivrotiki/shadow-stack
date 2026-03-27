# DEPLOY Skill — Vercel + GitHub

## Commands

| Command | Action |
|---------|--------|
| /deploy | Деплой dashboard на Vercel |
| /status | Показать статус всех сервисов |
| /sync | Ручной GDrive sync |

## Vercel Deploy Flow
1. Build: `npm run build`
2. Deploy: `vercel --prod --yes`
3. URL: https://health-dashboard-*.vercel.app

## GitHub Workflow
- Path: `.github/workflows/`
- Trigger: push to main
- Action: deploy-dashboard.yml

## Health Check Endpoints
- http://localhost:3001/health
- http://localhost:18789/health (OpenClaw)
- http://localhost:3001/ram

## Quick Deploy
```bash
doppler run -- vercel deploy --prod
```

#!/bin/bash
case "$1" in
  "/start_stack") osascript ~/shadow-stack_local_1/scripts/mac/start_stack.scpt ;;
  "/health") curl -s http://localhost:3001/ПРАВИЛЬНЫЙ_ENDPOINT ;;
  "/dashboard") osascript ~/shadow-stack_local_1/scripts/mac/open_dashboard.scpt ;;
  "/deploy") cd ~/shadow-stack_local_1/health-dashboard && vercel deploy --prod ;;
  "/openclaw") open http://127.0.0.1:18789/ ;;
  *) echo "Unknown: $1" ;;
esac

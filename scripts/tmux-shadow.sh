#!/usr/bin/env bash
# tmux-shadow.sh — Launch all Shadow Stack services in tmux
# Usage: ./scripts/tmux-shadow.sh

SESSION="shadow-stack"
PROJECT="$HOME/shadow-stack_local_1"

# If session exists, attach to it
if tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "Session '$SESSION' already exists. Attaching..."
  exec tmux attach -t "$SESSION"
fi

# ── Window 1: Services (2x2 grid) ──
tmux new-session -d -s "$SESSION" -n services -c "$PROJECT"

# Pane 0 (top-left): Express API :3001
tmux send-keys -t "$SESSION:services" "node server/index.js" Enter

# Pane 1 (top-right): Shadow Router :3002
tmux split-window -h -t "$SESSION:services" -c "$PROJECT"
tmux send-keys -t "$SESSION:services.1" "node server/shadow-router.cjs" Enter

# Pane 2 (bottom-left): Telegram Bot :4000
tmux split-window -v -t "$SESSION:services.0" -c "$PROJECT"
tmux send-keys -t "$SESSION:services.2" "PORT=4000 node bot/opencode-telegram-bridge.cjs" Enter

# Pane 3 (bottom-right): Health Dashboard :5176
tmux split-window -v -t "$SESSION:services.1" -c "$PROJECT/health-dashboard"
tmux send-keys -t "$SESSION:services.3" "npm run dev" Enter

# ── Window 2: Monitor ──
tmux new-window -t "$SESSION" -n monitor -c "$PROJECT"
tmux send-keys -t "$SESSION:monitor" "htop" Enter

# ── Window 3: Logs ──
tmux new-window -t "$SESSION" -n logs -c "$PROJECT"
tmux send-keys -t "$SESSION:logs" "echo '=== Shadow Stack Logs ===' && tail -f data/*.log 2>/dev/null || echo 'No log files yet. Use: lnav data/'" Enter

# ── Window 4: Work (empty shell) ──
tmux new-window -t "$SESSION" -n work -c "$PROJECT"

# Focus on services window
tmux select-window -t "$SESSION:services"

# Attach
exec tmux attach -t "$SESSION"

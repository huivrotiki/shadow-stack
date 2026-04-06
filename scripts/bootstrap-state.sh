#!/usr/bin/env bash
# bootstrap-state.sh — idempotent setup of .state/ layer
# Safe to re-run: will not overwrite existing files.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

mkdir -p .state/runtimes docs/plans docs/sessions docs/handoffs docs/services

NOW="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
COMMIT="$(git rev-parse --short HEAD)"

if [ ! -f .state/current.yaml ]; then
  cat > .state/current.yaml <<EOF
version: 1
project: shadow-stack-local
updated: ${NOW}
active_runtime: null
lock_until: null

plan:
  file: docs/plans/plan-v2-2026-04-04.md
  phase: R0
  step: R0.0
  next: R0.1

session:
  file: .state/session.md
  started: ${NOW}
  runtime_history: []

handoff:
  file: handoff.md
  last_updated: null

memory:
  supermemory_dir: ~/.claude/projects/-Users-work-shadow-stack-local-1/memory/
  notebooks_dir: notebooks/
  last_save: null

todos:
  file: .state/todo.md

git:
  branch: ${BRANCH}
  last_commit: ${COMMIT}
  auto_commit_state: true

services_registry: docs/SERVICES.md
EOF
  echo "✅ created .state/current.yaml"
else
  echo "⏭  .state/current.yaml exists, skipping"
fi

if [ ! -f .state/session.md ]; then
  echo "# Session $(date -u +%Y-%m-%d)" > .state/session.md
  echo "" >> .state/session.md
  echo "✅ created .state/session.md"
else
  echo "⏭  .state/session.md exists, skipping"
fi

if [ ! -f .state/todo.md ]; then
  cat > .state/todo.md <<'EOF'
# Todos — shadow-stack-local

## Active

## Blockers

## Backlog
EOF
  echo "✅ created .state/todo.md"
else
  echo "⏭  .state/todo.md exists, skipping"
fi

echo ""
echo "✅ .state/ bootstrapped at ${NOW}"

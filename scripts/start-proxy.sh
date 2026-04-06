#!/bin/bash
# Start free-models-proxy via Doppler (all 13 API keys injected from serpent/dev).
# Replaces the old hardcoded-keys ecosystem.proxy.cjs approach.
set -e

cd "$(dirname "$0")/.."
export PATH="/opt/homebrew/bin:$PATH"

# Stop existing instance if any (idempotent) — cover both legacy names
pm2 delete free-models-proxy ecosystem.proxy 2>/dev/null || true

# Start with Doppler env injected. We start the script file directly with an
# explicit --name, because pm2 only auto-detects ecosystem files named
# `ecosystem.config.{js,cjs}` — `ecosystem.proxy.cjs` would be treated as a
# plain script and silently exit (no server listening).
doppler run --project serpent --config dev -- \
  pm2 start server/free-models-proxy.cjs \
    --name free-models-proxy \
    --update-env

pm2 save >/dev/null
echo "✅ free-models-proxy started with Doppler env"
pm2 list | grep free-models-proxy

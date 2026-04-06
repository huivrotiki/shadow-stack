#!/bin/bash
export DATA_DIR="$HOME/.omniroute"
export PORT=20130
export INITIAL_PASSWORD=shadow-stack-2026
unset NODE_APP_INSTANCE
exec /Users/work/.nvm/versions/node/v22.22.2/bin/node \
  /Users/work/.nvm/versions/node/v22.22.2/lib/node_modules/omniroute/app/server.js

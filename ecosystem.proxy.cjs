'use strict';
// Start via: doppler run --project serpent --config dev -- pm2 start ecosystem.proxy.cjs
// All API keys MUST come from Doppler — never hardcode here (file is .gitignored
// but still on disk, and pm2 dumps include env). See scripts/start-proxy.sh.
module.exports = {
  apps: [{
    name: 'free-models-proxy',
    script: 'server/free-models-proxy.cjs',
    cwd: '/Users/work/shadow-stack_local_1',
    // env intentionally empty — pm2 inherits env from parent shell (doppler run)
    env: {},
  }],
};

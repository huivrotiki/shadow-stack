const env = require('dotenv').config({ path: '/Users/work/shadow-stack_local_1/.env' }).parsed || {}

module.exports = {
  apps: [
    {
      name: 'shadow-api',
      script: './server/index.js',
      cwd: '/Users/work/shadow-stack_local_1',
      env: env,
    },
    {
      name: 'shadow-bot',
      script: './bot/opencode-telegram-bridge.cjs',
      cwd: '/Users/work/shadow-stack_local_1',
      env: env,
    }
  ]
}

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
    },
    {
      name: 'litellm-proxy',
      script: 'litellm',
      args: '--model ollama/qwen2.5-coder:3b --port 4001',
      cwd: '/Users/work/shadow-stack_local_1',
      interpreter: 'none',
      env: {
        ...env,
        LITELLM_MASTER_KEY: env.LITELLM_MASTER_KEY || 'sk-shadow-local',
      },
    }
  ]
}

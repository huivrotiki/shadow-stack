module.exports = {
  apps: [
    {
      name: 'agent-api',
      script: 'server/index.js',
      instances: 1,
      max_memory_restart: '300M',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'agent-bot',
      script: 'bot/telegram-bot.cjs',
      instances: 1,
      max_memory_restart: '300M',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'zeroclaw',
      script: 'server/zeroclaw-gateway.cjs',
      instances: 1,
      max_memory_restart: '150M',
      env: { NODE_ENV: 'production' }
    }
  ]
};

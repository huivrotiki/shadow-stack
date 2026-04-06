module.exports = {
  apps: [
    {
      name: 'shadow-api',
      script: './server/index.js',
      cwd: '/Users/work/shadow-stack_local_1',
      max_memory_restart: '500M',
    },
    {
      name: 'shadow-bot',
      script: './bot/opencode-telegram-bridge.cjs',
      cwd: '/Users/work/shadow-stack_local_1',
      max_memory_restart: '500M',
    },
    {
      name: 'litellm-proxy',
      script: 'litellm',
      args: '--model ollama/qwen2.5-coder:3b --port 4001',
      cwd: '/Users/work/shadow-stack_local_1',
      interpreter: 'none',
      max_memory_restart: '500M',
    },
    {
      name: 'sub-kiro',
      script: './server/sub-agent.cjs',
      cwd: '/Users/work/shadow-stack_local_1',
      node_args: '--max-old-space-size=256',
      max_memory_restart: '300M',
    }
  ]
}

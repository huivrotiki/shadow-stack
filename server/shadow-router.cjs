'use strict';
// Shadow Router — маршрутизация запросов согласно .claude/rules/routing.md
const { cascade } = require('./lib/ai-sdk.cjs');

const TASK_ROUTES = {
  research:    { preferred: 'deerflow',    chain: ['deerflow', 'openrouter', 'anthropic'] },
  analysis:    { preferred: 'deerflow',    chain: ['deerflow', 'openrouter', 'anthropic'] },
  codegen:     { preferred: 'anthropic',   chain: ['anthropic', 'openrouter', 'ollama'] },
  refactor:    { preferred: 'anthropic',   chain: ['anthropic', 'openrouter', 'ollama'] },
  planning:    { preferred: 'deerflow',    chain: ['deerflow', 'anthropic', 'ollama'] },
  content:     { preferred: 'openrouter',  chain: ['openrouter', 'ollama', 'deerflow'] },
  'ultra-light': { preferred: 'ollama',   chain: ['ollama', 'openrouter'] },
  emergency:   { preferred: 'n8n',         chain: ['n8n', 'ollama'] },
  default:     { preferred: 'anthropic',   chain: ['anthropic', 'openrouter', 'deerflow', 'ollama', 'n8n'] }
};

async function route(taskType, prompt, opts = {}) {
  const routing = TASK_ROUTES[taskType] || TASK_ROUTES.default;
  return cascade(prompt, { ...opts, chain: routing.chain });
}

module.exports = { route, TASK_ROUTES };

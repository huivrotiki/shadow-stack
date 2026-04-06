'use strict';
// Shadow Router — маршрутизация запросов через OmniRoute :20128
const { cascade } = require('./lib/ai-sdk.cjs');

const TASK_ROUTES = {
  research:    { preferred: 'omniroute',   chain: ['omniroute', 'ollama'] },
  analysis:    { preferred: 'omniroute',   chain: ['omniroute', 'ollama'] },
  codegen:     { preferred: 'omniroute',   chain: ['omniroute', 'ollama'] },
  refactor:    { preferred: 'omniroute',   chain: ['omniroute', 'ollama'] },
  planning:    { preferred: 'omniroute',   chain: ['omniroute', 'ollama'] },
  content:     { preferred: 'omniroute',   chain: ['omniroute', 'ollama'] },
  'ultra-light': { preferred: 'ollama',    chain: ['ollama', 'omniroute'] },
  emergency:   { preferred: 'n8n',         chain: ['n8n', 'ollama'] },
  default:     { preferred: 'omniroute',   chain: ['omniroute', 'ollama', 'n8n'] }
};

async function route(taskType, prompt, opts = {}) {
  const routing = TASK_ROUTES[taskType] || TASK_ROUTES.default;
  return cascade(prompt, { ...opts, chain: routing.chain });
}

module.exports = { route, TASK_ROUTES };

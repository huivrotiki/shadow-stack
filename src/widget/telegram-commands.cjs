/**
 * Telegram Command Handler — standalone CJS module
 *
 * Extracted from shadow-stack-widget-1/app/api/telegram-webhook/route.ts
 * No Next.js, no @ai-sdk, no zod — plain Node.js only.
 * Routes calls through http://localhost:3001/api/route via fetch.
 */

const ROUTER_BASE = process.env.ROUTER_BASE || 'http://localhost:3001';

// --- Help text ---

const HELP_TEXT = [
  '🤖 *Shadow Stack Auto-Router*',
  '',
  'Команды:',
  '/help — список команд',
  '/status — статус оркестратора',
  '/deploy — Vercel production deploy',
  '/premium — Claude Sonnet (платно)',
  '/deep — Perplexity поиск',
  '/grok — Grok AI',
  '/escalate — мета-эскалация проблемы (AI chain → human)',
  '/usage — текущие квоты провайдеров',
  '/test-router — тест роутинга (показывает route без вызова LLM)',
  '',
  'Обычный текст → автоматический роутинг:',
  '• < 80 символов → Ollama qwen2.5-coder:3b (локально)',
  '• >= 80 символов → Ollama qwen2.5:7b (локально)',
  '• Fallback → OpenRouter (бесплатно)',
].join('\n');

// --- Command parser ---

/**
 * Parse a Telegram message into command + remaining text.
 * @param {string} text
 * @returns {{ command: string|null, rest: string }}
 */
function parseCommand(text) {
  const match = text.match(/^(\/\w+)(?:\s+(.*))?$/s);
  if (!match) return { command: null, rest: text };
  return { command: match[1], rest: (match[2] || '').trim() };
}

// --- Auto-routing logic ---

/**
 * Determine Ollama model based on prompt length.
 * < 80 chars  → 3b (fast, light)
 * >= 80 chars → 7b (deeper reasoning)
 *
 * @param {string} text
 * @returns {{ model: string, reason: string }}
 */
function getAutoRoute(text) {
  if (text.length < 80) {
    return { model: 'qwen2.5-coder:3b', reason: 'short prompt (<80 chars) → 3b' };
  }
  return { model: 'qwen2.5:7b', reason: 'long prompt (>=80 chars) → 7b' };
}

// --- Internal fetch helper ---

async function routerFetch(path, body) {
  const url = `${ROUTER_BASE}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  return res.json();
}

// --- Command handlers ---

const handlers = {
  async '/help'() {
    return HELP_TEXT;
  },

  async '/status'() {
    try {
      const data = await routerFetch('/api/orchestrator/prompt', {
        text: 'status',
        sessionId: 'telegram',
      });
      return `📊 Status:\n\`\`\`\n${JSON.stringify(data, null, 2).slice(0, 3500)}\n\`\`\``;
    } catch {
      return '⚠️ Orchestrator недоступен';
    }
  },

  async '/deploy'(_rest, chatId) {
    const result = await routerFetch('/api/route', {
      text: 'deploy',
      command: '/deploy',
      chatId,
      sessionId: `tg-${chatId}`,
    });
    return formatRouteResult(result);
  },

  async '/premium'(rest, chatId) {
    const result = await routerFetch('/api/route', {
      text: rest || 'premium request',
      command: '/premium',
      chatId,
      sessionId: `tg-${chatId}`,
    });
    return formatRouteResult(result);
  },

  async '/deep'(rest, chatId) {
    const result = await routerFetch('/api/route', {
      text: rest || 'deep search',
      command: '/deep',
      chatId,
      sessionId: `tg-${chatId}`,
    });
    return formatRouteResult(result);
  },

  async '/grok'(rest, chatId) {
    const result = await routerFetch('/api/route', {
      text: rest || 'grok query',
      command: '/grok',
      chatId,
      sessionId: `tg-${chatId}`,
    });
    return formatRouteResult(result);
  },

  async '/escalate'(rest) {
    const problem = rest || 'Unknown problem — manual escalation requested';
    try {
      const data = await routerFetch('/api/route', {
        text: problem,
        command: '/escalate',
        sessionId: 'telegram-escalate',
      });
      if (data.attempts) {
        const icon = data.status === 'resolved' ? '✅' : data.status === 'waiting_for_human' ? '⏳' : '❌';
        const tiers = data.attempts
          .map((a) => `${a.success ? '✅' : '❌'} ${a.tier} (${a.durationMs}ms)`)
          .join('\n');
        return [
          `${icon} *Meta-Escalation: ${data.status}*`,
          `Resolved by: ${data.resolvedBy || 'n/a'}`,
          '',
          '*Tiers:*',
          tiers,
          '',
          '*Response:*',
          (data.response || '').slice(0, 2000),
        ].join('\n');
      }
      return formatRouteResult(data);
    } catch (err) {
      return `❌ Escalation failed: ${err.message}`;
    }
  },

  async '/usage'() {
    try {
      const data = await routerFetch('/api/route', {
        text: 'usage',
        command: '/usage',
        sessionId: 'telegram-usage',
      });
      if (data.usage) {
        const lines = Object.entries(data.usage).map(([provider, info]) => {
          const filled = Math.round((info.percent || 0) / 10);
          const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(10 - filled);
          return `${provider}: ${bar} ${info.count}/${info.limit} (${info.percent}%)`;
        });
        return `📊 *Provider Usage*\n\n${lines.join('\n')}`;
      }
      return formatRouteResult(data);
    } catch (err) {
      return `❌ Usage fetch failed: ${err.message}`;
    }
  },

  async '/test-router'(rest, chatId) {
    const testPrompt = rest || 'test message';
    const route = getAutoRoute(testPrompt);
    try {
      const result = await routerFetch('/api/route', {
        text: testPrompt,
        command: '/test-router',
        sessionId: `tg-test-${chatId}`,
      });
      return [
        '🧪 *Test Router Result*',
        `Input: "${testPrompt}"`,
        `Auto-route: ${route.model} (${route.reason})`,
        `Route: ${result.route || 'n/a'}`,
        `Model: ${result.model || route.model}`,
        `Provider: ${result.provider || 'n/a'}`,
        `Status: ${result.status || 'n/a'}`,
        `Time: ${result.executionTimeMs || 0}ms`,
        `Fallback: ${result.fallbackUsed || false}`,
      ].join('\n');
    } catch {
      return [
        '🧪 *Test Router Result (offline)*',
        `Input: "${testPrompt}"`,
        `Auto-route: ${route.model} (${route.reason})`,
      ].join('\n');
    }
  },
};

// --- Format helper ---

function formatRouteResult(result) {
  const icon = result.status === 'success' ? '✅' : result.status === 'fallback' ? '🔄' : '❌';
  return `${icon} [${result.route || '?'}] ${result.model || '?'} (${result.executionTimeMs || 0}ms)\n\n${result.response || ''}`;
}

// --- Main entry point ---

/**
 * Handle a parsed command or free-text message.
 *
 * @param {string} text   — raw message text from Telegram
 * @param {number} chatId — Telegram chat id
 * @returns {Promise<string>} — response text (Markdown)
 */
async function handleCommand(text, chatId) {
  const { command, rest } = parseCommand(text);

  if (command && handlers[command]) {
    return handlers[command](rest, chatId);
  }

  // Auto-route: free text or unknown commands
  const prompt = command ? rest || text : text;
  try {
    const result = await routerFetch('/api/route', {
      text: prompt,
      command: command || undefined,
      chatId,
      sessionId: `tg-${chatId}`,
    });
    return formatRouteResult(result);
  } catch (err) {
    return `❌ Ошибка: ${err.message}`;
  }
}

module.exports = { parseCommand, handleCommand, getAutoRoute };

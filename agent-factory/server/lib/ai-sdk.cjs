'use strict';
const https = require('https');
const http = require('http');

// Бесплатные провайдеры для Agent Factory ($0 budget)
// OpenAI, Alibaba, LiteLLM — удалены (платные)

async function httpRequest(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.request(url, { method: 'POST', ...options }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Provider implementations
const providers = {
  async anthropic(prompt, opts = {}) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error('ANTHROPIC_API_KEY not set');
    const res = await httpRequest('https://api.anthropic.com/v1/messages', {
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    }, {
      model: opts.model || 'claude-3-5-haiku-20241022',
      max_tokens: opts.maxTokens || 4096,
      messages: [{ role: 'user', content: prompt }]
    });
    if (res.status !== 200) throw new Error(`Anthropic ${res.status}: ${JSON.stringify(res.data)}`);
    return res.data.content[0].text;
  },

  async openrouter(prompt, opts = {}) {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error('OPENROUTER_API_KEY not set');
    const res = await httpRequest('https://openrouter.ai/api/v1/chat/completions', {
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'X-Title': 'Agent Factory'
      }
    }, {
      model: opts.model || 'google/gemini-2.0-flash-exp:free',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: opts.maxTokens || 4096
    });
    if (res.status !== 200) throw new Error(`OpenRouter ${res.status}`);
    return res.data.choices[0].message.content;
  },

  async ollama(prompt, opts = {}) {
    const host = process.env.OLLAMA_HOST || 'http://localhost:11434';
    const res = await httpRequest(`${host}/api/generate`, {}, {
      model: opts.model || 'shadow-coder',
      prompt,
      stream: false,
      options: { num_ctx: 4096, ...opts.ollamaOptions }
    });
    if (!res.data.response) throw new Error('Ollama: empty response');
    return res.data.response;
  },


  async n8n(prompt, opts = {}) {
    const url = process.env.N8N_URL || 'http://localhost:5678';
    const res = await httpRequest(`${url}/webhook/ai-fallback`, {}, { prompt, ...opts });
    if (res.status !== 200) throw new Error(`n8n ${res.status}`);
    return res.data.response || JSON.stringify(res.data);
  }
};

// Каскадный вызов: anthropic → openrouter → ollama → n8n
async function cascade(prompt, opts = {}) {
  const chain = opts.chain || ['anthropic', 'openrouter', 'ollama', 'n8n'];
  const errors = [];
  for (const provider of chain) {
    try {
      const result = await providers[provider](prompt, opts);
      return { result, provider };
    } catch (err) {
      errors.push(`${provider}: ${err.message}`);
      continue;
    }
  }
  throw new Error(`All providers failed:\n${errors.join('\n')}`);
}

module.exports = { cascade, providers, httpRequest };

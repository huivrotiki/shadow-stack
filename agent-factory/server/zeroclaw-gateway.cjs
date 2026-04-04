'use strict';
// ZeroClaw Gateway :4111 — ультра-лёгкий прокси к Ollama
const http = require('http');
const { providers } = require('./lib/ai-sdk.cjs');

const PORT = process.env.ZEROCLAW_PORT || 4111;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET' && req.url === '/health') {
    return res.end(JSON.stringify({ status: 'ok', port: PORT }));
  }

  if (req.method === 'POST' && req.url === '/api/generate') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { prompt, model } = JSON.parse(body);
        const result = await providers.ollama(prompt, { model: model || 'shadow-coder' });
        res.end(JSON.stringify({ response: result }));
      } catch (err) {
        res.statusCode = 503;
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(PORT, () => {
  console.log(`✅ ZeroClaw gateway :${PORT} → Ollama ${OLLAMA_HOST}`);
});

module.exports = server;

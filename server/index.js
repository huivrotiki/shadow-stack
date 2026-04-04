'use strict';
const express = require('express');
const http = require('http');
const { route } = require('./shadow-router.cjs');

const app = express();
app.use(express.json());

const PORT = process.env.SERVER_PORT || 3001;

// Проверка доступности сервиса (3s timeout)
function checkService(url) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), 3000);
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? require('https') : http;
    lib.get(url, (res) => {
      clearTimeout(timeout);
      resolve(res.statusCode < 500);
    }).on('error', () => { clearTimeout(timeout); resolve(false); });
  });
}

app.get('/health', async (req, res) => {
  const [deerflow, openclaw, zeroclaw, n8n, ollama] = await Promise.all([
    checkService(process.env.DEERFLOW_URL || 'http://localhost:2026'),
    checkService('http://localhost:18789'),
    checkService(`http://localhost:${process.env.ZEROCLAW_PORT || 4111}`),
    checkService(process.env.N8N_URL || 'http://localhost:5678'),
    checkService((process.env.OLLAMA_HOST || 'http://localhost:11434') + '/api/tags')
  ]);
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: { deerflow, openclaw, zeroclaw, n8n, ollama }
  });
});

app.post('/api/chat', async (req, res) => {
  const { prompt, taskType = 'default' } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  try {
    const { result, provider } = await route(taskType, prompt);
    res.json({ result, provider });
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Agent Factory API :${PORT}`);
});

module.exports = app;

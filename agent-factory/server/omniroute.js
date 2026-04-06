// OmniRoute — unified cloud LLM cascade, port 20128
// Proxies to free-models-proxy :20129 with routing layer

const express = require('express');
const app = express();
const PORT = 20128;
const BACKEND = process.env.FREE_PROXY_BASE_URL || 'http://localhost:20129/v1';

app.use(express.json());

async function forward(path, body, res) {
  try {
    const r = await fetch(`${BACKEND}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FREE_PROXY_API_KEY || ''}`,
      },
      ...(body && { body: JSON.stringify(body) }),
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(502).json({ error: 'backend_unavailable', detail: e.message });
  }
}

app.get('/health', (_, res) => res.json({ status: 'ok', port: PORT, backend: BACKEND }));
app.get('/v1/models', (_, res) => forward('/models', null, res));
app.post('/v1/chat/completions', (req, res) => forward('/chat/completions', req.body, res));

app.listen(PORT, () => console.log(`✅ OmniRoute :${PORT} → ${BACKEND}`));

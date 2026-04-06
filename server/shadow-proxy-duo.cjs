// server/shadow-proxy-duo.cjs — Dual Provider Setup
// Simulates 2 users from different locations
// Port: 20133 (shadow-prod) + 20134 (shadow-alt)

const express = require('express');

// ─── Config for 2 "Users" ────────────────────────────────────────────
const PROXIES = {
  shadow: {
    port: 20133,
    upstream: 'http://localhost:20129/v1',  // Primary proxy
    location: 'us-west-1',
    userId: 'user_a7x2k9',
    apiKey: 'sk-shadow-prod-' + Math.random().toString(36).slice(2, 18),
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      'X-Forwarded-For': '45.33.' + Math.floor(Math.random()*255) + '.' + Math.floor(Math.random()*255),
      'CF-IPCountry': 'US',
      'CF-IPCity': 'San Francisco',
    }
  },
  shadowAlt: {
    port: 20134,
    upstream: 'http://localhost:20132/v1',  // Secondary proxy (different models)
    location: 'eu-west-1', 
    userId: 'user_b3m8p5',
    apiKey: 'sk-shadow-alt-' + Math.random().toString(36).slice(2, 18),
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'X-Forwarded-For': '52.29.' + Math.floor(Math.random()*255) + '.' + Math.floor(Math.random()*255),
      'CF-IPCountry': 'DE',
      'CF-IPCity': 'Frankfurt',
    }
  }
};

// ─── Create Proxy Server ──────────────────────────────────────────────
function createProxy(name, config) {
  const app = express();
  app.use(express.json());
  
  // ─── /v1/models ────────────────────────────────────────────────────
  app.get('/v1/models', async (req, res) => {
    try {
      const resp = await fetch(config.upstream + '/models');
      const data = await resp.json();
      
      // Add location tag to model IDs
      data.data = data.data.map(m => ({
        ...m,
        id: `${m.id}`,
        owned_by: `user-${config.location}`,
      }));
      
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  
  // ─── /v1/chat/completions ────────────────────────────────────────
  app.post('/v1/chat/completions', async (req, res) => {
    try {
      const { model, messages, stream = false, ...options } = req.body;
      
      // Forward client's API key to upstream
      const clientKey = req.headers['authorization']?.replace('Bearer ', '') || config.apiKey;
      
      const response = await fetch(config.upstream + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clientKey}`,
          ...config.headers,
        },
        body: JSON.stringify({ model, messages, stream, ...options }),
      });
      
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        response.body.pipe(res);
      } else {
        const data = await response.json();
        // Mark with user location
        if (data.choices?.[0]?.message) {
          data.id = `${config.location}-${data.id}`;
        }
        res.json(data);
      }
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  
  // ─── /health ──────────────────────────────────────────────────────
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      provider: name,
      location: config.location,
      userId: config.userId,
      upstream: config.upstream,
      uptime: Math.round(process.uptime()),
    });
  });
  
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`[${name}] Shadow ${name} running on :${config.port}`);
    console.log(`[${name}] Location: ${config.location}, User: ${config.userId}`);
    console.log(`[${name}] Upstream: ${config.upstream}`);
  });
}

// ─── Start Both Proxies ───────────────────────────────────────────────
createProxy('shadow', PROXIES.shadow);
createProxy('shadowAlt', PROXIES.shadowAlt);

console.log('\n🛡️ Shadow Stack Duo — 2 Providers Active');
console.log('   shadow (us-west-1) → :20133');
console.log('   shadowAlt (eu-west-1) → :20134');

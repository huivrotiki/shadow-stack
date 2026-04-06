// server/channel-router.cjs — Dual Channel + Supermemory Integration
// 2 parallel channels + shared memory layer
// Ports: 20133 (Channel A), 20134 (Channel B), 20135 (Memory)

const express = require('express');
const crypto = require('crypto');

const CHANNELS = {
  A: {
    port: 20133,
    name: 'Shadow-Channel-A',
    location: 'us-west-1',
    userId: 'user_a7x2k9',
    upstream: 'http://localhost:20129/v1',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'X-Forwarded-For': '45.33.' + Math.floor(Math.random()*255) + '.' + Math.floor(Math.random()*255),
    }
  },
  B: {
    port: 20134,
    name: 'Shadow-Channel-B', 
    location: 'eu-west-1',
    userId: 'user_b3m8p5',
    upstream: 'http://localhost:20132/v1',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'X-Forwarded-For': '52.29.' + Math.floor(Math.random()*255) + '.' + Math.floor(Math.random()*255),
    }
  }
};

const MEMORY_PORT = 20135;
const memoryStore = {
  conversations: [],
  decisions: [],
  context: {},
  lastSync: null
};

function createChannel(name, config) {
  const app = express();
  app.use(express.json());
  
  // ─── POST /v1/chat/completions ─────────────────────────────
  app.post('/v1/chat/completions', async (req, res) => {
    try {
      const { model, messages, stream = false, ...options } = req.body;
      
      // Store conversation for memory
      const convId = crypto.randomUUID();
      const conversation = {
        id: convId,
        channel: name,
        model,
        messages: messages.slice(-5), // Last 5 messages
        timestamp: new Date().toISOString()
      };
      memoryStore.conversations.push(conversation);
      if (memoryStore.conversations.length > 1000) {
        memoryStore.conversations = memoryStore.conversations.slice(-500);
      }
      
      const response = await fetch(config.upstream + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers['authorization'] || 'Bearer dummy',
          ...config.headers,
        },
        body: JSON.stringify({ model, messages, stream, ...options }),
      });
      
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        response.body.pipe(res);
      } else {
        const data = await response.json();
        res.json(data);
      }
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  
  // ─── GET /v1/models ───────────────────────────────────────
  app.get('/v1/models', async (req, res) => {
    try {
      const resp = await fetch(config.upstream + '/models');
      const data = await resp.json();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  
  // ─── POST /memory/store ────────────────────────────────────
  app.post('/memory/store', (req, res) => {
    const { key, value, type = 'context' } = req.body;
    memoryStore.context[key] = { value, type, timestamp: Date.now() };
    res.json({ ok: true, key });
  });
  
  // ─── GET /memory/recall ────────────────────────────────────
  app.get('/memory/recall', (req, res) => {
    const { query } = req.query;
    const results = memoryStore.conversations.filter(c => 
      c.messages.some(m => m.content?.includes(query))
    ).slice(-5);
    res.json({ results, total: results.length });
  });
  
  // ─── GET /health ──────────────────────────────────────────
  app.get('/health', (req, res) => {
    res.json({
      channel: name,
      location: config.location,
      upstream: config.upstream,
      memory: memoryStore.conversations.length + ' conversations',
      uptime: Math.round(process.uptime())
    });
  });
  
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`[${name}] ${config.name} running on :${config.port}`);
    console.log(`[${name}] Location: ${config.location}`);
  });
}

// ─── Memory Server ───────────────────────────────────────────────
function createMemoryServer() {
  const app = express();
  app.use(express.json());
  
  // ─── Global Memory Store ──────────────────────────────────
  const store = {
    conversations: [],
    decisions: [],
    tasks: [],
    agents: {},
    sync: Date.now()
  };
  
  // ─── POST /memory/conversation ────────────────────────────
  app.post('/memory/conversation', (req, res) => {
    const { channel, model, messages, response } = req.body;
    store.conversations.push({
      channel,
      model,
      messages,
      response: response?.slice(0, 500),
      timestamp: Date.now()
    });
    
    // Keep last 500
    if (store.conversations.length > 500) {
      store.conversations = store.conversations.slice(-250);
    }
    
    res.json({ ok: true, stored: store.conversations.length });
  });
  
  // ─── POST /memory/decision ────────────────────────────────
  app.post('/memory/decision', (req, res) => {
    const { agent, type, data, reason } = req.body;
    store.decisions.push({ agent, type, data, reason, timestamp: Date.now() });
    res.json({ ok: true, decisions: store.decisions.length });
  });
  
  // ─── GET /memory/context ──────────────────────────────────
  app.get('/memory/context', (req, res) => {
    const { agent, recent = '10' } = req.query;
    
    let context = {
      conversations: store.conversations.slice(-parseInt(recent)),
      decisions: store.decisions.slice(-20),
      tasks: store.tasks.filter(t => t.status !== 'done'),
      agents: store.agents
    };
    
    if (agent) {
      context = {
        ...context,
        myConversations: store.conversations.filter(c => c.channel === agent).slice(-5),
        myDecisions: store.decisions.filter(d => d.agent === agent).slice(-10)
      };
    }
    
    res.json(context);
  });
  
  // ─── POST /memory/sync ────────────────────────────────────
  app.post('/memory/sync', (req, res) => {
    const { agent, context } = req.body;
    store.agents[agent] = {
      lastSeen: Date.now(),
      context: context || {},
      online: true
    };
    store.sync = Date.now();
    res.json({ ok: true, synced: agent, allAgents: Object.keys(store.agents) });
  });
  
  // ─── GET /memory/recall ──────────────────────────────────
  app.get('/memory/recall', (req, res) => {
    const { q, type = 'all' } = req.query;
    
    let results = [];
    
    if (type === 'all' || type === 'conversations') {
      results.push(...store.conversations.filter(c => 
        c.messages?.some(m => m.content?.toLowerCase().includes(q?.toLowerCase()))
      ));
    }
    
    if (type === 'all' || type === 'decisions') {
      results.push(...store.decisions.filter(d => 
        JSON.stringify(d).toLowerCase().includes(q?.toLowerCase())
      ));
    }
    
    res.json({ results: results.slice(-20), query: q, type });
  });
  
  // ─── POST /memory/task ───────────────────────────────────
  app.post('/memory/task', (req, res) => {
    const { agent, description, priority = 'normal' } = req.body;
    store.tasks.push({
      id: crypto.randomUUID(),
      agent,
      description,
      priority,
      status: 'pending',
      created: Date.now()
    });
    res.json({ ok: true, tasks: store.tasks.length });
  });
  
  // ─── GET /health ─────────────────────────────────────────
  app.get('/health', (req, res) => {
    res.json({
      memory: 'active',
      conversations: store.conversations.length,
      decisions: store.decisions.length,
      tasks: store.tasks.length,
      agents: Object.keys(store.agents),
      lastSync: store.sync
    });
  });
  
  app.listen(MEMORY_PORT, '0.0.0.0', () => {
    console.log(`\n[Memory] Supermemory Server on :${MEMORY_PORT}`);
    console.log(`[Memory] Conversations: ${store.conversations.length}`);
  });
}

// ─── Start ───────────────────────────────────────────────────────
console.log('\n🚀 Shadow Stack Dual Channel + Supermemory\n');

Object.entries(CHANNELS).forEach(([name, config]) => {
  createChannel(name, config);
});

createMemoryServer();

console.log('\n📡 Channels:');
console.log('   Channel-A (US) → :20133');
console.log('   Channel-B (EU) → :20134');
console.log('   Supermemory    → :20135\n');

// server/context-pool.cjs — Shared Context Pool
// Common memory for all agents/providers
// Port: 20135

const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 20135;
const POOL_FILE = path.join(__dirname, '../data/context-pool.json');

// ─── Pool Structure ────────────────────────────────────────────────
const POOL_TEMPLATE = {
  version: 1,
  updated: null,
  agents: {
    shadow: {
      name: 'Shadow (US-West)',
      location: 'us-west-1',
      online: false,
      lastSeen: null,
      context: {},
      task: null,
      history: []
    },
    shadowAlt: {
      name: 'Shadow Alt (EU-West)',
      location: 'eu-west-1',
      online: false,
      lastSeen: null,
      context: {},
      task: null,
      history: []
    }
  },
  shared: {
    project: 'shadow-stack',
    tasks: [],
    memory: [],
    decisions: []
  }
};

// ─── Helpers ────────────────────────────────────────────────────
function loadPool() {
  try {
    if (fs.existsSync(POOL_FILE)) {
      return JSON.parse(fs.readFileSync(POOL_FILE, 'utf8'));
    }
  } catch {}
  return { ...POOL_TEMPLATE, updated: new Date().toISOString() };
}

function savePool(pool) {
  pool.updated = new Date().toISOString();
  fs.writeFileSync(POOL_FILE, JSON.stringify(pool, null, 2));
}

// ─── Middleware ─────────────────────────────────────────────────
app.use(express.json());

// Agent identification via header
function getAgent(req) {
  const agentId = req.headers['x-agent-id'] || 'anonymous';
  return agentId.replace(/[^a-zA-Z0-9_-]/g, '');
}

// ─── GET /pool ─────────────────────────────────────────────────
app.get('/pool', (req, res) => {
  const pool = loadPool();
  
  // Mark requester as online
  const agent = getAgent(req);
  if (pool.agents[agent]) {
    pool.agents[agent].online = true;
    pool.agents[agent].lastSeen = new Date().toISOString();
    savePool(pool);
  }
  
  res.json({
    status: 'ok',
    agent: agent,
    pool: pool,
    timestamp: Date.now()
  });
});

// ─── POST /pool/heartbeat ──────────────────────────────────────
app.post('/pool/heartbeat', (req, res) => {
  const agent = getAgent(req);
  const pool = loadPool();
  
  if (!pool.agents[agent]) {
    pool.agents[agent] = {
      name: agent,
      location: req.body.location || 'unknown',
      online: true,
      lastSeen: new Date().toISOString(),
      context: {},
      task: null,
      history: []
    };
  } else {
    pool.agents[agent].online = true;
    pool.agents[agent].lastSeen = new Date().toISOString();
    if (req.body.task) {
      pool.agents[agent].task = req.body.task;
    }
  }
  
  savePool(pool);
  res.json({ ok: true, agent: agent, pool: pool });
});

// ─── POST /pool/context ─────────────────────────────────────────
app.post('/pool/context', (req, res) => {
  const agent = getAgent(req);
  const { key, value, scope = 'agent' } = req.body;
  
  if (!key) {
    return res.status(400).json({ error: 'key required' });
  }
  
  const pool = loadPool();
  
  if (scope === 'shared') {
    pool.shared[key] = value;
  } else if (pool.agents[agent]) {
    pool.agents[agent].context[key] = value;
  } else {
    return res.status(404).json({ error: 'agent not found' });
  }
  
  savePool(pool);
  res.json({ ok: true, agent, scope, key });
});

// ─── GET /pool/context/:scope/:key ───────────────────────────────
app.get('/pool/context/:scope/:key', (req, res) => {
  const { scope, key } = req.params;
  const pool = loadPool();
  
  let value;
  if (scope === 'shared') {
    value = pool.shared[key];
  } else if (pool.agents[scope]) {
    value = pool.agents[scope].context[key];
  } else {
    return res.status(404).json({ error: 'not found' });
  }
  
  res.json({ scope, key, value });
});

// ─── POST /pool/task ────────────────────────────────────────────
app.post('/pool/task', (req, res) => {
  const agent = getAgent(req);
  const { description, priority = 'normal' } = req.body;
  
  const pool = loadPool();
  const task = {
    id: crypto.randomUUID(),
    agent: agent,
    description,
    priority,
    status: 'pending',
    created: new Date().toISOString(),
    history: []
  };
  
  pool.shared.tasks.push(task);
  if (pool.agents[agent]) {
    pool.agents[agent].task = task.id;
    pool.agents[agent].history.push({
      action: 'task_created',
      task: task.id,
      ts: new Date().toISOString()
    });
  }
  
  savePool(pool);
  res.json({ ok: true, task });
});

// ─── GET /pool/tasks ────────────────────────────────────────────
app.get('/pool/tasks', (req, res) => {
  const pool = loadPool();
  const { status, agent } = req.query;
  
  let tasks = pool.shared.tasks;
  
  if (status) {
    tasks = tasks.filter(t => t.status === status);
  }
  if (agent) {
    tasks = tasks.filter(t => t.agent === agent);
  }
  
  res.json({ tasks, total: tasks.length });
});

// ─── POST /pool/decision ────────────────────────────────────────
app.post('/pool/decision', (req, res) => {
  const agent = getAgent(req);
  const { type, data, reason } = req.body;
  
  const pool = loadPool();
  const decision = {
    id: crypto.randomUUID(),
    agent,
    type,
    data,
    reason,
    ts: new Date().toISOString()
  };
  
  pool.shared.decisions.push(decision);
  pool.shared.memory.push({
    type: 'decision',
    agent,
    content: `${agent} decided: ${type}`,
    data,
    ts: new Date().toISOString()
  });
  
  if (pool.agents[agent]) {
    pool.agents[agent].history.push({
      action: 'decision',
      type,
      ts: new Date().toISOString()
    });
  }
  
  savePool(pool);
  res.json({ ok: true, decision });
});

// ─── GET /pool/memory ────────────────────────────────────────────
app.get('/pool/memory', (req, res) => {
  const pool = loadPool();
  const { limit = 50 } = req.query;
  
  res.json({
    memory: pool.shared.memory.slice(-parseInt(limit)),
    total: pool.shared.memory.length
  });
});

// ─── GET /pool/borrow/:agentId ──────────────────────────────────
app.get('/pool/borrow/:agentId', (req, res) => {
  const borrower = getAgent(req);
  const targetAgent = req.params.agentId;
  const pool = loadPool();
  
  if (!pool.agents[targetAgent]) {
    return res.status(404).json({ error: 'agent not found' });
  }
  
  const target = pool.agents[targetAgent];
  
  // Log the borrowing
  const borrowRecord = {
    id: crypto.randomUUID(),
    borrower,
    target: targetAgent,
    ts: new Date().toISOString(),
    contextSnapshot: { ...target.context },
    currentTask: target.task,
    historyLength: target.history.length
  };
  
  // Add to shared memory
  pool.shared.memory.push({
    type: 'borrow',
    borrower,
    target: targetAgent,
    content: `${borrower} borrowed context from ${targetAgent}`,
    ts: new Date().toISOString()
  });
  
  // Record in borrower's history
  if (pool.agents[borrower]) {
    pool.agents[borrower].history.push({
      action: 'borrow_context',
      from: targetAgent,
      ts: new Date().toISOString()
    });
  }
  
  savePool(pool);
  
  res.json({
    ok: true,
    borrowed: {
      agent: targetAgent,
      context: target.context,
      task: target.task,
      history: target.history.slice(-10) // Last 10 history entries
    },
    record: borrowRecord
  });
});

// ─── POST /pool/lend ──────────────────────────────────────────────
// Agent voluntarily shares context
app.post('/pool/lend', (req, res) => {
  const lender = getAgent(req);
  const { toAgent, context = {}, reason = '' } = req.body;
  
  if (!toAgent) {
    return res.status(400).json({ error: 'toAgent required' });
  }
  
  const pool = loadPool();
  
  if (!pool.agents[lender]) {
    return res.status(404).json({ error: 'lender not found' });
  }
  
  // Create shared context entry
  const lendRecord = {
    id: crypto.randomUUID(),
    lender,
    borrower: toAgent,
    sharedContext: context,
    reason,
    ts: new Date().toISOString()
  };
  
  pool.shared.memory.push({
    type: 'lend',
    lender,
    borrower: toAgent,
    content: `${lender} shared context with ${toAgent}: ${reason}`,
    data: context,
    ts: new Date().toISOString()
  });
  
  if (pool.agents[lender]) {
    pool.agents[lender].history.push({
      action: 'lend_context',
      to: toAgent,
      ts: new Date().toISOString()
    });
  }
  
  savePool(pool);
  
  res.json({ ok: true, record: lendRecord });
});

// ─── GET /pool/sync/:agentId ────────────────────────────────────
// Get full context sync from another agent
app.get('/pool/sync/:agentId', (req, res) => {
  const requester = getAgent(req);
  const targetAgent = req.params.agentId;
  const pool = loadPool();
  
  if (!pool.agents[targetAgent]) {
    return res.status(404).json({ error: 'target agent not found' });
  }
  
  const target = pool.agents[targetAgent];
  
  // Create sync record
  const syncRecord = {
    id: crypto.randomUUID(),
    requester,
    target: targetAgent,
    ts: new Date().toISOString(),
    fullContext: {
      ...target.context,
      projectContext: pool.shared.project,
      recentDecisions: pool.shared.decisions.slice(-5),
      activeTasks: pool.shared.tasks.filter(t => t.status === 'in_progress')
    }
  };
  
  // Log sync
  pool.shared.memory.push({
    type: 'sync',
    requester,
    target: targetAgent,
    content: `${requester} synced full context from ${targetAgent}`,
    ts: new Date().toISOString()
  });
  
  savePool(pool);
  
  res.json({
    ok: true,
    sync: syncRecord
  });
});

// ─── Health ─────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const pool = loadPool();
  const onlineAgents = Object.values(pool.agents).filter(a => a.online);
  
  res.json({
    status: 'ok',
    pool: 'context-pool',
    version: pool.version,
    agents: Object.keys(pool.agents),
    online: onlineAgents.length,
    updated: pool.updated
  });
});

// ─── Start ─────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[context-pool] Shared context pool running on :${PORT}`);
  console.log(`[context-pool] Pool file: ${POOL_FILE}`);
  
  // Ensure data dir exists
  const dataDir = path.dirname(POOL_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Initialize pool
  const pool = loadPool();
  console.log(`[context-pool] Agents: ${Object.keys(pool.agents).join(', ')}`);
});

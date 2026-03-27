// server/api/logs.js — SSE streaming + circular buffer + stats
import { Router } from 'express';
import { pushToSupabase } from '../lib/supabase.js';

const router = Router();

// Circular buffer — last 100 events
const MAX_LOGS = 100;
const buffer = [];
let writeIdx = 0;

// Connected SSE clients
const clients = new Set();

// Retry stats per provider
const retryStats = {};
let totalRequests = 0;

function pushLog(event) {
  const entry = {
    ts: event.ts || Date.now(),
    route: event.route || 'unknown',
    model: event.model || '-',
    latency_ms: event.latency_ms || 0,
    status: event.status || 'ok',
    preview: (event.preview || '').slice(0, 80),
  };

  // Circular buffer
  if (buffer.length < MAX_LOGS) {
    buffer.push(entry);
  } else {
    buffer[writeIdx] = entry;
    writeIdx = (writeIdx + 1) % MAX_LOGS;
  }

  // Track retries
  if (entry.route) {
    retryStats[entry.route] = retryStats[entry.route] || { requests: 0, retries: 0, errors: 0 };
    retryStats[entry.route].requests++;
    if (entry.status === 'error') retryStats[entry.route].errors++;
    if (entry.status === 'retry') retryStats[entry.route].retries++;
    totalRequests++;
  }

  // Broadcast to SSE clients
  const data = JSON.stringify(entry);
  for (const client of clients) {
    try {
      client.write(`data: ${data}\n\n`);
    } catch {
      clients.delete(client);
    }
  }

  // Persist to Supabase (silent fail)
  pushToSupabase(entry).catch(() => {});
}

function getBuffer() {
  if (buffer.length <= MAX_LOGS) return [...buffer];
  return [...buffer.slice(writeIdx), ...buffer.slice(0, writeIdx)];
}

// GET /api/logs — SSE stream
router.get('/api/logs', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Send buffer history on connect
  const history = getBuffer();
  if (history.length) {
    res.write(`data: ${JSON.stringify({ type: 'history', events: history })}\n\n`);
  }

  clients.add(res);

  // Heartbeat every 5 seconds
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch { clearInterval(heartbeat); }
  }, 5000);

  // Auto-close after 60 seconds
  const timeout = setTimeout(() => {
    clearInterval(heartbeat);
    clients.delete(res);
    try { res.end(); } catch {}
  }, 60000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clearTimeout(timeout);
    clients.delete(res);
  });
});

// GET /api/logs/stats — retry metrics
router.get('/api/logs/stats', (_req, res) => {
  res.json({
    ok: true,
    totalRequests,
    retries: retryStats,
    bufferLen: buffer.length,
    connectedClients: clients.size,
  });
});

// GET /api/logs/recent — JSON dump of buffer
router.get('/api/logs/recent', (_req, res) => {
  res.json({ ok: true, events: getBuffer() });
});

// POST /api/logs — push event from external callers (bot, etc.)
router.post('/api/logs', (req, res) => {
  const event = req.body;
  if (!event || typeof event !== 'object') {
    return res.status(400).json({ error: 'Invalid event body' });
  }
  pushLog(event);
  res.json({ ok: true });
});

export { router, pushLog };

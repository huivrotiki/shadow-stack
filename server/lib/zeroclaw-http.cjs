// ZeroClaw HTTP wrapper — mounts /api/zeroclaw/* on an Express app.
// Uses dynamic ESM import to load the ZeroClaw.js class from repo root.

let zeroclawInstance = null;
let loadPromise = null;

async function getZeroClaw() {
  if (zeroclawInstance) return zeroclawInstance;
  if (!loadPromise) {
    loadPromise = import('../../ZeroClaw.js').then(mod => {
      const ZeroClaw = mod.default;
      zeroclawInstance = new ZeroClaw({
        baseURL: process.env.FREE_PROXY_BASE_URL || 'http://localhost:20131/v1',
        apiKey: process.env.FREE_PROXY_API_KEY || 'shadow-free-proxy-local-dev-key',
        retries: parseInt(process.env.ZEROCLAW_RETRIES || '2', 10),
        timeout: parseInt(process.env.ZEROCLAW_TIMEOUT || '30000', 10),
      });
      return zeroclawInstance;
    });
  }
  return loadPromise;
}

let plannerInstance = null;
function getPlanner() {
  if (plannerInstance) return plannerInstance;
  try {
    plannerInstance = require('./zeroclaw-planner.cjs');
  } catch (e) {
    console.error('[zeroclaw-http] planner load error:', e.message);
  }
  return plannerInstance;
}

function mount(app) {
  app.post('/api/zeroclaw/execute', async (req, res) => {
    try {
      const zc = await getZeroClaw();
      const envelope = req.body || {};
      if (!envelope.task_id) envelope.task_id = `t-${Date.now()}`;
      if (!envelope.instruction) return res.status(400).json({ ok: false, error: 'instruction required' });
      if (!envelope.model) envelope.model = 'auto';
      const result = await zc.execute(envelope);
      res.json({ ok: true, task_id: envelope.task_id, ...result });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.post('/api/zeroclaw/plan', async (req, res) => {
    const planner = getPlanner();
    if (!planner) return res.status(503).json({ ok: false, error: 'planner not loaded' });
    try {
      const { goal, text } = req.body || {};
      const source = goal || text;
      if (!source) return res.status(400).json({ ok: false, error: 'goal or text required' });
      const intent = planner.intent(source);
      const plan = planner.plan(source);
      res.json({ ok: true, intent, plan });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.post('/api/zeroclaw/execute-plan', async (req, res) => {
    const planner = getPlanner();
    if (!planner) return res.status(503).json({ ok: false, error: 'planner not loaded' });
    try {
      const zc = await getZeroClaw();
      const { goal, text } = req.body || {};
      const source = goal || text;
      if (!source) return res.status(400).json({ ok: false, error: 'goal or text required' });
      const plan = planner.plan(source);
      const tasks = plan.steps.map((step, i) => ({
        task_id: `plan-${Date.now()}-${i}`,
        instruction: step.instruction,
        model: step.model || 'auto',
      }));
      const results = await zc.executeMany(tasks, { concurrency: 2 });
      res.json({ ok: true, plan, results });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.get('/api/zeroclaw/state/:task_id', async (req, res) => {
    const zc = await getZeroClaw();
    const st = zc.getState(req.params.task_id);
    if (!st) return res.status(404).json({ ok: false, error: 'not found' });
    res.json({ ok: true, task_id: req.params.task_id, state: st });
  });

  app.get('/api/zeroclaw/state', async (req, res) => {
    const zc = await getZeroClaw();
    res.json({ ok: true, state: zc.getState() });
  });

  app.get('/api/zeroclaw/health', async (_req, res) => {
    try {
      await getZeroClaw();
      res.json({ ok: true, loaded: !!zeroclawInstance, planner: !!getPlanner() });
    } catch (e) {
      res.status(503).json({ ok: false, error: e.message });
    }
  });
}

module.exports = { mount, getZeroClaw };

'use strict';
// Parallel context gatherer for ZeroClaw pipeline.
// Collects RAM status, SuperMemory recall, NotebookLM query, and codebase scan
// in parallel with per-source timeouts. Failures are warnings, never blockers.

const { execFile } = require('child_process');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..', '..');
const SHADOW_API = process.env.SHADOW_API_URL || 'http://localhost:3001';
const PROXY_URL = process.env.FREE_PROXY_BASE_URL || 'http://localhost:20129';
const NOTEBOOKLM_BIN = '/Users/work/.venv/notebooklm/bin/notebooklm';
const SOURCE_TIMEOUT = 5000; // 5s per source

// Fetch with AbortSignal.timeout
async function _fetchTimeout(url, opts = {}) {
  const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(SOURCE_TIMEOUT) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Individual Sources ──────────────────────────────────────────────────────

async function _gatherRAM() {
  const data = await _fetchTimeout(`${SHADOW_API}/ram`);
  return { free_mb: data.free_mb, safe: data.safe, critical: data.critical };
}

async function _gatherMemory(query) {
  // Route through proxy cascade with a recall-oriented prompt.
  // Castor will pick the best model for this lightweight query.
  const data = await _fetchTimeout(`${PROXY_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'auto',
      messages: [{ role: 'user', content: `Recall relevant context about: ${query}. Be concise.` }],
    }),
  });
  const text = data.choices?.[0]?.message?.content || '';
  return { matches: text ? [text] : [] };
}

async function _gatherNotebook(query) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('notebooklm timeout')), SOURCE_TIMEOUT);
    execFile(NOTEBOOKLM_BIN, ['ask', query], { timeout: SOURCE_TIMEOUT }, (err, stdout) => {
      clearTimeout(timer);
      if (err) return reject(err);
      resolve({ answer: (stdout || '').trim() });
    });
  });
}

async function _gatherCodebase(goal) {
  // Extract 2-3 keywords from goal for file search
  const keywords = goal
    .replace(/[^\w\sа-яА-ЯёЁ-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 3);

  if (!keywords.length) return { files: [] };

  return new Promise((resolve) => {
    const pattern = keywords.join('\\|');
    execFile('grep', ['-rl', pattern, 'server/', 'bot/', 'scripts/', '--include=*.cjs', '--include=*.js'],
      { cwd: PROJECT_ROOT, timeout: SOURCE_TIMEOUT },
      (err, stdout) => {
        // grep returns exit 1 if no matches — not an error for us
        const files = (stdout || '').trim().split('\n').filter(Boolean).slice(0, 10);
        resolve({ files });
      }
    );
  });
}

// ── Main Gatherer ───────────────────────────────────────────────────────────

async function gather(goal, opts = {}) {
  const warnings = [];

  const sources = {
    ram: _gatherRAM(),
    memory: opts.skip_memory ? Promise.resolve({ matches: [] }) : _gatherMemory(opts.context_query || goal),
    notebook: opts.skip_notebook ? Promise.resolve({ answer: '' }) : _gatherNotebook(goal),
    codebase: _gatherCodebase(goal),
  };

  const results = await Promise.allSettled(Object.values(sources));
  const keys = Object.keys(sources);

  const gathered = {};
  for (let i = 0; i < keys.length; i++) {
    if (results[i].status === 'fulfilled') {
      gathered[keys[i]] = results[i].value;
    } else {
      gathered[keys[i]] = keys[i] === 'ram' ? { free_mb: 0, safe: false, critical: true }
        : keys[i] === 'memory' ? { matches: [] }
        : keys[i] === 'notebook' ? { answer: '' }
        : { files: [] };
      warnings.push(`${keys[i]}: ${results[i].reason?.message || 'unknown error'}`);
    }
  }

  gathered.warnings = warnings;
  return gathered;
}

module.exports = { gather };

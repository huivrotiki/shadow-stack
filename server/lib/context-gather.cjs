'use strict';
// context-gather.cjs — Parallel context gatherer for ZeroClaw pipeline
// Collects RAM + SuperMemory + NotebookLM + codebase scan

const { execFile } = require('child_process');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..', '..');
const SHADOW_API = process.env.SHADOW_API_URL || 'http://localhost:3001';
const PROXY_URL = process.env.FREE_PROXY_BASE_URL || 'http://localhost:20129';
const NOTEBOOKLM_CLI = '/Users/work/.venv/notebooklm/bin/notebooklm';

// Helper: timeout for promise
function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

// Helper: execFile wrapped in promise
function execFilePromise(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { cwd: PROJECT_ROOT, timeout: 10000, ...opts }, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve((stdout || '').trim());
    });
  });
}

// Gather context
async function gather(goal, opts = {}) {
  const warnings = [];
  const context = {
    ram: { free_mb: -1, safe: false, critical: false },
    memory: { matches: [] },
    notebook: { answer: '' },
    codebase: { files: [] },
    warnings,
  };

  // Parallel fetch with Promise.allSettled
  const results = await Promise.allSettled([
    // 1. RAM check
    withTimeout(fetch(`${SHADOW_API}/ram`, { signal: AbortSignal.timeout(3000) }), 5000)
      .then(res => res.json()),
    // 2. SuperMemory recall (try cascade endpoint or skip)
    withTimeout(
      fetch(`${SHADOW_API}/api/cascade/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `recall: ${goal}` }),
        signal: AbortSignal.timeout(3000),
      }).then(res => res.ok ? res.json() : null),
      5000
    ).catch(() => null),
    // 3. NotebookLM ask
    withTimeout(
      execFilePromise(NOTEBOOKLM_CLI, ['ask', goal]).then(answer => answer),
      5000
    ).catch(() => null),
    // 4. Codebase scan: extract keywords from goal, grep for relevant files
    withTimeout(
      (() => {
        const keywords = goal.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 5);
        if (keywords.length === 0) return [];
        const grepArgs = ['-rl'].concat(
          keywords.map(k => ['-e', k]).flat(),
          'server/', '--include=*.cjs', '--include=*.js'
        );
        return execFilePromise('grep', grepArgs).then(output => output.split('\n').filter(Boolean));
      })(),
      5000
    ).catch(() => []),
  ]);

  // Process RAM
  if (results[0].status === 'fulfilled') {
    context.ram = results[0].value;
  } else {
    warnings.push('RAM check failed');
  }

  // Process SuperMemory
  if (results[1].status === 'fulfilled' && results[1].value) {
    context.memory.matches = results[1].value.matches || results[1].value.results || [];
  } else {
    warnings.push('SuperMemory recall skipped');
  }

  // Process NotebookLM
  if (results[2].status === 'fulfilled' && results[2].value) {
    context.notebook.answer = results[2].value;
  } else {
    warnings.push('NotebookLM ask skipped');
  }

  // Process codebase
  if (results[3].status === 'fulfilled' && Array.isArray(results[3].value)) {
    context.codebase.files = results[3].value.slice(0, 10); // limit to 10 files
  } else {
    warnings.push('Codebase scan skipped');
  }

  return context;
}

module.exports = { gather };

'use strict';
// Pluggable test runner for ZeroClaw pipeline.
// Runs a set of named checks against execution results and returns aggregate score.

const { execFile } = require('child_process');

const SHADOW_API = process.env.SHADOW_API_URL || 'http://localhost:3001';
const PROXY_URL = process.env.FREE_PROXY_BASE_URL || 'http://localhost:20129';

// ── Built-in Checks ─────────────────────────────────────────────────────────

const CHECKS = {
  // Services still alive after execution
  async health() {
    const [api, proxy] = await Promise.allSettled([
      fetch(`${SHADOW_API}/health`, { signal: AbortSignal.timeout(3000) }),
      fetch(`${PROXY_URL}/health`, { signal: AbortSignal.timeout(3000) }),
    ]);
    const ok = api.status === 'fulfilled' && api.value.ok
            && proxy.status === 'fulfilled' && proxy.value.ok;
    return { name: 'health', passed: ok, detail: ok ? 'services alive' : 'service down' };
  },

  // Aggregate execution score meets threshold
  async score_threshold(ctx) {
    const threshold = ctx.request?.min_score ?? 0.8;
    const scores = (ctx.results || []).map(r => r.score || 0);
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const passed = avg >= threshold;
    return { name: 'score_threshold', passed, detail: `avg=${avg.toFixed(2)} vs threshold=${threshold}` };
  },

  // Output is non-empty and meaningful
  async output_not_empty(ctx) {
    const outputs = (ctx.results || []).map(r => r.output || '');
    const allGood = outputs.every(o => o.length > 10);
    return { name: 'output_not_empty', passed: allGood, detail: `${outputs.length} outputs checked` };
  },

  // Syntax check on JS/CJS files (if code task)
  async syntax_check(ctx) {
    const files = ctx.context?.codebase?.files || [];
    const jsFiles = files.filter(f => /\.(cjs|js|mjs)$/.test(f)).slice(0, 5);
    if (!jsFiles.length) return { name: 'syntax_check', passed: true, detail: 'no JS files to check' };

    const results = await Promise.allSettled(
      jsFiles.map(f => new Promise((resolve, reject) => {
        execFile('node', ['-c', f], { timeout: 5000 }, (err) => {
          err ? reject(new Error(`${f}: syntax error`)) : resolve(f);
        });
      }))
    );
    const failed = results.filter(r => r.status === 'rejected');
    return {
      name: 'syntax_check',
      passed: failed.length === 0,
      detail: failed.length ? failed.map(r => r.reason.message).join('; ') : `${jsFiles.length} files ok`,
    };
  },

  // Custom shell command
  async custom(ctx) {
    const cmd = ctx.request?.custom_test;
    if (!cmd) return { name: 'custom', passed: true, detail: 'no custom test' };
    const parts = cmd.split(/\s+/);
    return new Promise((resolve) => {
      execFile(parts[0], parts.slice(1), { timeout: 10000 }, (err, stdout) => {
        resolve({
          name: 'custom',
          passed: !err,
          detail: err ? err.message : (stdout || '').trim().slice(0, 200),
        });
      });
    });
  },
};

// ── Runner ──────────────────────────────────────────────────────────────────

async function run(checkNames, context) {
  const details = [];
  for (const name of checkNames) {
    const check = CHECKS[name];
    if (!check) {
      details.push({ name, passed: false, detail: 'unknown check' });
      continue;
    }
    try {
      details.push(await check(context));
    } catch (e) {
      details.push({ name, passed: false, detail: e.message });
    }
  }

  const passed = details.filter(d => d.passed).length;
  const total = details.length;

  return {
    passed,
    failed: total - passed,
    score: total > 0 ? passed / total : 0,
    details,
  };
}

module.exports = { run };

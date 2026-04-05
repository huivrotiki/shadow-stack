'use strict';
// sub-agent.cjs — Kiro sub-agent :20131
// Tasks: local_commit, ralph_loop_verify

const http = require('http');
const { execSync } = require('child_process');

const PORT = 20131;
const PROJECT = process.env.PROJECT_ROOT || '/Users/work/shadow-stack_local_1';

function runCmd(cmd, cwd = PROJECT) {
  try {
    return { ok: true, out: execSync(cmd, { cwd, timeout: 30000 }).toString().trim() };
  } catch (e) {
    return { ok: false, out: e.message.slice(0, 300) };
  }
}

async function taskLocalCommit({ message } = {}) {
  const status = runCmd('git status --porcelain');
  if (!status.out) return { ok: true, result: 'nothing to commit' };
  const msg = message || `chore(auto): sub-agent batch commit ${new Date().toISOString().slice(0,16)}`;
  runCmd("git add -A -- ':!node_modules' ':!.git' ':!data/*.json'");
  return runCmd(`git commit -m "${msg}"`);
}

async function taskRalphLoopVerify() {
  const checks = [
    { name: 'shadow-api',  url: 'http://localhost:3001/health' },
    { name: 'free-proxy',  url: 'http://localhost:20129/health' },
    { name: 'zeroclaw',    url: 'http://localhost:4111/health' },
  ];
  const results = {};
  for (const c of checks) {
    results[c.name] = await fetch(c.url, { signal: AbortSignal.timeout(3000) })
      .then(r => r.ok ? 'ok' : 'error').catch(() => 'unreachable');
  }
  const git = runCmd('git log --oneline -1');
  return { ok: true, services: results, head: git.out };
}

const TASKS = { local_commit: taskLocalCommit, ralph_loop_verify: taskRalphLoopVerify };

http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200);
    return res.end(JSON.stringify({ ok: true, service: 'sub-kiro', port: PORT, tasks: Object.keys(TASKS) }));
  }

  if (req.method === 'POST' && req.url === '/run') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { task, ...opts } = JSON.parse(body);
        const fn = TASKS[task];
        if (!fn) { res.writeHead(400); return res.end(JSON.stringify({ ok: false, error: `unknown task: ${task}` })); }
        const result = await fn(opts);
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true, task, result }));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404); res.end('Not Found');
}).listen(PORT, () => console.log(`🤖 sub-kiro :${PORT} ready — tasks: ${Object.keys(TASKS).join(', ')}`));

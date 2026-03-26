#!/usr/bin/env node
'use strict';

const http = require('http');
const https = require('https');
const { exec, spawn } = require('child_process');
const path = require('path');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_REPO = process.env.GITHUB_REPO || 'huivrotiki/shadow-stack';
const ROOT = process.env.ROOT_DIR || path.resolve(__dirname, '..');

if (!TOKEN || !CHAT_ID) {
  console.error('❌ Missing TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID');
  process.exit(1);
}

// ─── services registry ───────────────────────────────────────────────────────
const SERVICES = {
  express: { port: 3001, label: 'Express API',    health: 'http://localhost:3001/health' },
  nextjs:  { port: 3000, label: 'Next.js',        health: 'http://localhost:3000' },
  bot:     { port: 4000, label: 'Telegram Bot',   health: 'http://localhost:4000/health' },
  dash:    { port: 5176, label: 'Dashboard v5.0', health: 'http://localhost:5176' },
  ollama:  { port: 11434, label: 'Ollama',        health: 'http://localhost:11434' },
};

// ─── commands ────────────────────────────────────────────────────────────────
const COMMANDS = {
  start:   { desc: 'Список команд' },
  help:    { desc: 'Список команд' },
  status:  { desc: 'Статус всех сервисов + GitHub Actions' },
  deploy:  { desc: 'Deploy dashboard на Vercel' },
  build:   { desc: 'npm run build в корне проекта' },
  test:    { desc: 'npm test' },
  lint:    { desc: 'npm run lint' },
  logs:    { desc: 'Последние 30 строк логов Express' },
  restart: { desc: 'Перезапустить все сервисы' },
  up:      { desc: 'Запустить все сервисы' },
  ping:    { desc: 'Проверить связь с ботом' },
  version: { desc: 'Показать версию проекта' },
};

// ─── utils ───────────────────────────────────────────────────────────────────
function send(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({ ok: true }); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function run(cmd, timeout = 60000, cwd = ROOT) {
  return new Promise((resolve) => {
    const child = exec(cmd, { cwd, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      const out = (stdout || stderr || '').slice(0, 1800);
      resolve(err ? `❌ ${stderr?.slice(0, 500) || err.message}` : `✅ ${out || 'OK'}`);
    });
    setTimeout(() => { child.kill('SIGTERM'); resolve('⏰ Timeout'); }, timeout);
  });
}

function checkHttp(url) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: 3000 }, (res) => resolve(res.statusCode < 500));
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function getGithubStatus() {
  if (!GITHUB_TOKEN) return '⚠️ GITHUB_TOKEN не задан';
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_REPO}/actions/runs?per_page=1`,
      method: 'GET',
      headers: { 'User-Agent': 'shadow-stack-bot', Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const run = JSON.parse(d).workflow_runs?.[0];
          if (!run) { resolve('📊 Нет запусков'); return; }
          const icon = run.conclusion === 'success' ? '✅' : run.status === 'in_progress' ? '⏳' : '❌';
          resolve(`${icon} <b>${run.name}</b>\nStatus: ${run.status} | ${run.conclusion || 'pending'}\n🔗 ${run.html_url}`);
        } catch { resolve('⚠️ Ошибка парсинга GitHub'); }
      });
    });
    req.on('error', () => resolve('⚠️ Ошибка GitHub API'));
    req.end();
  });
}

// ─── handlers ────────────────────────────────────────────────────────────────
async function handleStatus() {
  await send('⏳ Проверяю сервисы...');
  const lines = await Promise.all(
    Object.entries(SERVICES).map(async ([, s]) => {
      const ok = await checkHttp(s.health);
      return `${ok ? '🟢' : '🔴'} ${s.label} :${s.port}`;
    })
  );
  const gh = await getGithubStatus();
  await send(`<b>Shadow Stack — System Status</b>\n\n${lines.join('\n')}\n\n<b>GitHub Actions:</b>\n${gh}`);
}

async function handleDeploy() {
  await send('🚀 Деплой на Vercel...');
  const result = await run(
    'doppler run --project serpent --config dev -- vercel deploy --prod --yes 2>&1 | tail -5',
    180000,
    path.join(ROOT, 'health-dashboard')
  );
  await send(`<b>Deploy result:</b>\n<pre>${result}</pre>`);
}

async function handleUp() {
  await send('⚡ Запускаю сервисы...');
  const cmds = [
    `doppler run --project serpent --config dev -- npm run api:dev &`,
    `sleep 2 && doppler run --project serpent --config dev -- npx serve health-dashboard -l 5176 --no-clipboard &`,
  ];
  for (const cmd of cmds) {
    await run(cmd, 10000, path.join(ROOT, 'shadow-stack-widget-1'));
  }
  await send('✅ Сервисы запущены\n🌐 Express: :3001\n📊 Dashboard: :5176');
}

async function handleRestart() {
  await send('♻️ Перезапуск...');
  await run('pkill -f "node server" || true', 5000);
  await run('pkill -f "serve health" || true', 5000);
  await handleUp();
}

async function handleLogs() {
  const result = await run('ps aux | grep node | grep -v grep | head -10', 10000);
  await send(`<b>Running Node processes:</b>\n<pre>${result}</pre>`);
}

async function handleVersion() {
  const result = await run('grep -o \'v[0-9]\\.[0-9]\' health-dashboard/index.html | head -1', 5000);
  const pkg = await run('node -e "const p=require(\'./package.json\');console.log(p.version)"', 5000);
  await send(`<b>Shadow Stack</b>\n📊 Dashboard: ${result.trim()}\n📦 Package: ${pkg.trim()}\n📅 2026-03-26`);
}

// ─── polling (no webhook needed) ─────────────────────────────────────────────
let offset = 0;

async function poll() {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${TOKEN}/getUpdates?timeout=30&offset=${offset}`,
      method: 'GET',
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', async () => {
        try {
          const { result: updates } = JSON.parse(d);
          for (const u of (updates || [])) {
            offset = u.update_id + 1;
            const text = u.message?.text;
            if (!text) continue;
            // only respond to authorized chat
            if (String(u.message.chat.id) !== String(CHAT_ID)) continue;
            const cmd = text.replace(/^\//, '').split(/\s+/)[0].toLowerCase();
            console.log(`[cmd] /${cmd}`);
            try {
              if (cmd === 'help' || cmd === 'start') {
                const lines = Object.entries(COMMANDS).map(([n, i]) => `• /${n} — ${i.desc}`).join('\n');
                await send(`🤖 <b>Shadow Stack Orchestrator</b>\n\n${lines}\n\n<i>v4.1 — 2026-03-26</i>`);
              } else if (cmd === 'status')  { await handleStatus(); }
              else if (cmd === 'deploy')  { await handleDeploy(); }
              else if (cmd === 'up')      { await handleUp(); }
              else if (cmd === 'restart') { await handleRestart(); }
              else if (cmd === 'logs')    { await handleLogs(); }
              else if (cmd === 'version') { await handleVersion(); }
              else if (cmd === 'ping')    { await send('🏓 pong — Shadow Stack online'); }
              else if (cmd === 'build')   { await send('⏳ Building...'); await send(`<pre>${await run('npm run build', 120000)}</pre>`); }
              else if (cmd === 'test')    { await send('⏳ Testing...'); await send(`<pre>${await run('npm test || echo no tests', 120000)}</pre>`); }
              else if (cmd === 'lint')    { await send('⏳ Linting...'); await send(`<pre>${await run('npm run lint || echo no lint', 60000)}</pre>`); }
              else { await send(`❓ Неизвестная команда: <code>/${cmd}</code>\nОтправь /help`); }
            } catch (e) { await send(`⚠️ Ошибка: ${e.message}`); }
          }
        } catch (e) { console.error('poll parse error:', e.message); }
        resolve();
      });
    });
    req.on('error', (e) => { console.error('poll error:', e.message); resolve(); });
    req.end();
  });
}

async function startPolling() {
  console.log('🤖 Shadow Stack Orchestrator started (long-polling)');
  await send('🟢 <b>Shadow Stack Orchestrator online</b>\nОтправь /help для списка команд');
  while (true) {
    await poll();
    await new Promise(r => setTimeout(r, 1000));
  }
}

// ─── HTTP health endpoint ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', mode: 'polling', repo: GITHUB_REPO, ts: new Date().toISOString() }));
  } else {
    res.writeHead(404); res.end('Not Found');
  }
}).listen(PORT, () => console.log(`🌐 Health endpoint: http://localhost:${PORT}/health`));

startPolling().catch(console.error);

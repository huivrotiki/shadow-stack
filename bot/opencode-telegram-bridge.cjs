#!/usr/bin/env node

const http = require('http');
const https = require('https');
const { exec } = require('child_process');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_REPO = process.env.GITHUB_REPO || 'serpentme/shadow-stack-widget';

if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error('❌ Missing TELEGRAM_TOKEN or TELEGRAM_CHAT_ID');
  process.exit(1);
}

const COMMANDS = {
  build: { cmd: 'npm run build', desc: 'Собрать проект', timeout: 120000 },
  test: { cmd: 'npm test || npm run test', desc: 'Запустить тесты', timeout: 120000 },
  lint: { cmd: 'npm run lint || echo "no lint script"', desc: 'Линтер', timeout: 60000 },
  status: { cmd: '', desc: 'Статус GitHub Actions', timeout: 20000 },
  help: { cmd: '', desc: 'Список команд', timeout: 5000 },
};

function sendTelegramMessage(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' });
    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${TELEGRAM_TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve({ ok: true }); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function execCommand(cmd, timeout) {
  return new Promise((resolve) => {
    const child = exec(cmd, { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      resolve(error ? `❌ Error:\n${stderr || error.message}` : `✅ Success:\n${(stdout || stderr || 'OK').slice(0, 1800)}`);
    });
    if (timeout) setTimeout(() => { child.kill('SIGTERM'); resolve('⏰ Timeout'); }, timeout);
  });
}

async function getWorkflowStatus() {
  if (!GITHUB_TOKEN) return '⚠️ GITHUB_TOKEN не задан';
  const opts = { hostname: 'api.github.com', path: `/repos/${GITHUB_REPO}/actions/runs?per_page=1`, method: 'GET', headers: { 'User-Agent': 'shadow-stack-bot', Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' } };
  return new Promise((resolve) => {
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const run = JSON.parse(data).workflow_runs?.[0];
          if (!run) { resolve('📊 Нет запусков'); return; }
          const icon = run.conclusion === 'success' ? '✅' : run.status === 'in_progress' ? '⏳' : '❌';
          resolve(`${icon} <b>${run.name}</b>\nStatus: ${run.status}\nConclusion: ${run.conclusion}\nURL: ${run.html_url}`);
        } catch { resolve('⚠️ Ошибка парсинга'); }
      });
    });
    req.on('error', () => resolve('⚠️ Ошибка GitHub'));
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    req.on('data', (chunk) => (body += chunk.toString()));
    req.on('end', async () => {
      try {
        const { message } = JSON.parse(body);
        if (message?.text) {
          const cmdName = message.text.replace(/^\//, '').split(/\s+/)[0].toLowerCase();
          if (cmdName === 'help' || cmdName === 'start') {
            const lines = Object.entries(COMMANDS).map(([n, i]) => `• /${n} — ${i.desc}`).join('\n');
            await sendTelegramMessage(`🤖 <b>Shadow Stack Bot</b>\n\n${lines}`);
          } else if (cmdName === 'status') {
            await sendTelegramMessage(await getWorkflowStatus());
          } else if (COMMANDS[cmdName]) {
            await sendTelegramMessage(`⏳ /${cmdName}...`);
            await sendTelegramMessage(`<pre>${await execCommand(COMMANDS[cmdName].cmd, COMMANDS[cmdName].timeout)}</pre>`);
          } else {
            await sendTelegramMessage(`❌ Неизвестная команда: /${cmdName}`);
          }
        }
      } catch (e) { console.error(e.message); }
      res.writeHead(200); res.end(JSON.stringify({ ok: true }));
    });
  } else if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', repo: GITHUB_REPO, ts: new Date().toISOString() }));
  } else {
    res.writeHead(404); res.end('Not Found');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Bot on :${PORT}`));

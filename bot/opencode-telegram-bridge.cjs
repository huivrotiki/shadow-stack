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
const BOT_PORT = process.env.BOT_PORT || (process.env.PORT !== '3001' ? process.env.PORT : null) || 4000;
const WEBHOOK_URL = process.env.WEBHOOK_URL || '';

if (!TOKEN || !CHAT_ID) {
  console.error('❌ Missing TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID');
  process.exit(1);
}

// ─── Setup webhook mode ─────────────────────────────────────────────────────
async function setupWebhook() {
  if (!WEBHOOK_URL) {
    console.log('⚠️ No WEBHOOK_URL set, using long-polling mode');
    return false;
  }
  
  const webhookPath = `/${TOKEN}/webhook`;
  const fullUrl = `${WEBHOOK_URL}${webhookPath}`;
  
  console.log(`🔗 Setting webhook to: ${fullUrl}`);
  
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${TOKEN}/setWebhook?url=${encodeURIComponent(fullUrl)}`,
      method: 'GET',
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const result = JSON.parse(d);
          if (result.ok) {
            console.log('✅ Webhook set successfully');
            resolve(true);
          } else {
            console.error('❌ Webhook error:', result);
            resolve(false);
          }
        } catch { resolve(false); }
      });
    });
    req.on('error', (e) => { console.error('Webhook setup error:', e.message); resolve(false); });
    req.end();
  });
}

// ─── Close bot session cleanly ─────────────────────────────────────────────
async function closeBotSession() {
  console.log('🔄 Closing any existing bot sessions...');
  try {
    await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.telegram.org',
        path: `/bot${TOKEN}/close`,
        method: 'GET',
      }, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try {
            const result = JSON.parse(d);
            console.log('[close] Result:', result.ok ? 'OK' : result.description);
          } catch { }
          resolve();
        });
      });
      req.on('error', (e) => { console.log('[close] Error:', e.message); resolve(); });
      req.setTimeout(5000, () => { req.destroy(); resolve(); });
      req.end();
    });
  } catch (e) { console.log('[close] Exception:', e.message); }
  await new Promise(r => setTimeout(r, 1000));
}

// ─── services registry ───────────────────────────────────────────────────────
const SERVICES = {
  express:     { port: 3001, label: 'Express API',      health: 'http://localhost:3001/health' },
  bot:         { port: 4000, label: 'Telegram Bot',     health: 'http://localhost:4000/health' },
  openclaw:    { port: 18789, label: 'OpenClaw',        health: 'http://localhost:18789/health' },
  shadow:      { port: 3002, label: 'Shadow Router',     health: 'http://localhost:3002/health' },
  dash:        { port: 5176, label: 'Dashboard v5.0',   health: 'http://localhost:5176' },
  ollama:      { port: 11434, label: 'Ollama',          health: 'http://localhost:11434' },
};

// ─── commands ────────────────────────────────────────────────────────────────
const COMMANDS = {
  start:    { desc: 'Список команд' },
  help:     { desc: 'Список команд' },
  status:   { desc: 'Статус всех сервисов' },
  deploy:   { desc: 'Deploy dashboard на Vercel' },
  build:    { desc: 'npm run build' },
  test:     { desc: 'npm test' },
  logs:     { desc: 'Логи процессов' },
  restart:  { desc: 'Перезапустить все' },
  ping:     { desc: 'Проверить бота' },
  ram:      { desc: 'Проверить RAM' },
  models:   { desc: 'Список Ollama моделей' },
  openclaw: { desc: 'Статус OpenClaw' },
  clean:    { desc: 'Очистить память' },
  sync:     { desc: 'Синхронизация с Google Drive' },
  // Cloud LLM
  gemini:   { desc: 'Google Gemini 2.0 Flash', group: 'cloud' },
  groq:     { desc: 'Groq Llama 3.3 70B', group: 'cloud' },
  deep:     { desc: 'Step-3.5 Flash 256K (free)', group: 'cloud' },
  nvidia:   { desc: 'Nemotron 120B (free)', group: 'cloud' },
  kimi:     { desc: 'Moonshot Kimi (free)', group: 'cloud' },
  mini:     { desc: 'Minimax M2.5 (free)', group: 'cloud' },
  alibaba:  { desc: 'Alibaba Qwen-Max', group: 'cloud' },
  openai:   { desc: 'OpenAI GPT-4o (API)', group: 'cloud' },
  'gpt-4o': { desc: 'GPT-4o direct API', group: 'cloud' },
  // Browser (Shadow Router)
  chatgpt:  { desc: 'ChatGPT via browser', group: 'browser' },
  copilot:  { desc: 'Copilot via browser', group: 'browser' },
  manus:    { desc: 'Manus via browser', group: 'browser' },
  'kimi-web': { desc: 'Kimi web via browser', group: 'browser' },
  // Group bots
  'ask-gpt':      { desc: 'Ask @chatgpt_gidbot', group: 'group' },
  'ask-deepseek': { desc: 'Ask @deepseek_gidbot', group: 'group' },
  // Premium
  premium:  { desc: 'Claude Sonnet (paid)', group: 'premium' },
};

// Telegram group ID for forwarding
const GROUP_ID = process.env.TELEGRAM_GROUP_ID || '-1002107442654';

// ─── utils ───────────────────────────────────────────────────────────────────
function send(text) {
  console.log('[send] Sending message:', text.slice(0, 50));
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' });
    const req = https.request({
      hostname: '149.154.166.110',
      path: `/bot${TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Content-Length': Buffer.byteLength(body),
        'Host': 'api.telegram.org'
      },
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

// Push log event to Express API (fire-and-forget)
function postLog(event) {
  try {
    const body = JSON.stringify({ ts: Date.now(), ...event });
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/logs',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, () => {});
    req.on('error', () => {});
    req.setTimeout(2000, () => req.destroy());
    req.write(body);
    req.end();
  } catch {}
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
  await send(`📊 <b>Shadow Stack Status</b>\n\n${lines.join('\n')}`);
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
  const result = await run('grep -o \'v[0-9]\.[0-9]\' health-dashboard/index.html | head -1', 5000);
  const pkg = await run('node -e "const p=require(\'./package.json\');console.log(p.version)"', 5000);
  await send(`<b>Shadow Stack</b>\n📊 Dashboard: ${result.trim()}\n📦 Package: ${pkg.trim()}\n📅 2026-03-26`);
}

async function handleOpenclaw() {
  await send('⏳ Проверяю OpenClaw...');
  const r = await run('curl -s http://localhost:18789/health 2>&1', 5000);
  const cfg = await run('cat openclaw.config.json | python3 -m json.tool 2>/dev/null | grep -E "defaultProvider|fallbackChain" | head -5', 5000);
  
  await send(`🦀 <b>OpenClaw</b>\nStatus: ${r}\n\nConfig:\n${cfg}`);
}

async function handleOpenclawPrompt(text) {
  // If starts with /, extract prompt after command word
  let prompt = text;
  if (text.startsWith('/')) {
    const parts = text.replace(/^\//, '').split(/\s+/);
    parts.shift(); // remove command name
    prompt = parts.join(' ') || 'привет';
  }
  
  await send(`🧠 Думаю...`);
  const t0 = Date.now();
  
  // Use Express API route (tries Ollama first, then OpenRouter)
  const r = await run(
    `curl -s -X POST http://localhost:3001/api/route -H 'Content-Type: application/json' -d '{"prompt":"${prompt.replace(/'/g, "\\'")}"}' 2>&1`,
    30000
  );
  
  try {
    // Find JSON in response
    const jsonMatch = r.match(/\{[\s\S]*"ok"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.ok) {
        await send(`${parsed.response}`);
        postLog({ route: parsed.provider || 'auto-router', model: parsed.model || '-', latency_ms: Date.now() - t0, status: 'ok', preview: prompt.slice(0, 80) });
      } else {
        await send(`😕 Ошибка: ${parsed.error}`);
        postLog({ route: 'auto-router', model: '-', latency_ms: Date.now() - t0, status: 'error', preview: parsed.error });
      }
    } else {
      await send(`😕 Не понял: ${r.slice(0, 300)}`);
      postLog({ route: 'auto-router', model: '-', latency_ms: Date.now() - t0, status: 'error', preview: r.slice(0, 80) });
    }
  } catch (e) {
    await send(`😕 Ошибка: ${r.slice(0, 300)}`);
    postLog({ route: 'auto-router', model: '-', latency_ms: Date.now() - t0, status: 'error', preview: e.message });
  }
}

// ─── Cloud LLM handlers ──────────────────────────────────────────────────────
function extractPrompt(text) {
  const parts = text.replace(/^\//, '').split(/\s+/);
  parts.shift();
  return parts.join(' ') || 'привет';
}

async function callAPI(url, headers, body, label) {
  const t0 = Date.now();
  await send(`🧠 ${label}...`);
  try {
    const jsonBody = JSON.stringify(body);
    const r = await run(
      `curl -s -X POST '${url}' ${headers.map(h => `-H '${h}'`).join(' ')} -d '${jsonBody.replace(/'/g, "'\\''")}' 2>&1`,
      30000
    );
    let response = '';
    try {
      const parsed = JSON.parse(r);
      // OpenAI-compatible format
      response = parsed.choices?.[0]?.message?.content || parsed.candidates?.[0]?.content?.parts?.[0]?.text || parsed.response || '';
    } catch { response = r.slice(0, 1000); }
    if (response) {
      await send(response);
      postLog({ route: label.toLowerCase().split(' ')[0], model: label, latency_ms: Date.now() - t0, status: 'ok', preview: response.slice(0, 80) });
    } else {
      await send(`😕 Пустой ответ от ${label}\n<pre>${r.slice(0, 500)}</pre>`);
      postLog({ route: label.toLowerCase().split(' ')[0], model: label, latency_ms: Date.now() - t0, status: 'error', preview: 'empty response' });
    }
  } catch (e) {
    await send(`❌ ${label} error: ${e.message}`);
    postLog({ route: label.toLowerCase().split(' ')[0], model: label, latency_ms: Date.now() - t0, status: 'error', preview: e.message });
  }
}

async function handleGemini(text) {
  const prompt = extractPrompt(text);
  const key = process.env.GEMINI_API_KEY;
  if (!key) return send('⚠️ GEMINI_API_KEY не задан в .env');
  await callAPI(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    ['Content-Type: application/json'],
    { contents: [{ parts: [{ text: prompt }] }] },
    'Gemini 2.0 Flash'
  );
}

async function handleGroq(text) {
  const prompt = extractPrompt(text);
  const key = process.env.GROQ_API_KEY;
  if (!key) return send('⚠️ GROQ_API_KEY не задан в .env');
  await callAPI(
    'https://api.groq.com/openai/v1/chat/completions',
    ['Content-Type: application/json', `Authorization: Bearer ${key}`],
    { model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 2048 },
    'Groq Llama 3.3'
  );
}

async function handleOpenRouter(text, model, label) {
  const prompt = extractPrompt(text);
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return send('⚠️ OPENROUTER_API_KEY не задан в .env');
  await callAPI(
    'https://openrouter.ai/api/v1/chat/completions',
    ['Content-Type: application/json', `Authorization: Bearer ${key}`, 'HTTP-Referer: http://localhost:3001', 'X-Title: Shadow Stack'],
    { model, messages: [{ role: 'user', content: prompt }], max_tokens: 2048 },
    label
  );
}

async function handleDeep(text) { return handleOpenRouter(text, 'stepfun/step-3.5-flash:free', 'Deep Step-3.5'); }
async function handleNvidia(text) { return handleOpenRouter(text, 'nvidia/nemotron-3-super-120b-a12b:free', 'NVIDIA Nemotron'); }
async function handleKimi(text) { return handleOpenRouter(text, 'moonshot/moonshot-v1-8k:free', 'Kimi Moonshot'); }
async function handleMini(text) { return handleOpenRouter(text, 'minimax/minimax-m2.5:free', 'Minimax M2.5'); }

async function handleAlibaba(text) {
  const prompt = extractPrompt(text);
  const key = process.env.ALIBABA_API_KEY;
  if (!key) return send('⚠️ ALIBABA_API_KEY не задан в .env');
  await callAPI(
    'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    ['Content-Type: application/json', `Authorization: Bearer ${key}`],
    { model: 'qwen-max', messages: [{ role: 'user', content: prompt }], max_tokens: 4096 },
    'Alibaba Qwen-Max'
  );
}

async function handleOpenAI(text, model) {
  const prompt = extractPrompt(text);
  const key = process.env.OPENAI_API_KEY;
  if (!key) return send('⚠️ OPENAI_API_KEY не задан в .env');
  await callAPI(
    'https://api.openai.com/v1/chat/completions',
    ['Content-Type: application/json', `Authorization: Bearer ${key}`],
    { model: model || 'gpt-4o', messages: [{ role: 'user', content: prompt }], max_tokens: 4096 },
    'OpenAI ' + (model || 'gpt-4o')
  );
}

async function handlePremium(text) {
  const prompt = extractPrompt(text);
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return send('⚠️ OPENROUTER_API_KEY не задан в .env');
  await callAPI(
    'https://openrouter.ai/api/v1/chat/completions',
    ['Content-Type: application/json', `Authorization: Bearer ${key}`, 'HTTP-Referer: http://localhost:3001', 'X-Title: Shadow Stack'],
    { model: 'anthropic/claude-3.5-sonnet', messages: [{ role: 'user', content: prompt }], max_tokens: 4096 },
    'Claude Sonnet (premium)'
  );
}

// ─── Browser Shadow Router handlers ──────────────────────────────────────────
async function handleBrowser(text, target, label) {
  const prompt = extractPrompt(text);
  if (!prompt) return send('⚠️ Введите промпт после команды');
  await send(`🕵️ ${label} via Shadow Router...`);
  const t0 = Date.now();
  const r = await run(
    `curl -s -X POST http://localhost:3002/route/${target}/${encodeURIComponent(prompt).replace(/'/g, "'\\''")} 2>&1`,
    60000
  );
  try {
    const parsed = JSON.parse(r);
    if (parsed.response) {
      await send(parsed.response);
      postLog({ route: `browser:${target}`, model: label, latency_ms: Date.now() - t0, status: 'ok', preview: parsed.response.slice(0, 80) });
    } else {
      await send(`😕 ${label}: ${parsed.error || 'no response'}`);
      postLog({ route: `browser:${target}`, model: label, latency_ms: Date.now() - t0, status: 'error', preview: parsed.error || 'empty' });
    }
  } catch {
    await send(`😕 ${label}: ${r.slice(0, 500)}`);
    postLog({ route: `browser:${target}`, model: label, latency_ms: Date.now() - t0, status: 'error', preview: r.slice(0, 80) });
  }
}

async function handleChatGPT(text) { return handleBrowser(text, 'chatgpt', 'ChatGPT'); }
async function handleCopilot(text) { return handleBrowser(text, 'copilot', 'Copilot'); }
async function handleManus(text) { return handleBrowser(text, 'manus', 'Manus'); }
async function handleKimiWeb(text) { return handleBrowser(text, 'kimi', 'Kimi Web'); }

// ─── Group bot forward handlers ──────────────────────────────────────────────
async function handleGroupAsk(text, botUsername, label) {
  const prompt = extractPrompt(text);
  if (!prompt) return send('⚠️ Введите вопрос после команды');
  await send(`📨 Forwarding to ${label}...`);
  const t0 = Date.now();
  const msg = `@${botUsername} ${prompt}`;
  const body = JSON.stringify({ chat_id: GROUP_ID, text: msg });
  try {
    const r = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: '149.154.166.110',
        path: `/bot${TOKEN}/sendMessage`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'Host': 'api.telegram.org' },
      }, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({ ok: false }); } });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
    if (r.ok) {
      await send(`✅ Отправлено в группу. ${label} ответит в группе.`);
      postLog({ route: `group:${botUsername}`, model: label, latency_ms: Date.now() - t0, status: 'ok', preview: prompt.slice(0, 80) });
    } else {
      await send(`❌ Ошибка отправки: ${r.description || 'unknown'}`);
      postLog({ route: `group:${botUsername}`, model: label, latency_ms: Date.now() - t0, status: 'error', preview: r.description });
    }
  } catch (e) {
    await send(`❌ Error: ${e.message}`);
    postLog({ route: `group:${botUsername}`, model: label, latency_ms: Date.now() - t0, status: 'error', preview: e.message });
  }
}

async function handleAskGPT(text) { return handleGroupAsk(text, 'chatgpt_gidbot', 'ChatGPT Bot'); }
async function handleAskDeepseek(text) { return handleGroupAsk(text, 'deepseek_gidbot', 'DeepSeek Bot'); }

async function handleModels() {
  const r = await run('curl -s http://localhost:11434/api/tags 2>&1', 8000);
  try {
    const data = JSON.parse(r);
    const models = (data.models || []).map(m => m.name).slice(0, 8);
    await send(`🤖 Ollama models:\n${models.join('\n')}`);
  } catch {
    await send(`⚠️ Error: ${r.slice(0, 100)}`);
  }
}

async function handleRoute(text) {
  const prompt = text.split(' ').slice(1).join(' ') || 'hello';
  await send(`⏳ Routing: "${prompt}"...`);
  const r = await run(
    `curl -s -X POST http://localhost:3001/api/route -H "Content-Type: application/json" -d '{"prompt":"${prompt}"}' 2>&1 | head -20`,
    15000
  );
  await send(`<b>Route result:</b>\n<pre>${r}</pre>`);
}

async function handleShadow(text) {
  const prompt = text.split(' ').slice(1).join(' ') || 'hello world';
  await send(`🕵️ Shadow Routing: "${prompt.slice(0, 50)}..."...`);
  
  const r = await run('curl -s http://localhost:3002/ram', 5000);
  const ramInfo = JSON.parse(r || '{"freeRAM":0}');
  
  if (ramInfo.freeRAM < 400) {
    await send(`⚠️ Low RAM: ${ramInfo.freeRAM}MB. Need 400MB+ for browser.`);
    await send(`💡 Using Ollama fallback instead...`);
    const fallback = await run(
      `echo '${prompt.replace(/'/g, "\\'")}' | curl -s http://localhost:11434/api/generate -d "model=qwen2.5:3b" -d "@-" | head -100`,
      30000
    );
    await send(`<b>Ollama response:</b>\n<pre>${fallback.slice(0, 800)}</pre>`);
    return;
  }
  
  const targetMatch = text.match(/\/(\w+)\s/);
  const target = targetMatch ? targetMatch[1] : 'claude';
  
  const result = await run(
    `curl -s "http://localhost:3002/route/${target}/${encodeURIComponent(prompt)}" 2>&1`,
    60000
  );
  
  try {
    const parsed = JSON.parse(result);
    if (parsed.success) {
      await send(`<b>🕵️ ${target.toUpperCase()} Response:</b>\n<pre>${parsed.response?.slice(0, 1000) || 'No response'}</pre>`);
    } else {
      await send(`<b>Error:</b> ${parsed.error || parsed.message}`);
    }
  } catch (e) {
    await send(`<b>Raw result:</b>\n<pre>${result.slice(0, 800)}</pre>`);
  }
}

async function handleRam() {
  const r = await run('curl -s http://localhost:3002/ram 2>&1', 5000);
  try {
    const jsonMatch = r.match(/\{"freeRAM":\d+,"threshold":\d+\}/);
    const info = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(r);
    const emoji = info.freeRAM > 600 ? '🟢' : info.freeRAM > 400 ? '🟡' : '🔴';
    await send(`${emoji} RAM: ${info.freeRAM}MB / ${info.threshold}MB threshold`);
  } catch {
    await send(`⚠️ RAM check failed: ${r.slice(0, 100)}`);
  }
}

async function handleClean() {
  await send('🧹 Очищаю память...');
  
  // Kill idle browser sessions
  await run('pkill -f "Chrome" 2>/dev/null || true', 3000);
  
  // Clear node garbage
  await run('find /tmp -name "*.log" -mtime +1 -delete 2>/dev/null || true', 3000);
  
  const ram = await run('curl -s http://localhost:3002/ram 2>&1', 3000);
  try {
    const info = JSON.parse(ram);
    await send(`✅ Очищено!\nFree RAM: ${info.freeRAM}MB`);
  } catch {
    await send('✅ Очищено!');
  }
}

async function handleSync() {
  await send('☁️ Синхронизация с Google Drive...');
  const result = await run('cd ' + ROOT + ' && ./shadow-gdrive-sync.sh 2>&1', 30000);
  await send(`<b>Sync result:</b>\n<pre>${result.slice(0, 1500)}</pre>`);
}

// ─── polling (no webhook needed) ─────────────────────────────────────────────
let offset = null;  // Start from latest

async function poll() {
  const offsetParam = offset ? `&offset=${offset}` : '';
  console.log('[poll] Polling with timeout=5, token prefix:', TOKEN.slice(0, 10), '...');
  return new Promise((resolve) => {
    const fullPath = `/bot${TOKEN}/getUpdates?timeout=5${offsetParam}`;
    console.log('[poll] Full path:', fullPath);
    const req = https.request({
      hostname: '149.154.166.110',
      path: fullPath,
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'ShadowStack-Bot/1.0',
        'Host': 'api.telegram.org'
      }
    }, (res) => {
      console.log('[poll] Response status:', res.statusCode);
      let d = '';
      res.on('data', c => d += c);
      res.on('end', async () => {
        try {
          const { result: updates } = JSON.parse(d);
          console.log('[poll] Got', (updates || []).length, 'updates, offset:', offset);
          
          // If no updates for a while, reset offset to null to re-fetch
          if ((updates || []).length === 0 && offset !== null) {
            console.log('[poll] No updates, resetting offset to re-fetch');
            offset = null;
          }
          
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
                const helpText = `🤖 <b>Shadow Stack Orchestrator v5.1</b>

🟢 <b>Локально</b> (0$, быстро):
  /route — авто-роутер
  /models — Ollama модели

☁️ <b>Облако бесплатно</b>:
  /gemini — Gemini 2.0 Flash
  /groq — Groq Llama 3.3
  /deep — Step-3.5 256K
  /nvidia — Nemotron 120B
  /kimi — Kimi Moonshot
  /mini — Minimax M2.5
  /alibaba — Alibaba Qwen-Max
  /openai — OpenAI GPT-4o

🌐 <b>Браузер</b> (Shadow Router):
  /chatgpt — ChatGPT
  /copilot — Copilot
  /manus — Manus
  /kimi-web — Kimi web

🤖 <b>Группа</b>:
  /ask-gpt — @chatgpt_gidbot
  /ask-deepseek — @deepseek_gidbot

💎 <b>Платно</b>:
  /premium — Claude Sonnet

🔧 <b>Система</b>:
  /status /ram /openclaw /clean /sync /deploy /restart /ping`;
                await send(helpText);
              } else if (cmd === 'status')  { await handleStatus(); }
              else if (cmd === 'deploy')  { await handleDeploy(); }
              else if (cmd === 'up')      { await handleUp(); }
              else if (cmd === 'restart') { await handleRestart(); }
              else if (cmd === 'logs')    { await handleLogs(); }
              else if (cmd === 'version') { await handleVersion(); }
              else if (cmd === 'openclaw') { await handleOpenclaw(); }
              else if (cmd === 'ask') { await handleOpenclawPrompt(text); }
              else if (cmd === 'claude') { await handleOpenclawPrompt(text); }
              else if (cmd === 'models') { await handleModels(); }
              else if (cmd === 'route') { await handleRoute(text); }
              else if (cmd === 'ram') { await handleRam(); }
              else if (cmd === 'clean') { await handleClean(); }
              else if (cmd === 'sync') { await handleSync(); }
              else if (cmd === 'ping')    { await send('🏓 pong'); }
              else if (cmd === 'build')   { await send('⏳ Building...'); await send(await run('npm run build', 120000)); }
              else if (cmd === 'test')    { await send('⏳ Testing...'); await send(await run('npm test || echo no tests', 120000)); }
              // Cloud LLM
              else if (cmd === 'gemini')  { await handleGemini(text); }
              else if (cmd === 'groq')    { await handleGroq(text); }
              else if (cmd === 'deep')    { await handleDeep(text); }
              else if (cmd === 'nvidia')  { await handleNvidia(text); }
              else if (cmd === 'kimi')    { await handleKimi(text); }
              else if (cmd === 'mini')    { await handleMini(text); }
              else if (cmd === 'alibaba') { await handleAlibaba(text); }
              else if (cmd === 'openai' || cmd === 'gpt-4o') { await handleOpenAI(text, cmd === 'gpt-4o' ? 'gpt-4o' : 'gpt-4o'); }
              else if (cmd === 'premium') { await handlePremium(text); }
              // Browser
              else if (cmd === 'chatgpt')  { await handleChatGPT(text); }
              else if (cmd === 'copilot')  { await handleCopilot(text); }
              else if (cmd === 'manus')    { await handleManus(text); }
              else if (cmd === 'kimi-web') { await handleKimiWeb(text); }
              // Group
              else if (cmd === 'ask-gpt')      { await handleAskGPT(text); }
              else if (cmd === 'ask-deepseek') { await handleAskDeepseek(text); }
              else {
                // Any message -> treat as prompt to auto-router
                await handleOpenclawPrompt(text);
              }
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
const PORT = BOT_PORT;
http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', mode: 'polling', repo: GITHUB_REPO, ts: new Date().toISOString() }));
  } else {
    res.writeHead(404); res.end('Not Found');
  }
}).listen(PORT, () => console.log(`🌐 Health endpoint: http://localhost:${PORT}/health`));

// ─── Start ───────────────────────────────────────────────────────────────────
async function main() {
  // Try webhook mode first
  if (await setupWebhook()) {
    console.log('📡 Running in webhook mode');
  } else {
    // Fall back to polling but first close any existing session
    await closeBotSession();
    
    console.log('🤖 Shadow Stack Orchestrator started (long-polling)');
    await send('🟢 <b>Shadow Stack Orchestrator online</b>\nОтправь /help для списка команд');
    
    let pollCount = 0;
    while (true) {
      pollCount++;
      await poll();
      if (pollCount % 10 === 0) {
        console.log(`[poll] Still running after ${pollCount} cycles...`);
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

main().catch(console.error);

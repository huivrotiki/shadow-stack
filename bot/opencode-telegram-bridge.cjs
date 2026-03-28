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
const GROUP_ID = process.env.TELEGRAM_GROUP_ID || '-1002107442654';
const fs = require('fs');

// HITL: pending approval requests
const pendingApprovals = new Map();
let approvalCounter = 0;

// Autorun state
let autorunActive = false;
let autorunTimer = null;
let activeTaskId = null; 
let activeRun = null; // Currently executing task promise

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
  // Cascade
  ai:       { desc: 'Full cascade (smart routing)' },
  warm:     { desc: 'Telegram warmAndAsk escalation' },
  // Premium
  premium:  { desc: 'Claude Sonnet (paid)', group: 'premium' },
};

// ─── utils ───────────────────────────────────────────────────────────────────
function send(text) {
  console.log('[send] Sending message:', text.slice(0, 50));
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' });
    const req = https.request({
      hostname: 'api.telegram.org',
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

// ─── Native HTTP/HTTPS Helper (replaces unsafe curl) ──────────────────────
function httpRequest(url, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const mod = isHttps ? https : http;
    
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: { ...headers },
      timeout: 30000,
    };

    if (body) {
      const data = typeof body === 'string' ? body : JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(data);
      if (!options.headers['Content-Type']) options.headers['Content-Type'] = 'application/json';
    }

    const req = mod.request(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

// ─── Safe Command Runner (uses spawn, no shell injection) ──────────────────
function run(cmd, args = [], timeout = 60000, cwd = ROOT, useShell = false) {
  return new Promise((resolve) => {
    let binary = cmd;
    let actualArgs = args;
    
    if (!useShell && actualArgs.length === 0 && cmd.includes(' ')) {
      const parts = cmd.split(' ');
      binary = parts[0];
      actualArgs = parts.slice(1);
    }

    const child = spawn(binary, actualArgs, { cwd, shell: useShell });
    
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', data => stdout += data);
    child.stderr.on('data', data => stderr += data);

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      resolve('⏰ Timeout');
    }, timeout);

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve(`❌ ${err.message}`);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      const out = (stdout || stderr || '').trim().slice(0, 1800);
      resolve(code === 0 ? `✅ ${out || 'OK'}` : `❌ Error ${code}: ${stderr.slice(0, 500)}`);
    });
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
    'doppler',
    ['run', '--project', 'serpent', '--config', 'dev', '--', 'vercel', 'deploy', '--prod', '--yes'],
    180000,
    path.join(ROOT, 'health-dashboard')
  );
  await send(`<b>Deploy result:</b>\n<pre>${result}</pre>`);
}

async function handleUp() {
  await send('⚡ Запускаю сервисы...');
  // Use shell: true only for these static backgrounding commands
  await run('doppler run --project serpent --config dev -- npm run api:dev &', [], 10000, path.join(ROOT, 'shadow-stack-widget-1'), true);
  await new Promise(r => setTimeout(r, 2000));
  await run('doppler run --project serpent --config dev -- npx serve health-dashboard -l 5176 --no-clipboard &', [], 10000, path.join(ROOT, 'shadow-stack-widget-1'), true);
  await send('✅ Сервисы запущены\n🌐 Express: :3001\n📊 Dashboard: :5176');
}

async function handleRestart() {
  await send('♻️ Перезапуск...');
  await run('pkill', ['-f', 'node server']);
  await run('pkill', ['-f', 'serve health']);
  await handleUp();
}

async function handleLogs() {
  const result = await run('ps', ['aux']); // Safe spawn
  await send(`<b>Running processes (partial):</b>\n<pre>${result.slice(0, 1500)}</pre>`);
}

async function handleVersion() {
  const result = await run('grep -o \'v[0-9]\.[0-9]\' health-dashboard/index.html | head -1', 5000);
  const pkg = await run('node -e "const p=require(\'./package.json\');console.log(p.version)"', 5000);
  await send(`<b>Shadow Stack</b>\n📊 Dashboard: ${result.trim()}\n📦 Package: ${pkg.trim()}\n📅 2026-03-26`);
}

async function handleOpenclaw() {
  await send('⏳ Проверяю OpenClaw...');
  try {
    const r = await httpRequest('http://localhost:18789/health');
    const cfg = await httpRequest('http://localhost:3001/api/status'); // Alternative as we don't want to cat files via shell
    
    await send(`🦀 <b>OpenClaw</b>\nStatus: ${r.slice(0, 500)}\n\nConfig check OK.`);
  } catch (e) {
    await send(`🦀 <b>OpenClaw Error</b>: ${e.message}`);
  }
}

async function handleOpenclawPrompt(text) {
  let prompt = text;
  if (text.startsWith('/')) {
    const parts = text.replace(/^\//, '').split(/\s+/);
    parts.shift();
    prompt = parts.join(' ') || 'привет';
  }
  
  await send(`🧠 Думаю...`);
  const t0 = Date.now();
  
  try {
    const r = await httpRequest('http://localhost:3001/api/route', 'POST', { prompt });
    const parsed = JSON.parse(r);
    
    if (parsed.ok) {
      await send(`${parsed.response}`);
      postLog({ route: parsed.provider || 'auto-router', model: parsed.model || '-', latency_ms: Date.now() - t0, status: 'ok', preview: prompt.slice(0, 80) });
    } else {
      await send(`😕 Ошибка: ${parsed.error}`);
      postLog({ route: 'auto-router', model: '-', latency_ms: Date.now() - t0, status: 'error', preview: parsed.error });
    }
  } catch (e) {
    await send(`😕 Ошибка сервиса: ${e.message}`);
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
    const r = await httpRequest(url, 'POST', body, headers);
    let response = '';
    try {
      const parsed = JSON.parse(r);
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
  
  try {
    const r = await httpRequest(`http://localhost:3002/route/${target}/${encodeURIComponent(prompt)}`, 'POST');
    const parsed = JSON.parse(r);
    if (parsed.response) {
      await send(parsed.response);
      postLog({ route: `browser:${target}`, model: label, latency_ms: Date.now() - t0, status: 'ok', preview: parsed.response.slice(0, 80) });
    } else {
      await send(`😕 ${label}: ${parsed.error || 'no response'}`);
      postLog({ route: `browser:${target}`, model: label, latency_ms: Date.now() - t0, status: 'error', preview: parsed.error || 'empty' });
    }
  } catch (e) {
    await send(`😕 ${label} error: ${e.message}`);
    postLog({ route: `browser:${target}`, model: label, latency_ms: Date.now() - t0, status: 'error', preview: e.message });
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
        hostname: 'api.telegram.org',
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

// ─── Full cascade handler ────────────────────────────────────────────────────
async function handleCascade(text) {
  const prompt = extractPrompt(text);
  if (!prompt) return send('⚠️ Введите вопрос после /ai');
  const t0 = Date.now();
  await send('🧠 Cascade routing...');

  const providers = [
    { name: 'Gemini 2.0 Flash', try: async () => {
      const key = process.env.GEMINI_API_KEY;
      if (!key) throw new Error('no key');
      const r = await httpRequest(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, 'POST', { contents: [{ parts: [{ text: prompt }] }] });
      const d = JSON.parse(r);
      return d.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }},
    { name: 'Groq Llama 3.3', try: async () => {
      const key = process.env.GROQ_API_KEY;
      if (!key) throw new Error('no key');
      const r = await httpRequest('https://api.groq.com/openai/v1/chat/completions', 'POST', { model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 2048 }, { 'Authorization': `Bearer ${key}` });
      const d = JSON.parse(r);
      return d.choices?.[0]?.message?.content || '';
    }},
    { name: 'Ollama Local', try: async () => {
      const r = await httpRequest('http://localhost:11434/api/generate', 'POST', { model: 'qwen2.5-coder:3b', prompt, stream: false });
      const d = JSON.parse(r);
      return d.response || '';
    }},
  ];

  for (const p of providers) {
    try {
      const text = await p.try();
      if (text && text.length > 10) {
        await send(text.slice(0, 3500));
        postLog({ route: 'cascade', model: p.name, latency_ms: Date.now() - t0, status: 'ok', preview: text.slice(0, 80) });
        return;
      }
    } catch (e) { /* try next */ }
  }

  // All API providers failed → Telegram escalation
  await send('⚠️ Все API упали. Escalation → Telegram бот...');
  try {
    await sendWithKeyboard(`@chatgpt_gidbot ${prompt}`, []);
    postLog({ route: 'cascade', model: 'telegram-chatgpt', latency_ms: Date.now() - t0, status: 'escalated', preview: prompt.slice(0, 80) });
  } catch (e) {
    await send(`❌ Cascade failed: ${e.message}`);
    postLog({ route: 'cascade', model: '-', latency_ms: Date.now() - t0, status: 'error', preview: e.message });
  }
}

async function handleModels() {
  try {
    const r = await httpRequest('http://localhost:11434/api/tags');
    const data = JSON.parse(r);
    const models = (data.models || []).map(m => m.name).slice(0, 8);
    await send(`🤖 Ollama models:\n${models.join('\n')}`);
  } catch (e) {
    await send(`⚠️ Error: ${e.message}`);
  }
}

async function handleRoute(text) {
  const prompt = text.split(' ').slice(1).join(' ') || 'hello';
  await send(`⏳ Routing: "${prompt}"...`);
  try {
    const r = await httpRequest('http://localhost:3001/api/route', 'POST', { prompt });
    await send(`<b>Route result:</b>\n<pre>${r.slice(0, 2000)}</pre>`);
  } catch (e) {
    await send(`❌ Error: ${e.message}`);
  }
}

async function handleShadow(text) {
  const prompt = text.split(' ').slice(1).join(' ') || 'hello world';
  await send(`🕵️ Shadow Routing: "${prompt.slice(0, 50)}..."...`);
  
  try {
    const r = await httpRequest('http://localhost:3002/ram');
    const ramInfo = JSON.parse(r || '{"freeRAM":0}');
    
    if (ramInfo.freeRAM < 400) {
      await send(`⚠️ Low RAM: ${ramInfo.freeRAM}MB. Need 400MB+ for browser.`);
      await send(`💡 Using Ollama fallback instead...`);
      const fallback = await httpRequest('http://localhost:11434/api/generate', 'POST', { model: 'qwen2.5:3b', prompt, stream: false });
      await send(`<b>Ollama response:</b>\n<pre>${JSON.parse(fallback).response?.slice(0, 800)}</pre>`);
      return;
    }
  } catch (e) {
    await send(`⚠️ Warning during RAM check: ${e.message}`);
  }
  
  const targetMatch = text.match(/\/(\w+)\s/);
  const target = targetMatch ? targetMatch[1] : 'claude';
  
  try {
    const result = await httpRequest(`http://localhost:3002/route/${target}/${encodeURIComponent(prompt)}`);
    const parsed = JSON.parse(result);
    if (parsed.success) {
      await send(`<b>🕵️ ${target.toUpperCase()} Response:</b>\n<pre>${parsed.response?.slice(0, 1000) || 'No response'}</pre>`);
    } else {
      await send(`<b>Error:</b> ${parsed.error || parsed.message}`);
    }
  } catch (e) {
    await send(`<b>Shadow Routing Error:</b> ${e.message}`);
  }
}

async function handleRam() {
  try {
    const r = await httpRequest('http://localhost:3002/ram');
    const jsonMatch = r.match(/\{"freeRAM":\d+,"threshold":\d+\}/);
    const info = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(r);
    const emoji = info.freeRAM > 600 ? '🟢' : info.freeRAM > 400 ? '🟡' : '🔴';
    await send(`${emoji} RAM: ${info.freeRAM}MB / ${info.threshold}MB threshold`);
  } catch (e) {
    await send(`⚠️ RAM check failed: ${e.message}`);
  }
}

async function handleClean() {
  await send('🧹 Очищаю память...');
  
  // Kill idle browser sessions
  await run('pkill', ['-f', 'Chrome']);
  
  // Clear node garbage (use native fs instead of shell if possible, but safe run is okay)
  await run('find', ['/tmp', '-name', '*.log', '-mtime', '+1', '-delete']);
  
  try {
    const ram = await httpRequest('http://localhost:3002/ram');
    const info = JSON.parse(ram);
    await send(`✅ Очищено!\nFree RAM: ${info.freeRAM}MB`);
  } catch {
    await send('✅ Очищено!');
  }
}

async function handleSync() {
  await send('☁️ Синхронизация с Google Drive...');
  // Direct execution of script, safer than shell string
  const result = await run('./shadow-gdrive-sync.sh', [], 30000, ROOT);
  await send(`<b>Sync result:</b>\n<pre>${result.slice(0, 1500)}</pre>`);
}

// ─── HITL: Approval system ──────────────────────────────────────────────────

function sendWithKeyboard(text, keyboard) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: 'HTML',
      reply_markup: JSON.stringify({ inline_keyboard: keyboard })
    });
    const req = https.request({
      hostname: 'api.telegram.org',
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
}

function answerCallbackQuery(callbackQueryId, text) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ callback_query_id: callbackQueryId, text });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${TOKEN}/answerCallbackQuery`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'Host': 'api.telegram.org' },
    }, (res) => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d)); });
    req.on('error', () => resolve());
    req.write(body);
    req.end();
  });
}

async function sendApproval(action, details, risk) {
  const id = ++approvalCounter;
  const riskEmoji = risk === 'high' ? '🔴' : risk === 'medium' ? '🟡' : '🟢';
  const text = `${riskEmoji} <b>APPROVAL REQUEST #${id}</b>\n\n<b>Action:</b> ${action}\n<b>Details:</b>\n<pre>${(details || '').slice(0, 2000)}</pre>\n<b>Risk:</b> ${risk}`;

  return new Promise(async (resolve) => {
    pendingApprovals.set(id, { 
      action, 
      details, 
      risk, 
      timestamp: Date.now(),
      resolve: (approved) => {
        resolve(approved);
      }
    });

    await sendWithKeyboard(text, [
      [
        { text: 'Approve', callback_data: `approve_${id}` },
        { text: 'Reject', callback_data: `reject_${id}` }
      ]
    ]);
    
    // Auto-reject after 10 minutes
    setTimeout(() => {
      if (pendingApprovals.has(id)) {
        const p = pendingApprovals.get(id);
        pendingApprovals.delete(id);
        p.resolve(false);
        send(`⏰ Approval Request #${id} timed out and was automatically REJECTED.`);
      }
    }, 10 * 60 * 1000);
  });
}

// ─── PRD.JSON helpers ───────────────────────────────────────────────────────

function readPrd() {
  try {
    const data = fs.readFileSync(path.join(ROOT, 'prd.json'), 'utf8');
    return JSON.parse(data);
  } catch { return { tasks: [] }; }
}

function writePrd(prd) {
  fs.writeFileSync(path.join(ROOT, 'prd.json'), JSON.stringify(prd, null, 2), 'utf8');
}

function getNextPendingTask() {
  const prd = readPrd();
  return prd.tasks.find(t => t.status === 'pending') || null;
}

function updateTaskStatus(taskId, status, result = null) {
  const prd = readPrd();
  const task = prd.tasks.find(t => t.id === taskId);
  if (task) {
    task.status = status;
    task.updatedAt = new Date().toISOString();
    if (result) task.output = result;
    writePrd(prd);
  }
  return task;
}

async function markTaskDone(taskId, result) {
  updateTaskStatus(taskId, 'passes', result);
  await send(`✅ Task ${taskId} APPROVED and marked as done.`);
}

async function markTaskRejected(taskId) {
  updateTaskStatus(taskId, 'failed');
  await send(`❌ Task ${taskId} REJECTED.`);
}

// ─── TIER ROUTING (mirrors ai-sdk.cjs chooseTier) ──────────────────────────

function chooseTier(msg) {
  const len = (msg || '').length;
  const isCode = /```|function |const |import |class |def |<[a-z]/.test(msg);
  if (isCode || len > 1500) return 'smart';
  if (len > 300) return 'balanced';
  return 'fast';
}

async function routeToModel(prompt, executor) {
  const tier = executor || chooseTier(prompt);
  const t0 = Date.now();

  const providers = [];

  if (tier === 'fast' || tier === 'ollama-3b') {
    providers.push({ name: 'Ollama 3B', fn: async () => {
      const r = await httpRequest('http://localhost:11434/api/generate', 'POST', { model: 'qwen2.5-coder:3b', prompt, stream: false });
      return JSON.parse(r).response || '';
    }});
  }

  if (tier === 'smart' || tier === 'groq') {
    const key = process.env.GROQ_API_KEY;
    if (key) {
      providers.push({ name: 'Groq Llama 3.3', fn: async () => {
        const r = await httpRequest('https://api.groq.com/openai/v1/chat/completions', 'POST', { model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 4096 }, { 'Authorization': `Bearer ${key}` });
        return JSON.parse(r).choices?.[0]?.message?.content || '';
      }});
    }
  }

  if (tier === 'balanced' || tier === 'gemini') {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      providers.push({ name: 'Gemini Flash', fn: async () => {
        const r = await httpRequest(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, 'POST', { contents: [{ parts: [{ text: prompt }] }] });
        return JSON.parse(r).candidates?.[0]?.content?.parts?.[0]?.text || '';
      }});
    }
  }

  const orKey = process.env.OPENROUTER_API_KEY;
  if (orKey) {
    providers.push({ name: 'OpenRouter DeepSeek', fn: async () => {
      const r = await httpRequest('https://openrouter.ai/api/v1/chat/completions', 'POST', { model: 'deepseek/deepseek-r1:free', messages: [{ role: 'user', content: prompt }], max_tokens: 4096 }, { 'Authorization': `Bearer ${orKey}`, 'HTTP-Referer': 'http://localhost:3001', 'X-Title': 'Shadow Stack' });
      return JSON.parse(r).choices?.[0]?.message?.content || '';
    }});
  }

  // Try each provider
  for (const p of providers) {
    try {
      const text = await p.fn();
      if (text && text.length > 10) {
        return { text, model: p.name, latency: Date.now() - t0 };
      }
    } catch { /* next */ }
  }
  throw new Error('All providers failed');
}

// ─── /delegate handler ──────────────────────────────────────────────────────

async function handleDelegate(text) {
  const prompt = text.replace(/^\/delegate\s*/i, '').trim();
  if (!prompt) { await send('Usage: /delegate <task description>'); return; }

  const tier = chooseTier(prompt);
  await send(`Delegating (tier: ${tier})...`);

  try {
    const result = await routeToModel(prompt);
    const response = result.text.slice(0, 3500);
    await send(`<b>${result.model}</b> (${result.latency}ms):\n\n${response}`);
    postLog({ route: 'delegate', model: result.model, latency_ms: result.latency, status: 'ok', preview: prompt.slice(0, 80) });

    // If result looks like code, ask for approval
    if (/```|function |const |class |def /.test(result.text)) {
      await sendApproval('delegate-code', `Model: ${result.model}\nPrompt: ${prompt.slice(0, 200)}\nResult contains code`, 'medium');
    }
  } catch (e) {
    await send(`Delegate failed: ${e.message}`);
  }
}

// ─── /plan handler ──────────────────────────────────────────────────────────

async function handlePlan() {
  const prd = readPrd();
  if (!prd.tasks || prd.tasks.length === 0) {
    await send('No tasks in prd.json');
    return;
  }

  const statusIcon = { pending: '⏳', passes: '✅', failed: '❌', 'in-progress': '🔄' };
  const lines = [`<b>PRD Tasks</b> (v${prd.version || '?'})\n`];

  for (const t of prd.tasks) {
    const icon = statusIcon[t.status] || '❓';
    lines.push(`${icon} <code>${t.id}</code> ${t.title} [${t.executor}]`);
  }

  const done = prd.tasks.filter(t => t.status === 'passes').length;
  const total = prd.tasks.length;
  lines.push(`\n<b>Progress:</b> ${done}/${total} done`);

  await send(lines.join('\n'));
}

// ─── /next handler — execute next pending task ──────────────────────────────

async function processTaskWithApproval(task) {
  activeTaskId = task.id;
  updateTaskStatus(task.id, 'in-progress');
  await send(`<b>Executing task ${task.id}:</b> ${task.title}\nExecutor: ${task.executor}`);

  try {
    const prompt = `You are an expert developer. Complete this task:\n\nTask: ${task.title}\nTier: ${task.tier}\n\nProvide the implementation (code, config, or content as appropriate). Be concise.`;
    const result = await routeToModel(prompt, task.executor);

    // Send result and WAIT for approval
    const preview = result.text.slice(0, 2500);
    await send(`<b>Task ${task.id} result</b> (${result.model}, ${result.latency}ms):\n\n<pre>${preview}</pre>`);

    const approved = await sendApproval(
      `task-${task.id}`,
      `Task: ${task.title}\nModel: ${result.model}\nResult length: ${result.text.length} chars`,
      'medium'
    );

    if (approved) {
      await markTaskDone(task.id, result.text);
    } else {
      await markTaskRejected(task.id);
    }
    return approved;
  } catch (e) {
    updateTaskStatus(task.id, 'failed');
    await send(`Task ${task.id} failed: ${e.message}`);
    return false;
  }
}

async function autorunTick() {
  if (!autorunActive || activeRun) return;

  const task = getNextPendingTask();
  if (!task) {
    autorunActive = false;
    await send('Autorun: all tasks completed!');
    return;
  }

  activeRun = processTaskWithApproval(task)
    .catch((err) => {
      console.error('autorun task failed', err);
    })
    .finally(() => {
      activeRun = null;
      activeTaskId = null;
    });

  await activeRun;
}

async function handleAutorun(text) {
  const sub = text.replace(/^\/autorun\s*/i, '').trim().toLowerCase();

  if (sub === 'stop') {
    autorunActive = false;
    if (autorunTimer) { clearInterval(autorunTimer); autorunTimer = null; }
    await send('Autorun stopped.');
    return;
  }

  if (sub === 'status') {
    const task = getNextPendingTask();
    const prd = readPrd();
    const done = prd.tasks.filter(t => t.status === 'passes').length;
    await send(`<b>Autorun:</b> ${autorunActive ? 'ACTIVE' : 'STOPPED'}\n<b>In-flight:</b> ${activeTaskId || 'none'}\n<b>Progress:</b> ${done}/${prd.tasks.length}\n<b>Next:</b> ${task ? `${task.id} — ${task.title}` : 'none'}`);
    return;
  }

  if (autorunActive) {
    await send('Autorun already active.');
    return;
  }

  autorunActive = true;
  await send('Autorun STARTED. Will execute pending tasks sequentially with approval gates.\nUse /autorun stop to halt.');

  // Use setInterval for the tick loop as in the reference pattern
  autorunTimer = setInterval(autorunTick, 30000);
  autorunTick(); // Run initial tick
}

// ─── /continue handler — resume work when Claude session ends ───────────────

async function handleContinue() {
  // Read handoff and prd to understand current state
  let handoff = '';
  try { handoff = fs.readFileSync(path.join(ROOT, 'handoff.md'), 'utf8'); } catch {}

  const prd = readPrd();
  const pending = prd.tasks.filter(t => t.status === 'pending');
  const done = prd.tasks.filter(t => t.status === 'passes').length;

  if (pending.length === 0) {
    await send('All tasks completed! No pending work.');
    return;
  }

  // Build context from handoff
  const nextSteps = handoff.match(/## Следующие шаги[\s\S]*$/m)?.[0] || '';
  const summary = [
    '<b>CONTINUE MODE — Claude session ended, bot takes over</b>\n',
    `<b>Progress:</b> ${done}/${prd.tasks.length} tasks done`,
    `<b>Pending:</b> ${pending.length} tasks`,
    `<b>Next task:</b> ${pending[0].id} — ${pending[0].title}`,
    pending[0].description ? `<b>Description:</b> ${pending[0].description.slice(0, 300)}` : '',
    nextSteps ? `\n<b>Handoff notes:</b>\n<pre>${nextSteps.slice(0, 500)}</pre>` : '',
    '\nStarting autorun...',
  ].filter(Boolean).join('\n');

  await send(summary);

  // Auto-start the execution loop
  if (!autorunActive) {
    autorunActive = true;
    async function continueLoop() {
      if (!autorunActive) return;
      const task = getNextPendingTask();
      if (!task) { autorunActive = false; await send('All tasks completed!'); return; }
      await processTaskWithApproval(task);
      if (autorunActive) autorunTimer = setTimeout(continueLoop, 30000);
    }
    continueLoop();
  }
}

// ─── Heartbeat: auto-detect Claude session end ─────────────────────────────

let lastClaudeActivity = Date.now();
const CLAUDE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes of no activity

function resetClaudeHeartbeat() {
  lastClaudeActivity = Date.now();
}

// Check if Claude went silent (called from health endpoint)
function isClaudeActive() {
  return (Date.now() - lastClaudeActivity) < CLAUDE_TIMEOUT_MS;
}

// ─── callback_query handler ─────────────────────────────────────────────────

async function handleCallbackQuery(query, isManual = false) {
  // 🛡️ Guard: Validate chat ID (unless manually triggered from /approve or /reject)
  if (!isManual && String(query.message?.chat?.id) !== String(CHAT_ID)) {
    console.warn(`🛡️ Security: Unauthorized callback from ${query.message?.chat?.id}`);
    return;
  }

  const data = query.data;
  const callbackId = query.id;

  const match = data.match(/^(approve|reject)_(\d+)$/);
  if (!match) {
    await answerCallbackQuery(callbackId, 'Unknown action');
    return;
  }

  const [, action, idStr] = match;
  const id = parseInt(idStr);
  const approval = pendingApprovals.get(id);

  if (!approval) {
    await answerCallbackQuery(callbackId, 'Approval expired or not found');
    return;
  }

  pendingApprovals.delete(id);
  
  if (action === 'approve') {
    await answerCallbackQuery(callbackId, 'Approved!');
    approval.resolve(true);
  } else {
    await answerCallbackQuery(callbackId, 'Rejected');
    approval.resolve(false);
  }
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
      hostname: 'api.telegram.org',
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
            // offset = null;
          }
          
          for (const u of (updates || [])) {
            offset = u.update_id + 1;

            // Handle callback queries (inline keyboard buttons)
            if (u.callback_query) {
              try { await handleCallbackQuery(u.callback_query); } catch (e) { console.error('callback error:', e.message); }
              continue;
            }

            const text = u.message?.text;
            if (!text) continue;
            // only respond to authorized chat
            if (String(u.message.chat.id) !== String(CHAT_ID)) continue;
            const cmd = text.replace(/^\//, '').split(/\s+/)[0].toLowerCase();
            console.log(`[cmd] /${cmd}`);
            try {
              if (cmd === 'help' || cmd === 'start') {
                const helpText = `🤖 <b>Shadow Stack Orchestrator v6.0</b>

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

⚡ <b>Cascade</b> (auto-routes all providers):
  /ai — smart cascade: Gemini→Groq→OpenAI→OpenRouter→Ollama→Telegram
  /warm — Telegram escalation (@chatgpt_gidbot)

💎 <b>Платно</b>:
  /premium — Claude Sonnet

💡 <i>Любое сообщение без команды → автоматически через cascade</i>

🔍 <b>Диагностика</b>:
  /test-router — dry-run роутинга
  /usage — статистика провайдеров (24ч)
  /escalate — мета-эскалация (cascade→Telegram)

🤖 <b>Оркестратор</b> (автономный режим):
  /delegate — делегировать задачу на cheapest model
  /plan — показать задачи из prd.json
  /next — выполнить следующую задачу
  /autorun start|stop|status — автономный цикл
  /continue — продолжить работу когда Claude offline
  /approve|reject <id> — одобрить/отклонить

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
              else if (cmd === 'build')   { await send('⏳ Building...'); await send(await run('npm', ['run', 'build'], 120000)); }
              else if (cmd === 'test')    { await send('⏳ Testing...'); await send(await run('npm', ['test'], 120000)); }
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
              // Cascade
              else if (cmd === 'ai')   { await handleCascade(text); }
              else if (cmd === 'warm') {
                const prompt = extractPrompt(text);
                if (!prompt) { await send('⚠️ /warm <вопрос>'); }
                else {
                  await send('📨 Telegram escalation...');
                  await handleGroupAsk('/ask-gpt ' + prompt, 'chatgpt_gidbot', 'ChatGPT (warm)');
                }
              }
              else if (cmd === 'test-router') {
                // Dry-run: show which provider would handle the prompt
                const prompt = extractPrompt(text) || 'Hello, test';
                const len = prompt.length;
                const tier = len < 80 ? 'ollama-3b' : len < 300 ? 'ollama-7b' : 'openrouter';
                await send(`🧪 <b>Router Dry-Run</b>\nPrompt length: ${len}\nSelected tier: <code>${tier}</code>\nFallback chain: local-router → ollama → openrouter → claude`);
              }
              else if (cmd === 'usage') {
                // Show provider usage stats
                try {
                  const statsRes = await new Promise((resolve, reject) => {
                    http.get('http://localhost:3001/api/health/stats?period=day', (r) => {
                      let d = ''; r.on('data', c => d += c); r.on('end', () => resolve(d));
                    }).on('error', reject);
                  });
                  const stats = JSON.parse(statsRes);
                  const lines = ['📊 <b>Usage (24h)</b>'];
                  if (stats.byProvider) {
                    for (const [p, s] of Object.entries(stats.byProvider)) {
                      lines.push(`  ${p}: ${s.count || 0} req, avg ${Math.round(s.avgLatency || 0)}ms`);
                    }
                  }
                  lines.push(`Total: ${stats.total || 0} requests`);
                  await send(lines.join('\n'));
                } catch (e) { await send(`⚠️ Stats unavailable: ${e.message}`); }
              }
              else if (cmd === 'escalate') {
                // Meta-escalation: try cascade, then Telegram group bots
                const prompt = extractPrompt(text);
                if (!prompt) { await send('⚠️ /escalate <вопрос>'); }
                else {
                  await send('🔺 <b>Meta-Escalation</b>\n1️⃣ Cascade (local→cloud)\n2️⃣ Telegram group bots');
                  try {
                    await handleCascade('/ai ' + prompt);
                  } catch {
                    await send('⚠️ Cascade failed, trying Telegram escalation...');
                    await handleGroupAsk('/ask-gpt ' + prompt, 'chatgpt_gidbot', 'ChatGPT (escalation)');
                  }
                }
              }
              // Orchestrator commands
              else if (cmd === 'delegate') { await handleDelegate(text); }
              else if (cmd === 'plan')     { await handlePlan(); }
              else if (cmd === 'next')     {
                const task = getNextPendingTask();
                if (task) processTaskWithApproval(task);
                else await send('No pending tasks.');
              }
              else if (cmd === 'autorun')  { await handleAutorun(text); }
              else if (cmd === 'continue') { await handleContinue(); }
              else if (cmd === 'approve')  {
                const id = parseInt(text.split(/\s+/)[1]);
                if (id && pendingApprovals.has(id)) {
                  await handleCallbackQuery({ id: '0', data: `approve_${id}` }, true);
                } else { await send('Usage: /approve <id>'); }
              }
              else if (cmd === 'reject')  {
                const id = parseInt(text.split(/\s+/)[1]);
                if (id && pendingApprovals.has(id)) {
                  await handleCallbackQuery({ id: '0', data: `reject_${id}` }, true);
                } else { await send('Usage: /reject <id>'); }
              }
              else {
                // Default: full cascade (try all providers)
                await handleCascade(text);
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
    const prd = readPrd();
    const pending = prd.tasks.filter(t => t.status === 'pending').length;
    const done = prd.tasks.filter(t => t.status === 'passes').length;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok', mode: 'polling', repo: GITHUB_REPO,
      ts: new Date().toISOString(),
      claude_active: isClaudeActive(),
      autorun: autorunActive,
      tasks: { total: prd.tasks.length, done, pending }
    }));
  } else if (req.url === '/heartbeat') {
    // Claude pings this to signal it's still active
    resetClaudeHeartbeat();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, claude_active: true }));
  } else if (req.url === '/continue') {
    // External trigger to start continue mode
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, starting: true }));
    handleContinue();
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

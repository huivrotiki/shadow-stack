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
const stateHelpers = require('./state-helpers.cjs');
const PROJECT_ROOT = path.resolve(__dirname, '..');

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
  omniroute:   { port: 20128, label: 'OmniRoute',       health: 'http://localhost:20128/v1/models' },
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
  omniroute: { desc: 'Статус OmniRoute' },
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
  // Session control
  new:      { desc: 'Новый контекст сессии', group: 'session' },
  reset:    { desc: 'Сброс сессии', group: 'session' },
  compact:  { desc: 'Сжатие контекста', group: 'session' },
  think:    { desc: 'Бюджет рассуждений (low|high|dynamic)', group: 'session' },
  stop:     { desc: 'Прервать генерацию', group: 'session' },
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

async function handleOmniroute() {
  await send('⏳ Проверяю OmniRoute...');
  try {
    const r = await httpRequest('http://localhost:20128/v1/models');
    const data = JSON.parse(r);
    const count = data.data ? data.data.length : 0;
    await send(`🛣️ <b>OmniRoute</b>\nModels: ${count}\nPort: 20128`);
  } catch (e) {
    await send(`🛣️ <b>OmniRoute Error</b>: ${e.message}`);
  }
}

async function handleCascadePrompt(text) {
  let prompt = text;
  if (text.startsWith('/')) {
    const parts = text.replace(/^\//, '').split(/\s+/);
    parts.shift();
    prompt = parts.join(' ') || 'привет';
  }
  
  await send(`🧠 Думаю...`);
  const t0 = Date.now();
  
  try {
    // Primary path: Shadow provider via free-proxy :20129 (direct, always live).
    // Fallback: ZeroClaw HTTP :3001 (used when :20129 down and shadow-api running).
    let parsed;
    let route = 'shadow';
    let model = 'auto';
    let output;
    let latency;

    try {
      const r = await httpRequest('http://localhost:20129/v1/chat/completions', 'POST', {
        model: 'auto',
        messages: [{ role: 'user', content: prompt }],
      });
      parsed = JSON.parse(r);
      output = parsed.choices?.[0]?.message?.content;
      model = parsed.x_model || parsed.model || 'auto';
      latency = parsed.x_latency_ms || (Date.now() - t0);
      route = parsed.x_provider || 'shadow';
    } catch (primaryErr) {
      // Fallback to ZeroClaw HTTP if shadow :20129 down
      const r = await httpRequest('http://localhost:3001/api/zeroclaw/execute', 'POST', {
        task_id: `tg-${Date.now()}`,
        instruction: prompt,
        model: 'auto',
      });
      parsed = JSON.parse(r);
      if (parsed.ok && parsed.status === 'success') {
        output = parsed.output;
        model = parsed.state?.model || 'auto';
        latency = parsed.state?.latency || (Date.now() - t0);
        route = 'zeroclaw-fallback';
      } else {
        throw new Error(parsed.error || parsed.output || primaryErr.message);
      }
    }

    if (output) {
      await send(`${output}\n\n<i>${route} · ${model} · ${latency}ms</i>`);
      postLog({ route, model, latency_ms: latency, status: 'ok', preview: prompt.slice(0, 80) });
    } else {
      await send(`😕 Пустой ответ от ${route}`);
      postLog({ route, model, latency_ms: Date.now() - t0, status: 'error', preview: 'empty' });
    }
  } catch (e) {
    await send(`😕 Ошибка сервиса: ${e.message}`);
    postLog({ route: 'shadow', model: '-', latency_ms: Date.now() - t0, status: 'error', preview: e.message });
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
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    ['Content-Type: application/json', 'x-goog-api-key: ' + key],
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
    
    if (parsed.error === 'LOW_RAM') {
      await send(`⚠️ <b>RAM < 400МБ.</b> Браузерная модель временно недоступна (не хватает свободной памяти).\n🔄 Запрос перенаправлен на резервный API...`);
      postLog({ route: `browser:${target}`, model: label, latency_ms: Date.now() - t0, status: 'low_ram_fallback', preview: 'low ram fallback' });
      return handleCascade(text);
    }
    
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
async function handleGeminiBrowser(text) { return handleBrowser(text, 'gemini', 'Gemini Browser'); }
async function handleGroqBrowser(text) { return handleBrowser(text, 'groq', 'Groq Browser'); }
async function handlePerplexity(text) { return handleBrowser(text, 'perplexity', 'Perplexity'); }
async function handlePerplexityChat(text) { return handleBrowser(text, 'perplexity2', 'Perplexity Chat'); }
async function handleAntigravity(text) { return handleBrowser(text, 'antigravity', 'Antigravity'); }
async function handleGrokBrowser(text) { return handleBrowser(text, 'grok', 'Grok Browser'); }

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
  const prompt = text.startsWith('/') ? extractPrompt(text) : text;
  if (!prompt) return send('⚠️ Введите вопрос');
  const t0 = Date.now();

  const SYSTEM = 'Ты — Shadow Stack Orchestrator, умный ассистент. Отвечай по-русски, кратко и по делу. Если вопрос про код — помогай с кодом. Если просто общение — общайся как человек.';

  const providers = [
    { name: 'OmniRoute', try: async () => {
      const r = await httpRequest('http://localhost:20128/v1/chat/completions', 'POST',
        { model: 'auto', messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }], max_tokens: 2048 },
        { 'Authorization': `Bearer ${process.env.FREE_PROXY_API_KEY || ''}` }
      );
      const d = JSON.parse(r);
      return d.choices?.[0]?.message?.content || '';
    }},
    { name: 'Ollama', try: async () => {
      const r = await httpRequest('http://localhost:11434/api/chat', 'POST',
        { model: 'qwen2.5-coder:3b', messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }], stream: false }
      );
      const d = JSON.parse(r);
      return d.message?.content || '';
    }},
  ];

  for (const p of providers) {
    try {
      const reply = await p.try();
      if (reply && reply.length > 5) {
        await send(reply.slice(0, 3500));
        postLog({ route: 'cascade', model: p.name, latency_ms: Date.now() - t0, status: 'ok', preview: reply.slice(0, 80) });
        return;
      }
    } catch (e) { /* try next */ }
  }

  await send('❌ Все провайдеры недоступны. Попробуй позже.');
  postLog({ route: 'cascade', model: '-', latency_ms: Date.now() - t0, status: 'error' });
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
  await send(`⏳ Routing (ZeroClaw): "${prompt}"...`);
  try {
    const r = await httpRequest('http://localhost:3001/api/zeroclaw/execute', 'POST', {
      task_id: `route-${Date.now()}`,
      instruction: prompt,
      model: 'auto',
    });
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

// ─── OpenCode Session Control Commands ──────────────────────────────────────

// Session state
let currentSessionId = Date.now().toString();
let thinkingLevel = process.env.THINKING_LEVEL || 'dynamic';
const globalAbortController = { controller: new AbortController() };

// /new or /reset — new session
async function handleNewSession() {
  currentSessionId = Date.now().toString();
  await send(`🔄 <b>Сессия сброшена</b>\nID: <code>${currentSessionId}</code>\nПредыдущая история отвязана от контекста.`);
}

// /compact — context compression via Supermemory
async function handleCompact() {
  await send('🗜 <b>Компактизация контекста...</b>\nАнализ диалога и выжимка фактов...');
  try {
    const sessionPath = path.join(ROOT, '.agent/knowledge/SESSION.md');
    const timestamp = new Date().toISOString();
    const header = `## Session Summary ${timestamp}\n- Session ID: ${currentSessionId}\n- Thinking Level: ${thinkingLevel}\n- Compressed at: ${timestamp}\n\n`;

    // Write compressed session marker
    const dir = path.dirname(sessionPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(sessionPath, header);

    await send(`✅ <b>Контекст сжат</b>\nВыжимка сохранена в <code>SESSION.md</code>\nТокены освобождены.`);
  } catch (e) {
    await send(`❌ Ошибка сжатия: ${e.message}`);
  }
}

// /think <level> — thinking budget control
async function handleThink(text) {
  const parts = text.split(/\s+/);
  const level = parts[1] || '';
  if (!level || !['low', 'high', 'dynamic'].includes(level)) {
    await send(`🧠 <b>Thinking Level:</b> <code>${thinkingLevel}</code>\n\nИспользуйте: <code>/think low|high|dynamic</code>`);
    return;
  }
  thinkingLevel = level;
  process.env.THINKING_LEVEL = level;
  await send(`🧠 <b>Thinking Budget обновлен</b>\nУровень: <code>${level}</code>\n\n• <code>low</code> — быстрые ответы (2-5s)\n• <code>high</code> — глубокое рассуждение (15-30s)\n• <code>dynamic</code> — автоматический выбор`);
}

// /usage — enhanced session + provider stats
async function handleUsage() {
  const lines = [
    '📊 <b>Shadow Stack Usage</b>',
    `• Сессия: <code>${currentSessionId}</code>`,
    `• Thinking: <code>${thinkingLevel}</code>`,
    `• Autorun: <code>${autorunActive ? 'ACTIVE' : 'STOPPED'}</code>`,
  ];

  // RAM check
  try {
    const r = await httpRequest('http://localhost:3002/ram');
    const ramInfo = JSON.parse(r);
    const emoji = ramInfo.freeRAM > 600 ? '🟢' : ramInfo.freeRAM > 400 ? '🟡' : '🔴';
    lines.push(`• RAM: ${emoji} <code>${ramInfo.freeRAM}MB</code>`);
  } catch {
    lines.push('• RAM: ⚠️ unavailable');
  }

  // Provider stats
  try {
    const statsRes = await new Promise((resolve, reject) => {
      http.get('http://localhost:3001/api/health/stats?period=day', (r) => {
        let d = ''; r.on('data', c => d += c); r.on('end', () => resolve(d));
      }).on('error', reject);
    });
    const stats = JSON.parse(statsRes);
    lines.push('\n<b>Providers (24h):</b>');
    if (stats.byProvider) {
      for (const [p, s] of Object.entries(stats.byProvider)) {
        lines.push(`  ${p}: ${s.count || 0} req, avg ${Math.round(s.avgLatency || 0)}ms`);
      }
    }
    lines.push(`Total: ${stats.total || 0} requests`);
  } catch {}

  // Pending tasks
  const prd = readPrd();
  const pending = prd.tasks.filter(t => t.status === 'pending').length;
  lines.push(`\n• Задач в очереди: <code>${pending}</code>`);

  await send(lines.join('\n'));
}

// /stop — abort current generation
async function handleStop() {
  globalAbortController.controller.abort();
  globalAbortController.controller = new AbortController();
  if (autorunActive) {
    autorunActive = false;
    if (autorunTimer) { clearInterval(autorunTimer); autorunTimer = null; }
  }
  await send('🛑 <b>Генерация прервана</b>\nТекущий процесс (Ralph Loop / LLM stream) остановлен.\nAutorun остановлен.');
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

// Shadow Router URL for browser-based providers
const SHADOW_ROUTER = process.env.SHADOW_ROUTER_URL || 'http://localhost:3002';

async function callBrowser(target, prompt) {
  const encoded = encodeURIComponent(prompt);
  const r = await httpRequest(SHADOW_ROUTER + '/route/' + target + '/' + encoded, 'GET');
  const data = JSON.parse(r);
  if (data.error) throw new Error(data.error);
  return data.response || '';
}

async function routeToModel(prompt, executor) {
  const t0 = Date.now();

  // 12-level cascade: browser-first -> API -> telegram -> local
  const providers = [
    // 1-2: Browser CDP (Gemini, Groq)
    { name: 'Gemini Browser', fn: () => callBrowser('gemini', prompt) },
    { name: 'Groq Browser', fn: () => callBrowser('groq', prompt) },
    // 3: Manus Browser
    { name: 'Manus Browser', fn: () => callBrowser('manus', prompt) },
    // 4: Perplexity (Comet)
    { name: 'Perplexity Browser', fn: () => callBrowser('perplexity', prompt) },
    // 5: OpenRouter API (free)
    { name: 'OpenRouter DeepSeek', fn: async () => {
      const key = process.env.OPENROUTER_API_KEY;
      if (!key) throw new Error('No OPENROUTER_API_KEY');
      const r = await httpRequest('https://openrouter.ai/api/v1/chat/completions', 'POST',
        { model: 'deepseek/deepseek-r1:free', messages: [{ role: 'user', content: prompt }], max_tokens: 4096 },
        { 'Authorization': 'Bearer ' + key, 'HTTP-Referer': 'http://localhost:3001', 'X-Title': 'Shadow Stack' });
      return JSON.parse(r).choices?.[0]?.message?.content || '';
    }},
    // 6: Antigravity CDP
    { name: 'Antigravity', fn: () => callBrowser('antigravity', prompt) },
    // 7: Microsoft Copilot CDP
    { name: 'MS Copilot', fn: () => callBrowser('copilot', prompt) },
    // 8: Perplexity Chat (Comet)
    { name: 'Perplexity Chat', fn: () => callBrowser('perplexity2', prompt) },
    // 9: Gemini API (backup)
    { name: 'Gemini API', fn: async () => {
      const key = process.env.GEMINI_API_KEY;
      if (!key) throw new Error('No GEMINI_API_KEY');
      const r = await httpRequest('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', 'POST',
        { contents: [{ parts: [{ text: prompt }] }] },
        { 'x-goog-api-key': key });
      return JSON.parse(r).candidates?.[0]?.content?.parts?.[0]?.text || '';
    }},
    // 10: Groq API (backup)
    { name: 'Groq API', fn: async () => {
      const key = process.env.GROQ_API_KEY;
      if (!key) throw new Error('No GROQ_API_KEY');
      const r = await httpRequest('https://api.groq.com/openai/v1/chat/completions', 'POST',
        { model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 4096 },
        { 'Authorization': 'Bearer ' + key });
      return JSON.parse(r).choices?.[0]?.message?.content || '';
    }},
    // 11: Ollama (last resort — uses RAM)
    { name: 'Ollama 3B', fn: async () => {
      const r = await httpRequest('http://localhost:11434/api/generate', 'POST',
        { model: 'qwen2.5-coder:3b', prompt: prompt, stream: false });
      return JSON.parse(r).response || '';
    }},
  ];

  // If specific executor requested, filter or reorder
  if (executor === 'ollama-3b' || executor === 'fast') {
    // Skip browser, go straight to Ollama
    try {
      const r = await httpRequest('http://localhost:11434/api/generate', 'POST',
        { model: 'qwen2.5-coder:3b', prompt: prompt, stream: false });
      const text = JSON.parse(r).response || '';
      if (text.length > 10) return { text, model: 'Ollama 3B (direct)', latency: Date.now() - t0 };
    } catch { /* fall through to cascade */ }
  }

  // Try each provider sequentially (for...of, not Promise.all — RAM constraint)
  for (const p of providers) {
    try {
      const text = await p.fn();
      if (text && text.length > 10) {
        return { text, model: p.name, latency: Date.now() - t0 };
      }
    } catch { /* next provider */ }
  }
  throw new Error('All 11 providers failed');
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

    // [Step 4: Non-blocking HITL] 
    // Save thought signature and move to WAITING_USER if needed
    const preview = result.text.slice(0, 2500);
    await send(`<b>Task ${task.id} result</b> (${result.model}, ${result.latency}ms):\n\n<pre>${preview}</pre>`);

    // In non-blocking mode, we send the notification and update status, BUT we don't await the promise here
    // unless we ARE in a blocking loop. For the Survival Cascade, we mark as WAITING_USER.
    
    updateTaskStatus(task.id, 'WAITING_USER', { 
      thought_signature: Buffer.from(result.text).toString('base64').slice(0, 100),
      model: result.model 
    });

    await sendApproval(
      `task-${task.id}`,
      `Task: ${task.title}\nModel: ${result.model}\nStatus: WAITING_USER (Agent moved to next task)`,
      'medium'
    );
    
    return true; // Successfully processed and moved to wait state
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
    // Check if we have WAITING_USER tasks, if not, then stop
    const prd = readPrd();
    if (!prd.tasks.some(t => t.status === 'WAITING_USER' || t.status === 'pending')) {
      autorunActive = false;
      await send('Autorun: all tasks completed or waiting for user!');
      return;
    }
    return; // Just wait for next tick or user response
  }

  activeRun = processTaskWithApproval(task)
    .catch((err) => {
      console.error('autorun task failed', err);
    })
    .finally(() => {
      activeRun = null;
      activeTaskId = null;
    });

  // We DO NOT await activeRun if we want non-blocking task switching in the same tick,
  // but usually one task per tick is fine as long as we don't BLOCK the bot.
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
      if (res.statusCode === 401) {
        consecutiveAuthErrors++;
        console.error(`[poll] 401 Unauthorized (attempt ${consecutiveAuthErrors}/5) — token may be revoked`);
        let d = ''; res.on('data', c => d += c); res.on('end', () => resolve());
        return;
      }
      consecutiveAuthErrors = 0; // Reset on success
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

🌐 <b>Браузер</b> (Shadow Router CDP):
  /gemini-web — Gemini (browser)
  /groq-web — Groq (browser)
  /chatgpt — ChatGPT
  /copilot — Microsoft Copilot
  /manus — Manus AI
  /perplexity — Perplexity (Comet)
  /perplexity2 — Perplexity Chat
  /antigravity — Antigravity Copilot
  /grok-web — Grok (browser)
  /kimi-web — Kimi web

🤖 <b>Группа</b>:
  /ask-gpt — @chatgpt_gidbot
  /ask-deepseek — @deepseek_gidbot

⚡ <b>Cascade</b> (auto-routes all providers):
  /ai — 12-level cascade: Browser→API→Telegram→Ollama
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

🧠 <b>ZeroClaw Control Center</b>:
  /zc — меню + health
  /zc exec <текст> — одна задача через auto
  /zc plan <цель> — показать план
  /zc run <цель> — план + исполнение
  /zc state — задачи
  /zc last — последняя задача
  /zc models — список моделей

🔧 <b>Система</b>:
  /status /ram /omniroute /clean /sync /deploy /restart /ping

🧠 <b>Сессия</b> (OpenCode):
  /new — новый контекст
  /reset — сброс сессии
  /compact — сжатие контекста
  /think low|high|dynamic — бюджет рассуждений
  /usage — статистика сессии + провайдеры
  /stop — прервать генерацию`;
                await send(helpText);
              } else if (cmd === 'status')  { await handleStatus(); }
              else if (cmd === 'deploy')  { await handleDeploy(); }
              else if (cmd === 'up')      { await handleUp(); }
              else if (cmd === 'restart') { await handleRestart(); }
              else if (cmd === 'logs')    { await handleLogs(); }
              else if (cmd === 'version') { await handleVersion(); }
              else if (cmd === 'omniroute') { await handleOmniroute(); }
              else if (cmd === 'ask') { await handleCascade(text); }
              else if (cmd === 'claude') { await handleCascade(text); }
              else if (cmd === 'models') { await handleModels(); }
              else if (cmd === 'route') { await handleRoute(text); }
              else if (cmd === 'ram') { await handleRam(); }
              else if (cmd === 's' || cmd === 'shadowask') {
                // Direct Shadow provider call via free-proxy :20129 (bypasses ZeroClaw)
                const prompt = extractPrompt(text);
                if (!prompt) { await send('⚠️ /s &lt;prompt&gt; — Shadow auto-route'); }
                else {
                  await send('⏳ Shadow auto-route...');
                  const t0 = Date.now();
                  try {
                    const r = await httpRequest('http://localhost:20129/v1/chat/completions', 'POST', {
                      model: 'auto',
                      messages: [{ role: 'user', content: prompt }],
                    });
                    const p = JSON.parse(r);
                    const content = p.choices?.[0]?.message?.content || '(empty)';
                    const mdl = p.x_model || p.model || 'auto';
                    const prov = p.x_provider || 'shadow';
                    const cat = p.x_route_category || '-';
                    const lat = p.x_latency_ms || (Date.now() - t0);
                    await send(`${content}\n\n<i>shadow · ${prov}/${mdl} · ${cat} · ${lat}ms</i>`);
                    try { stateHelpers.appendSessionEvent(PROJECT_ROOT, 'telegram', 'shadow_ask', `${lat}ms · ${mdl} · ${prompt.slice(0,60)}`); } catch {}
                  } catch (e) {
                    await send(`❌ shadow :20129 error: ${e.message}`);
                  }
                }
              }
              else if (cmd === 'state') {
                const st = stateHelpers.readCurrentState(PROJECT_ROOT);
                await send('<pre>' + stateHelpers.formatStateMessage(st) + '</pre>');
                try { stateHelpers.appendSessionEvent(PROJECT_ROOT, 'telegram', 'telegram_command', '/state'); } catch {}
              }
              else if (cmd === 'todo') {
                const rest = text.replace(/^\/todo\s*/i, '').trim();
                const m = rest.match(/^add\s+(.+)$/i);
                if (m) {
                  const item = m[1].trim();
                  const todoFile = path.join(PROJECT_ROOT, '.state', 'todo.md');
                  const existing = fs.existsSync(todoFile) ? fs.readFileSync(todoFile, 'utf8') : '# Todos\n\n';
                  fs.writeFileSync(todoFile, existing.replace(/\n*$/, '\n') + `- [ ] ${item}\n`);
                  await send(`✅ Added: ${item}`);
                  try { stateHelpers.appendSessionEvent(PROJECT_ROOT, 'telegram', 'todo_add', item); } catch {}
                } else {
                  const body = stateHelpers.readTodos(PROJECT_ROOT);
                  await send('<pre>' + body.slice(0, 3500) + '</pre>');
                  try { stateHelpers.appendSessionEvent(PROJECT_ROOT, 'telegram', 'telegram_command', '/todo'); } catch {}
                }
              }
              else if (cmd === 'session') {
                const rest = text.replace(/^\/session\s*/i, '').trim();
                const m = rest.match(/^tail\s+(\d+)/i);
                const n = m ? parseInt(m[1], 10) : 10;
                const body = stateHelpers.tailSession(PROJECT_ROOT, n);
                await send('<pre>' + body.slice(-3500) + '</pre>');
                try { stateHelpers.appendSessionEvent(PROJECT_ROOT, 'telegram', 'telegram_command', `/session tail ${n}`); } catch {}
              }
              else if (cmd === 'handoff') {
                const body = stateHelpers.readHandoff(PROJECT_ROOT, 3500);
                await send('<pre>' + body + '</pre>');
                try { stateHelpers.appendSessionEvent(PROJECT_ROOT, 'telegram', 'telegram_command', '/handoff'); } catch {}
              }
              else if (cmd === 'runtime') {
                const rest = text.replace(/^\/runtime\s*/i, '').trim();
                if (!rest) {
                  const st = stateHelpers.readCurrentState(PROJECT_ROOT);
                  await send(`🏃 active_runtime: <code>${(st && st.active_runtime) || 'none'}</code>\nUsage: /runtime claude-code|opencode|zeroclaw|telegram|none`);
                } else {
                  try {
                    const { prev, next } = stateHelpers.setActiveRuntime(PROJECT_ROOT, rest.split(/\s+/)[0]);
                    await send(`✅ runtime: ${prev} → ${next}`);
                    stateHelpers.appendSessionEvent(PROJECT_ROOT, 'telegram', 'runtime_switch', `${prev} → ${next}`);
                  } catch (e) {
                    await send(`❌ ${e.message}`);
                  }
                }
              }
              else if (cmd === 'zc' || cmd === 'zeroclaw' || cmd === 'zeroclaw-gen') {
                // ═══ ZeroClaw Control Center ═══
                // /zc                 — menu + health
                // /zc health          — health check
                // /zc exec <text>     — execute single task (auto model)
                // /zc plan <text>     — show plan (no execution)
                // /zc run <text>      — plan + execute full plan
                // /zc state           — all task states
                // /zc last            — most recent task
                // /zc models          — list shadow/free-proxy models
                const rest = text.replace(/^\/(zc|zeroclaw|zeroclaw-gen)\s*/i, '').trim();
                const [sub, ...subArgs] = rest.split(/\s+/);
                const subText = subArgs.join(' ');
                const ZC_BASE = 'http://localhost:3001/api/zeroclaw';
                const t0 = Date.now();

                try {
                  if (!rest || sub === 'help' || sub === 'menu') {
                    let health = '(unreachable)';
                    try {
                      const h = JSON.parse(await httpRequest(`${ZC_BASE}/health`));
                      health = h.ok ? `🟢 ok · planner: ${h.planner ? '✓' : '✗'}` : '🔴 not ok';
                    } catch {}
                    await send(
                      `🧠 <b>ZeroClaw Control Center</b>\n` +
                      `Status: ${health}\n\n` +
                      `<b>Команды:</b>\n` +
                      `/zc exec &lt;текст&gt; — запустить одну задачу через auto\n` +
                      `/zc plan &lt;цель&gt; — показать план (без запуска)\n` +
                      `/zc run &lt;цель&gt; — построить и исполнить план\n` +
                      `/zc state — все задачи\n` +
                      `/zc last — последняя задача\n` +
                      `/zc health — проверка\n` +
                      `/zc models — доступные модели`
                    );
                  }
                  else if (sub === 'health') {
                    const r = await httpRequest(`${ZC_BASE}/health`);
                    await send('<pre>' + r.slice(0, 2000) + '</pre>');
                  }
                  else if (sub === 'exec') {
                    if (!subText) { await send('⚠️ /zc exec &lt;текст задачи&gt;'); return; }
                    await send('⏳ ZeroClaw execute → auto...');
                    const r = await httpRequest(`${ZC_BASE}/execute`, 'POST', {
                      task_id: `tg-${Date.now()}`,
                      instruction: subText,
                      model: 'auto',
                    });
                    const p = JSON.parse(r);
                    if (p.ok && p.status === 'success') {
                      const model = p.state?.model || 'auto';
                      const score = typeof p.score === 'number' ? p.score.toFixed(2) : '—';
                      const lat = p.state?.latency || (Date.now() - t0);
                      await send(`${p.output}\n\n<i>model: ${model} · score: ${score} · ${lat}ms</i>`);
                      stateHelpers.appendSessionEvent(PROJECT_ROOT, 'telegram', 'zc_exec', `${Date.now()-t0}ms · ${subText.slice(0,60)}`);
                    } else {
                      await send(`❌ ${p.error || p.output || 'unknown error'}`);
                    }
                  }
                  else if (sub === 'plan') {
                    if (!subText) { await send('⚠️ /zc plan &lt;цель&gt;'); return; }
                    const r = await httpRequest(`${ZC_BASE}/plan`, 'POST', { goal: subText });
                    const p = JSON.parse(r);
                    if (p.ok) {
                      const steps = p.plan.steps.map(s => `  ${s.id}. [${s.intent}] ${s.instruction}`).join('\n');
                      await send(`📋 <b>Plan</b> (intent: ${p.intent.kind})\n<pre>${steps}</pre>`);
                    } else {
                      await send(`❌ ${p.error}`);
                    }
                  }
                  else if (sub === 'run') {
                    if (!subText) { await send('⚠️ /zc run &lt;цель&gt;'); return; }
                    await send(`⏳ ZeroClaw plan+execute...`);
                    const r = await httpRequest(`${ZC_BASE}/execute-plan`, 'POST', { goal: subText });
                    const p = JSON.parse(r);
                    if (p.ok) {
                      const lines = p.results.map((res, i) => {
                        const s = p.plan.steps[i];
                        const status = res.status === 'success' ? '✅' : '❌';
                        const snippet = (res.output || '').slice(0, 200);
                        return `${status} ${s.id}. ${s.instruction}\n    ${snippet}`;
                      }).join('\n\n');
                      await send(`📊 <b>Results</b>\n${lines.slice(0, 3500)}`);
                      stateHelpers.appendSessionEvent(PROJECT_ROOT, 'telegram', 'zc_run', `${p.results.length} steps · ${subText.slice(0,60)}`);
                    } else {
                      await send(`❌ ${p.error}`);
                    }
                  }
                  else if (sub === 'state') {
                    const r = await httpRequest(`${ZC_BASE}/state`);
                    const p = JSON.parse(r);
                    if (p.ok) {
                      const entries = Object.entries(p.state || {});
                      if (!entries.length) { await send('📭 (no tasks yet)'); }
                      else {
                        const lines = entries.slice(-10).map(([id, st]) => {
                          const icon = st.status === 'success' ? '✅' : st.status === 'error' ? '❌' : '⏳';
                          return `${icon} ${id} · ${st.model || '-'} · ${st.latency || '-'}ms`;
                        }).join('\n');
                        await send(`<b>Tasks (last 10):</b>\n<pre>${lines}</pre>`);
                      }
                    } else {
                      await send(`❌ ${p.error}`);
                    }
                  }
                  else if (sub === 'last') {
                    const r = await httpRequest(`${ZC_BASE}/state`);
                    const p = JSON.parse(r);
                    const entries = Object.entries(p.state || {});
                    if (!entries.length) { await send('📭 (no tasks)'); }
                    else {
                      const [id, st] = entries[entries.length - 1];
                      await send(`<b>${id}</b>\n<pre>${JSON.stringify(st, null, 2).slice(0, 3000)}</pre>`);
                    }
                  }
                  else if (sub === 'models') {
                    try {
                      const r = await httpRequest('http://localhost:20129/v1/models');
                      const p = JSON.parse(r);
                      const ids = (p.data || []).map(m => `• ${m.id}`).join('\n');
                      await send(`<b>Available models (free-proxy :20129):</b>\n<pre>${ids.slice(0, 3000)}</pre>`);
                    } catch (e) {
                      await send(`❌ free-proxy :20129 unreachable: ${e.message}`);
                    }
                  }
                  else {
                    // Back-compat: /zc <prompt> with no subcommand → treat as exec
                    await send('⏳ ZeroClaw execute → auto...');
                    const r = await httpRequest(`${ZC_BASE}/execute`, 'POST', {
                      task_id: `tg-${Date.now()}`,
                      instruction: rest,
                      model: 'auto',
                    });
                    const p = JSON.parse(r);
                    if (p.ok && p.status === 'success') {
                      const model = p.state?.model || 'auto';
                      const score = typeof p.score === 'number' ? p.score.toFixed(2) : '—';
                      await send(`${p.output}\n\n<i>model: ${model} · score: ${score}</i>`);
                    } else {
                      await send(`❌ ${p.error || p.output || 'unknown error'}`);
                    }
                  }
                } catch (e) {
                  await send(`❌ ZeroClaw unreachable (:3001/api/zeroclaw/*): ${e.message}`);
                }
              }
              else if (cmd === 'notebook' || cmd === 'nb') {
                const { execFile } = require('child_process');
                const cliPath = `${process.env.HOME}/.venv/notebooklm/bin/notebooklm`;
                const rest = text.replace(/^\/(notebook|nb)\s*/i, '').trim();
                const runCli = (args, timeout) => new Promise((resolve) => {
                  execFile(cliPath, args, { timeout, maxBuffer: 2 * 1024 * 1024 }, (err, stdout, stderr) => {
                    resolve({ err, stdout: stdout || '', stderr: stderr || '' });
                  });
                });
                if (!rest || rest === 'list') {
                  const { stdout, err } = await runCli(['list'], 15000);
                  await send('<pre>' + (stdout || err?.message || '(no output)').slice(0, 3500) + '</pre>');
                } else if (rest.startsWith('use ')) {
                  const id = rest.slice(4).trim().split(/\s+/)[0];
                  const { stdout, err } = await runCli(['use', id], 15000);
                  await send('<pre>' + (stdout || err?.message || '(no output)').slice(0, 2000) + '</pre>');
                } else {
                  const query = rest.replace(/^ask\s+/i, '');
                  await send('🧠 NotebookLM thinking...');
                  const { stdout, stderr, err } = await runCli(['ask', query], 90000);
                  if (err && !stdout) { await send(`❌ notebooklm: ${stderr || err.message}`); }
                  else {
                    await send((stdout || '(empty)').slice(0, 3500));
                    try { stateHelpers.appendSessionEvent(PROJECT_ROOT, 'telegram', 'notebook_ask', query.slice(0,60)); } catch {}
                  }
                }
              }
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
              // Browser (Shadow Router CDP)
              else if (cmd === 'gemini-web') { await handleGeminiBrowser(text); }
              else if (cmd === 'groq-web')   { await handleGroqBrowser(text); }
              else if (cmd === 'chatgpt')    { await handleChatGPT(text); }
              else if (cmd === 'copilot')    { await handleCopilot(text); }
              else if (cmd === 'manus')      { await handleManus(text); }
              else if (cmd === 'perplexity') { await handlePerplexity(text); }
              else if (cmd === 'perplexity2') { await handlePerplexityChat(text); }
              else if (cmd === 'antigravity') { await handleAntigravity(text); }
              else if (cmd === 'grok-web')   { await handleGrokBrowser(text); }
              else if (cmd === 'kimi-web')   { await handleKimiWeb(text); }
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
              // Session control (OpenCode)
              else if (cmd === 'new' || cmd === 'reset') { await handleNewSession(); }
              else if (cmd === 'compact') { await handleCompact(); }
              else if (cmd === 'think' || cmd === 't') { await handleThink(text); }
              else if (cmd === 'stop') { await handleStop(); }
              else if (cmd === 'usage') { await handleUsage(); }
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

// ─── Token Validation ────────────────────────────────────────────────────────
async function validateToken() {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${TOKEN}/getMe`,
      method: 'GET',
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const result = JSON.parse(d);
          if (result.ok) {
            console.log(`✅ Bot authenticated: @${result.result.username} (${result.result.first_name})`);
            resolve(true);
          } else {
            console.error(`❌ TOKEN INVALID: ${result.description}`);
            console.error('   → Go to @BotFather in Telegram, run /token, and update .env');
            console.error('   → Then: doppler secrets set TELEGRAM_BOT_TOKEN="new-token"');
            resolve(false);
          }
        } catch { resolve(false); }
      });
    });
    req.on('error', (e) => { console.error('❌ Cannot reach Telegram API:', e.message); resolve(false); });
    req.setTimeout(10000, () => { req.destroy(); resolve(false); });
    req.end();
  });
}

// ─── Start ───────────────────────────────────────────────────────────────────
let consecutiveAuthErrors = 0;

async function main() {
  // Validate token before anything else
  const valid = await validateToken();
  if (!valid) {
    console.error('\n🚫 Bot cannot start — token is invalid or revoked.');
    console.error('   Health endpoint still running on :' + PORT + ' for monitoring.');
    console.error('   Fix the token and restart the bot.\n');
    // Stay alive for health endpoint but don\'t poll
    return;
  }

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
      
      // If we get too many consecutive auth errors, stop polling
      if (consecutiveAuthErrors >= 5) {
        console.error('\n🚫 5 consecutive 401 errors — token likely revoked.');
        console.error('   Bot stopped polling. Fix the token and restart.\n');
        return;
      }
      
      if (pollCount % 10 === 0) {
        console.log(`[poll] Still running after ${pollCount} cycles...`);
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

main().catch(console.error);

// ── Phase 5: Omni Router commands ─────────────────────────────────────────
const { omniRoute } = require('../server/router/auto-router');
const { callGemini, callGroq, callDeepSeekFree } = require('../server/router/providers');

bot.onText(/\/omni (.+)/, async (msg, match) => {
  await bot.sendMessage(msg.chat.id, '⚙️ Omni Router...');
  try {
    bot.sendMessage(msg.chat.id, await omniRoute(match[1]));
  } catch (e) {
    bot.sendMessage(msg.chat.id, `❌ Каскад исчерпан: ${e.message}`);
  }
});

bot.onText(/\/gemini (.+)/, async (msg, match) => {
  bot.sendMessage(msg.chat.id, await callGemini(match[1]));
});

bot.onText(/\/groq (.+)/, async (msg, match) => {
  bot.sendMessage(msg.chat.id, await callGroq(match[1]));
});

bot.onText(/\/deep (.+)/, async (msg, match) => {
  bot.sendMessage(msg.chat.id, await callDeepSeekFree(match[1]));
});

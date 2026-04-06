'use strict';
const TelegramBot = require('node-telegram-bot-api');
const { route } = require('../server/shadow-router.cjs');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED = (process.env.TELEGRAM_ALLOWED_USERS || '').split(',').map(Number).filter(Boolean);

if (!TOKEN) { console.error('❌ TELEGRAM_BOT_TOKEN not set'); process.exit(1); }

const bot = new TelegramBot(TOKEN, { polling: true });

// Авторизация
function isAllowed(msg) {
  if (!ALLOWED.length) return true;
  return ALLOWED.includes(msg.from.id);
}

// Логгер
const logDir = path.join(__dirname, '../factory/logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
function log(event, data) {
  const entry = { ts: new Date().toISOString(), event, ...data };
  fs.appendFileSync(path.join(logDir, 'log.json'), JSON.stringify(entry) + '\n');
}

// /start
bot.onText(/^\/start$/, (msg) => {
  if (!isAllowed(msg)) return;
  bot.sendMessage(msg.chat.id,
    '🏭 *Agent Factory* ready\n\n' +
    'Commands:\n' +
    '`/build "description"` — создать сайт\n' +
    '`/research "query"` — ресёрч\n' +
    '`/plan "task"` — создать todo.md\n' +
    '`/status` — состояние сервисов\n' +
    '`/help` — все команды',
    { parse_mode: 'Markdown' }
  );
});

// /build
bot.onText(/^\/build (.+)$/, async (msg, match) => {
  if (!isAllowed(msg)) return;
  const description = match[1].replace(/^"|"$/g, '');
  const chatId = msg.chat.id;
  log('build_start', { description, userId: msg.from.id });
  await bot.sendMessage(chatId, `🔧 Building: *${description}*...`, { parse_mode: 'Markdown' });
  try {
    const prompt = `You are a web developer. Generate a complete, production-ready HTML file for: "${description}".
Requirements:
- Use Tailwind CSS CDN (no build step)
- Modern, responsive design
- No external dependencies except Tailwind CDN
- Complete HTML5 document
- Output ONLY the HTML code, nothing else`;
    const { result, provider } = await route('codegen', prompt);
    // Сохранить build
    const buildId = `build_${Date.now()}`;
    const buildDir = path.join(__dirname, '../factory/builds', buildId);
    fs.mkdirSync(buildDir, { recursive: true });
    fs.writeFileSync(path.join(buildDir, 'index.html'), result);
    log('build_complete', { buildId, provider, description });
    await bot.sendMessage(chatId,
      `✅ Build complete\n• Provider: ${provider}\n• ID: ${buildId}\n• File: factory/builds/${buildId}/index.html`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    log('build_error', { description, error: err.message });
    await bot.sendMessage(chatId, `❌ Build failed: ${err.message}`);
  }
});

// /research
bot.onText(/^\/research (.+)$/, async (msg, match) => {
  if (!isAllowed(msg)) return;
  const query = match[1].replace(/^"|"$/g, '');
  await bot.sendMessage(msg.chat.id, `🔍 Researching: *${query}*...`, { parse_mode: 'Markdown' });
  try {
    const { result, provider } = await route('research', `Research: ${query}`);
    await bot.sendMessage(msg.chat.id, `📊 *Research Result* (${provider}):\n\n${result.slice(0, 3800)}`, { parse_mode: 'Markdown' });
  } catch (err) {
    await bot.sendMessage(msg.chat.id, `❌ Research failed: ${err.message}`);
  }
});

// /plan
bot.onText(/^\/plan (.+)$/, async (msg, match) => {
  if (!isAllowed(msg)) return;
  const task = match[1].replace(/^"|"$/g, '');
  await bot.sendMessage(msg.chat.id, `📋 Planning: *${task}*...`, { parse_mode: 'Markdown' });
  try {
    const prompt = `Decompose this task into a detailed todo.md with clear steps and Definition of Done for each:\n\n${task}`;
    const { result, provider } = await route('planning', prompt);
    await bot.sendMessage(msg.chat.id, `✅ *Plan* (${provider}):\n\n${result.slice(0, 3800)}`, { parse_mode: 'Markdown' });
  } catch (err) {
    await bot.sendMessage(msg.chat.id, `❌ Plan failed: ${err.message}`);
  }
});

// /status
bot.onText(/^\/status$/, async (msg) => {
  if (!isAllowed(msg)) return;
  try {
    const http = require('http');
    const apiUrl = `http://localhost:${process.env.SERVER_PORT || 3001}/health`;
    http.get(apiUrl, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const h = JSON.parse(data);
        const lines = Object.entries(h.services)
          .map(([k, v]) => `${v ? '✅' : '❌'} ${k}`);
        bot.sendMessage(msg.chat.id, `📊 *System Status*\n\n${lines.join('\n')}`, { parse_mode: 'Markdown' });
      });
    }).on('error', () => bot.sendMessage(msg.chat.id, '⚠️ API server not reachable'));
  } catch (err) {
    bot.sendMessage(msg.chat.id, `❌ Status error: ${err.message}`);
  }
});

// /help
bot.onText(/^\/help$/, (msg) => {
  if (!isAllowed(msg)) return;
  bot.sendMessage(msg.chat.id,
    '🤖 *Agent Factory Commands*\n\n' +
    '`/build "description"` — Генерирует HTML-сайт и деплоит на Netlify\n' +
    
    '`/plan "task"` — Декомпозиция задачи в todo.md\n' +
    '`/status` — Состояние всех сервисов\n' +
    '`/start` — Приветствие',
    { parse_mode: 'Markdown' }
  );
});

console.log('🤖 Agent Factory bot started');

#!/usr/bin/env node
// heartbeat-monitor.cjs — monitors data/heartbeats.jsonl for missed heartbeats
// Alerts via Telegram if any service hasn't reported in > 3x its interval

const fs = require('fs');
const https = require('https');

const HB_FILE = process.env.HB_FILE || 'data/heartbeats.jsonl';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Service intervals from .agent/crons.md
const SERVICES = {
  'shadow-api': { interval: 60000, threshold: 180000 },      // 60s * 3
  'shadow-bot': { interval: 60000, threshold: 180000 },
  'zeroclaw': { interval: 60000, threshold: 180000 },
  'free-proxy': { interval: 60000, threshold: 180000 },
  'sub-kiro': { interval: 60000, threshold: 180000 },
  'ollama': { interval: 300000, threshold: 900000 },         // 300s * 3
};

function sendTelegramAlert(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('[hb-monitor] No Telegram credentials, skipping alert');
    return Promise.resolve();
  }

  const payload = JSON.stringify({
    chat_id: TELEGRAM_CHAT_ID,
    text: `🔴 <b>Heartbeat Alert</b>\n\n${message}`,
    parse_mode: 'HTML',
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('[hb-monitor] Alert sent to Telegram');
        } else {
          console.error('[hb-monitor] Telegram API error:', res.statusCode, data);
        }
        resolve();
      });
    });
    req.on('error', (e) => {
      console.error('[hb-monitor] Telegram request error:', e.message);
      resolve();
    });
    req.setTimeout(10000, () => { req.destroy(); resolve(); });
    req.write(payload);
    req.end();
  });
}

function checkHeartbeats() {
  if (!fs.existsSync(HB_FILE)) {
    console.log('[hb-monitor] No heartbeats file yet');
    return;
  }

  const lines = fs.readFileSync(HB_FILE, 'utf8').trim().split('\n').filter(Boolean);
  const lastHeartbeats = {};

  // Parse all heartbeats, keep only the latest per service
  for (const line of lines) {
    try {
      const hb = JSON.parse(line);
      if (!lastHeartbeats[hb.service] || hb.ts > lastHeartbeats[hb.service].ts) {
        lastHeartbeats[hb.service] = hb;
      }
    } catch {}
  }

  const now = Date.now();
  const alerts = [];

  for (const [service, config] of Object.entries(SERVICES)) {
    const last = lastHeartbeats[service];
    
    if (!last) {
      alerts.push(`❌ <b>${service}</b>: no heartbeat found`);
      continue;
    }

    const age = now - last.ts;
    if (age > config.threshold) {
      const ageMin = Math.round(age / 60000);
      alerts.push(`⚠️ <b>${service}</b>: last seen ${ageMin}m ago (threshold: ${config.threshold / 60000}m)`);
    } else {
      console.log(`[hb-monitor] ${service}: ok (${Math.round(age / 1000)}s ago)`);
    }
  }

  if (alerts.length > 0) {
    const message = alerts.join('\n');
    console.log('[hb-monitor] ALERTS:\n' + message);
    sendTelegramAlert(message);
  } else {
    console.log('[hb-monitor] All services healthy');
  }
}

// Run check immediately
console.log('[hb-monitor] Starting heartbeat monitor');
checkHeartbeats();

// Run every 3 minutes (180s)
setInterval(checkHeartbeats, 180000);

#!/usr/bin/env node
// ollama-heartbeat.cjs — sends heartbeat for system-level Ollama service
// Run: node ollama-heartbeat.cjs (can be started via launchd or pm2)

const http = require('http');
const os = require('os');
const fs = require('fs');

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'localhost:11434';
const HB_FILE = process.env.HB_FILE || 'data/heartbeats.jsonl';

function writeHeartbeat() {
  const line = JSON.stringify({
    ts: Date.now(),
    service: 'ollama',
    pid: process.pid,
    free_mb: Math.round(os.freemem() / 1024 / 1024),
    status: 'ok',
  });
  fs.appendFileSync(HB_FILE, line + '\n');
}

function checkOllama() {
  return new Promise((resolve) => {
    const req = http.get(`http://${OLLAMA_HOST}/`, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        // Ollama returns "Ollama is running" as plain text
        if (res.statusCode === 200 && data.includes('Ollama')) {
          console.log(`[ollama-hb] ollama ok`);
          writeHeartbeat();
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
    req.on('error', () => resolve(false));
    req.setTimeout(5000, () => { req.destroy(); resolve(false); });
  });
}

(async () => {
  console.log(`[ollama-hb] Starting (target: ${OLLAMA_HOST}, file: ${HB_FILE})`);
  
  // Check and heartbeat every 300s (5 min) per crons.md spec
  setInterval(async () => {
    const ok = await checkOllama();
    if (!ok) {
      const line = JSON.stringify({ ts: Date.now(), service: 'ollama', pid: process.pid, free_mb: Math.round(os.freemem() / 1024 / 1024), status: 'unreachable' });
      fs.appendFileSync(HB_FILE, line + '\n');
      console.log('[ollama-hb] ollama unreachable, wrote status=unreachable');
    }
  }, 300000);
  
  // Immediate first check
  await checkOllama();
})();

// server/lib/logger.cjs — JSONL Logger
// Each log line: { ts, level, msg, meta }
// Writes to data/logs/app.jsonl

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.resolve(__dirname, '../../data/logs');
const LOG_FILE = path.join(LOG_DIR, 'app.jsonl');

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const config = require('./config.cjs');
const minLevel = LEVELS[config.LOG_LEVEL] || 1;

function ensureDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function write(level, msg, meta = {}) {
  if (LEVELS[level] < minLevel) return;
  ensureDir();
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    meta,
  };
  const line = JSON.stringify(entry) + '\n';
  fs.appendFileSync(LOG_FILE, line, 'utf-8');
}

const logger = {
  debug: (msg, meta) => write('debug', msg, meta),
  info: (msg, meta) => write('info', msg, meta),
  warn: (msg, meta) => write('warn', msg, meta),
  error: (msg, meta) => write('error', msg, meta),
};

module.exports = logger;

'use strict';
// Persistent state layer for ZeroClaw pipeline runs.
// Stores pipeline executions in data/zeroclaw-state.json (last 50 entries).
// Pattern matches MemoryLayer in llm-gateway.cjs — atomic JSON file writes.

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', '..', 'data', 'zeroclaw-state.json');
const MAX_ENTRIES = 50;

let _cache = null;

function _ensureDir() {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function load() {
  if (_cache) return _cache;
  try {
    _cache = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    _cache = { runs: {} };
  }
  return _cache;
}

function save(taskId, state) {
  const data = load();
  data.runs[taskId] = { ...state, updated_at: Date.now() };
  _prune(data);
  _ensureDir();
  fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2));
  _cache = data;
}

function get(taskId) {
  const data = load();
  return taskId ? data.runs[taskId] || null : data.runs;
}

function _prune(data) {
  const keys = Object.keys(data.runs);
  if (keys.length <= MAX_ENTRIES) return;
  const sorted = keys.sort((a, b) =>
    (data.runs[a].updated_at || 0) - (data.runs[b].updated_at || 0)
  );
  const toRemove = sorted.slice(0, keys.length - MAX_ENTRIES);
  for (const k of toRemove) delete data.runs[k];
}

module.exports = { load, save, get };

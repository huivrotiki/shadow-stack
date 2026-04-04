// bot/state-helpers.cjs
// Pure helpers that read .state/ files for the telegram bot.
// No Telegram dependency — takes project root as parameter for testability.

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function stateDirOf(projectRoot) {
  return path.join(projectRoot, '.state');
}

function readCurrentState(projectRoot) {
  const file = path.join(stateDirOf(projectRoot), 'current.yaml');
  if (!fs.existsSync(file)) return null;
  try {
    return yaml.load(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return null;
  }
}

function formatStateMessage(state) {
  if (!state) return '❌ .state/current.yaml not found or invalid';
  const lines = [
    `📍 Project: ${state.project || '?'}`,
    `🏃 Runtime: ${state.active_runtime || 'none'}`,
    `📋 Plan: ${(state.plan && state.plan.phase) || '?'} / ${(state.plan && state.plan.step) || '?'}`,
    `⏭  Next: ${(state.plan && state.plan.next) || '?'}`,
    `🌳 Git: ${(state.git && state.git.branch) || '?'}@${(state.git && state.git.last_commit) || '?'}`,
    `🕐 Updated: ${state.updated || '?'}`,
  ];
  return lines.join('\n');
}

function readTodos(projectRoot) {
  const file = path.join(stateDirOf(projectRoot), 'todo.md');
  if (!fs.existsSync(file)) return '(empty)';
  return fs.readFileSync(file, 'utf8');
}

function tailSession(projectRoot, n) {
  const file = path.join(stateDirOf(projectRoot), 'session.md');
  if (!fs.existsSync(file)) return '(empty)';
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  // Group: each heading `## HH:MM · runtime · event` plus following content until next heading
  const chunks = [];
  let current = null;
  for (const line of lines) {
    if (/^## \d{2}:\d{2} · /.test(line)) {
      if (current) chunks.push(current.join('\n'));
      current = [line];
    } else if (current) {
      current.push(line);
    }
  }
  if (current) chunks.push(current.join('\n'));
  if (chunks.length === 0) return '(no events yet)';
  return chunks.slice(-n).join('\n\n');
}

function appendSessionEvent(projectRoot, runtime, event, body) {
  const file = path.join(stateDirOf(projectRoot), 'session.md');
  const hhmm = new Date().toISOString().slice(11, 16);
  const block = `\n## ${hhmm} · ${runtime} · ${event}\n${body || ''}\n`;
  fs.appendFileSync(file, block);
}

const ALLOWED_RUNTIMES = ['claude-code', 'opencode', 'zeroclaw', 'telegram', 'none'];

function setActiveRuntime(projectRoot, runtime) {
  if (!ALLOWED_RUNTIMES.includes(runtime)) {
    throw new Error(`invalid runtime: ${runtime} (allowed: ${ALLOWED_RUNTIMES.join(', ')})`);
  }
  const file = path.join(stateDirOf(projectRoot), 'current.yaml');
  if (!fs.existsSync(file)) throw new Error('current.yaml not found');
  const state = yaml.load(fs.readFileSync(file, 'utf8'));
  const prev = state.active_runtime || 'none';
  state.active_runtime = runtime;
  state.updated = new Date().toISOString();
  fs.writeFileSync(file, yaml.dump(state, { sortKeys: false }));
  return { prev, next: runtime };
}

function readHandoff(projectRoot, maxBytes) {
  const file = path.join(projectRoot, 'handoff.md');
  if (!fs.existsSync(file)) return '(no handoff.md)';
  const buf = fs.readFileSync(file, 'utf8');
  const limit = maxBytes || 3500;
  if (buf.length <= limit) return buf;
  return '…(truncated)…\n' + buf.slice(-limit);
}

module.exports = {
  readCurrentState,
  formatStateMessage,
  readTodos,
  tailSession,
  appendSessionEvent,
  setActiveRuntime,
  readHandoff,
  ALLOWED_RUNTIMES,
};

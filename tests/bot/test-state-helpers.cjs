// tests/bot/test-state-helpers.cjs
// Tests the state-reading helpers used by the telegram bot.
// Uses built-in assert — no test framework.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  readCurrentState,
  formatStateMessage,
  readTodos,
  tailSession,
  setActiveRuntime,
  readHandoff,
} = require('../../bot/state-helpers.cjs');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'state-helpers-'));
const stateDir = path.join(tmp, '.state');
fs.mkdirSync(stateDir, { recursive: true });

// Fixture: current.yaml
fs.writeFileSync(
  path.join(stateDir, 'current.yaml'),
  `version: 1
project: test-proj
updated: 2026-04-04T22:00:00Z
active_runtime: claude-code
plan:
  file: docs/plans/p.md
  phase: R0
  step: R0.0
  next: R0.1
session:
  file: .state/session.md
  started: 2026-04-04T22:00:00Z
handoff:
  file: handoff.md
git:
  branch: feat/test
  last_commit: abc1234
  auto_commit_state: true
`
);

fs.writeFileSync(
  path.join(stateDir, 'todo.md'),
  '# Todos\n\n- [x] done\n- [ ] pending\n'
);

fs.writeFileSync(
  path.join(stateDir, 'session.md'),
  [
    '# Session 2026-04-04',
    '',
    '## 22:00 · claude-code · runtime_open',
    'bootstrap',
    '',
    '## 22:15 · claude-code · plan_step_advance',
    'R0.0',
    '',
    '## 22:30 · opencode · git_commit',
    'abc1234',
  ].join('\n')
);

// Test 1: readCurrentState returns parsed object with expected fields
{
  const state = readCurrentState(tmp);
  assert.strictEqual(state.project, 'test-proj');
  assert.strictEqual(state.active_runtime, 'claude-code');
  assert.strictEqual(state.plan.step, 'R0.0');
  console.log('  ✅ readCurrentState parses YAML');
}

// Test 2: readCurrentState returns null when file missing
{
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'empty-'));
  const state = readCurrentState(empty);
  assert.strictEqual(state, null);
  fs.rmSync(empty, { recursive: true, force: true });
  console.log('  ✅ readCurrentState returns null when missing');
}

// Test 3: formatStateMessage contains key fields
{
  const state = readCurrentState(tmp);
  const msg = formatStateMessage(state);
  assert.ok(msg.includes('test-proj'));
  assert.ok(msg.includes('claude-code'));
  assert.ok(msg.includes('R0.0'));
  assert.ok(msg.includes('abc1234'));
  console.log('  ✅ formatStateMessage includes project/runtime/step/commit');
}

// Test 4: formatStateMessage handles null
{
  const msg = formatStateMessage(null);
  assert.ok(msg.includes('not found'));
  console.log('  ✅ formatStateMessage handles null');
}

// Test 5: readTodos returns file contents
{
  const todos = readTodos(tmp);
  assert.ok(todos.includes('- [x] done'));
  assert.ok(todos.includes('- [ ] pending'));
  console.log('  ✅ readTodos returns file contents');
}

// Test 6: tailSession returns last N event headings
{
  const tail = tailSession(tmp, 2);
  assert.ok(tail.includes('plan_step_advance'));
  assert.ok(tail.includes('git_commit'));
  assert.ok(!tail.includes('runtime_open'));
  console.log('  ✅ tailSession returns last 2 events');
}

// Test 7: tailSession with n larger than available returns all
{
  const tail = tailSession(tmp, 100);
  assert.ok(tail.includes('runtime_open'));
  assert.ok(tail.includes('plan_step_advance'));
  assert.ok(tail.includes('git_commit'));
  console.log('  ✅ tailSession caps at available count');
}

// Test 8: setActiveRuntime switches runtime and bumps updated
{
  const before = readCurrentState(tmp);
  const { prev, next } = setActiveRuntime(tmp, 'telegram');
  assert.strictEqual(prev, 'claude-code');
  assert.strictEqual(next, 'telegram');
  const after = readCurrentState(tmp);
  assert.strictEqual(after.active_runtime, 'telegram');
  assert.notStrictEqual(after.updated, before.updated);
  console.log('  ✅ setActiveRuntime switches + bumps updated');
}

// Test 9: setActiveRuntime rejects invalid runtime
{
  assert.throws(() => setActiveRuntime(tmp, 'bogus'), /invalid runtime/);
  console.log('  ✅ setActiveRuntime rejects invalid name');
}

// Test 10: readHandoff returns content when present, placeholder when absent
{
  const handoffPath = path.join(tmp, 'handoff.md');
  fs.writeFileSync(handoffPath, '# Handoff\nsession data');
  assert.ok(readHandoff(tmp).includes('session data'));
  fs.rmSync(handoffPath);
  assert.strictEqual(readHandoff(tmp), '(no handoff.md)');
  console.log('  ✅ readHandoff handles present/absent');
}

// Test 11: readHandoff truncates large files from the tail
{
  const handoffPath = path.join(tmp, 'handoff.md');
  const big = 'A'.repeat(5000) + 'TAIL_MARKER';
  fs.writeFileSync(handoffPath, big);
  const out = readHandoff(tmp, 1000);
  assert.ok(out.includes('TAIL_MARKER'));
  assert.ok(out.startsWith('…(truncated)…'));
  assert.ok(out.length <= 1100);
  fs.rmSync(handoffPath);
  console.log('  ✅ readHandoff truncates from tail');
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log('');
console.log('All tests passed.');

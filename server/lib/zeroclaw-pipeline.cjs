'use strict';
// ZeroClaw Pipeline Orchestrator — full lifecycle:
//   Pre-flight → Context Gather → Execute → Decision (commit/retry/revert)
//
// Entry point: orchestrate(request) — called from /api/zeroclaw/orchestrate
// Commander (Claude Code) plans, Executor (ZeroClaw via Castor) executes.

const { execFile } = require('child_process');
const path = require('path');
const contextGather = require('./context-gather.cjs');
const testRunner = require('./zeroclaw-test-runner.cjs');
const zcState = require('./zeroclaw-state.cjs');

const PROJECT_ROOT = path.join(__dirname, '..', '..');
const SHADOW_API = process.env.SHADOW_API_URL || 'http://localhost:3001';
const PROXY_URL = process.env.FREE_PROXY_BASE_URL || 'http://localhost:20129';

// ── Helpers ─────────────────────────────────────────────────────────────────

function _execFilePromise(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { cwd: PROJECT_ROOT, timeout: 10000, ...opts }, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve({ stdout: (stdout || '').trim(), stderr: (stderr || '').trim() });
    });
  });
}

// ── Phase 1: Pre-flight ─────────────────────────────────────────────────────

async function _preflight() {
  const checks = { ram_ok: false, services_ok: false, cloud_only: false };

  // RAM check
  try {
    const res = await fetch(`${SHADOW_API}/ram`, { signal: AbortSignal.timeout(3000) });
    const ram = await res.json();
    if (ram.critical) return { ...checks, abort: true, reason: 'RAM CRITICAL (<200MB) — pipeline frozen' };
    checks.ram_ok = true;
    checks.cloud_only = !ram.safe; // safe = >400MB; if false, cloud-only mode
    checks.free_mb = ram.free_mb;
  } catch {
    return { ...checks, abort: true, reason: 'shadow-api :3001 unreachable' };
  }

  // Services check
  try {
    const [zc, proxy] = await Promise.allSettled([
      fetch(`${SHADOW_API}/api/zeroclaw/health`, { signal: AbortSignal.timeout(3000) }),
      fetch(`${PROXY_URL}/health`, { signal: AbortSignal.timeout(3000) }),
    ]);
    checks.services_ok = zc.status === 'fulfilled' && proxy.status === 'fulfilled';
  } catch {
    checks.services_ok = false;
  }

  return checks;
}

// ── Phase 3: Execute ────────────────────────────────────────────────────────

async function _execute(enrichedGoal, request) {
  // Lazy-load to avoid circular deps (zeroclaw-http also loads ZeroClaw)
  const planner = require('./zeroclaw-planner.cjs');
  const { getZeroClaw } = require('./zeroclaw-http.cjs');
  const zc = await getZeroClaw();

  const plan = planner.plan(enrichedGoal);
  const tasks = plan.steps.map((step, i) => ({
    task_id: `${request._pipeline_id}-step-${i}`,
    instruction: step.instruction,
    model: request.model || 'auto',
  }));

  const results = await zc.executeMany(tasks, { concurrency: 2 });
  const avgScore = results.length
    ? results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length
    : 0;

  return { plan, results, steps: results.length, avg_score: avgScore };
}

// ── Phase 4: Decision ───────────────────────────────────────────────────────

async function _decide(execution, context, request) {
  const checkNames = ['health', 'score_threshold', 'output_not_empty'];
  if (request.custom_test) checkNames.push('custom');

  const testResult = await testRunner.run(checkNames, {
    results: execution.results,
    context,
    request,
  });

  const score = testResult.score;
  let action = 'none';

  if (score >= (request.min_score || 0.8)) {
    if (request.auto_commit && !request.skip_git) {
      try {
        await _execFilePromise('git', ['add', '-A']);
        const msg = `feat(zeroclaw): ${request.goal.slice(0, 60)}`;
        await _execFilePromise('git', ['commit', '-m', msg]);
        action = 'committed';
      } catch (e) {
        action = 'commit_failed: ' + e.message;
      }
    } else {
      action = 'ready_to_commit';
    }
  } else {
    if (request.auto_revert && !request.skip_git) {
      try {
        await _execFilePromise('git', ['checkout', '--', '.']);
        action = 'reverted';
      } catch {
        action = 'revert_failed';
      }
    } else {
      action = 'failed_below_threshold';
    }
  }

  return { score, action, tests: testResult };
}

// ── Main Orchestrator ───────────────────────────────────────────────────────

async function orchestrate(request = {}) {
  if (!request.goal) throw new Error('goal is required');

  const pipelineId = request.task_id || `pipe-${Date.now()}`;
  request._pipeline_id = pipelineId;
  const maxRetries = request.max_retries ?? 1;

  // Track in persistent state
  zcState.save(pipelineId, { status: 'running', goal: request.goal, started_at: Date.now() });

  const phases = {};

  // Phase 1: Pre-flight
  if (!request.skip_preflight) {
    phases.preflight = await _preflight();
    if (phases.preflight.abort) {
      zcState.save(pipelineId, { status: 'aborted', reason: phases.preflight.reason });
      return { pipeline_id: pipelineId, status: 'aborted', phases };
    }
  } else {
    phases.preflight = { skipped: true };
  }

  // Phase 2: Context Gather
  let enrichedGoal = request.goal;
  if (!request.skip_context) {
    phases.context = await contextGather.gather(request.goal, {
      context_query: request.context_query,
      skip_memory: false,
      skip_notebook: false,
    });

    // Enrich goal with gathered context
    const parts = [request.goal];
    if (phases.context.memory?.matches?.length) {
      parts.push('Relevant context: ' + phases.context.memory.matches.join('; '));
    }
    if (phases.context.notebook?.answer) {
      parts.push('Expert insight: ' + phases.context.notebook.answer);
    }
    if (phases.context.codebase?.files?.length) {
      parts.push('Related files: ' + phases.context.codebase.files.join(', '));
    }
    enrichedGoal = parts.filter(Boolean).join('\n\n');
  } else {
    phases.context = { skipped: true };
  }

  // Phase 3 + 4: Execute → Decision (with retry loop)
  let attempt = 0;
  let lastExecution = null;
  let lastDecision = null;

  while (attempt <= maxRetries) {
    // Phase 3: Execute
    const goalForAttempt = attempt === 0
      ? enrichedGoal
      : `${enrichedGoal}\n\nPrevious attempt failed (score: ${lastDecision?.score?.toFixed(2)}). Improve the result.`;

    lastExecution = await _execute(goalForAttempt, request);
    phases.execution = lastExecution;

    // Phase 4: Decision
    if (!request.skip_tests) {
      lastDecision = await _decide(lastExecution, phases.context, request);
      phases.decision = lastDecision;

      if (lastDecision.score >= (request.min_score || 0.8)) {
        break; // Success — exit retry loop
      }

      attempt++;
      if (attempt <= maxRetries) {
        phases.decision.retrying = true;
      }
    } else {
      phases.decision = { skipped: true, score: lastExecution.avg_score, action: 'tests_skipped' };
      break;
    }
  }

  const finalStatus = phases.decision?.score >= (request.min_score || 0.8) ? 'success' : 'failed';

  zcState.save(pipelineId, {
    status: finalStatus,
    goal: request.goal,
    score: phases.decision?.score,
    action: phases.decision?.action,
    attempts: attempt + 1,
    completed_at: Date.now(),
  });

  return {
    pipeline_id: pipelineId,
    status: finalStatus,
    phases,
    score: phases.decision?.score,
    action_taken: phases.decision?.action,
  };
}

module.exports = { orchestrate };

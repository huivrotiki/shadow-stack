/**
 * CLI Tool — Safe shell command execution for Orchestrator
 * Executes commands with timeout, output capture, and sanitization
 */

import { spawn } from 'child_process';
import logger from '../lib/logger.cjs';

// Blocked commands for security
const BLOCKED = ['rm -rf /', 'mkfs', 'dd if=', 'shutdown', 'reboot', ':(){ :|:& };:'];

/**
 * Check if command is safe to execute
 */
function isSafe(command) {
  for (const blocked of BLOCKED) {
    if (command.includes(blocked)) {
      return { safe: false, reason: `Blocked command: ${blocked}` };
    }
  }

  // No sudo without explicit allow
  if (command.startsWith('sudo ')) {
    return { safe: false, reason: 'sudo not allowed' };
  }

  return { safe: true };
}

/**
 * Execute shell command with timeout
 * @param {object} input - { command, timeout?, cwd?, env? }
 * @returns {object} - { text, model, tokens, exitCode, latency_ms }
 */
export async function execute(input) {
  const { command, timeout = 30000, cwd, env } = input;

  if (!command || typeof command !== 'string') {
    throw new Error('CLI tool requires command (string)');
  }

  // Security check
  const safety = isSafe(command);
  if (!safety.safe) {
    logger.warn('CLI command blocked', { command, reason: safety.reason });
    throw new Error(`Command blocked: ${safety.reason}`);
  }

  logger.info('CLI executing', { command });

  return new Promise((resolve, reject) => {
    const start = Date.now();
    let stdout = '';
    let stderr = '';
    let killed = false;

    const child = spawn('sh', ['-c', command], {
      cwd: cwd || process.cwd(),
      env: { ...process.env, ...env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Timeout handler
    const timer = setTimeout(() => {
      killed = true;
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 5000);
    }, timeout);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      // Limit output to 100KB
      if (stdout.length > 100000) {
        stdout = stdout.slice(-100000);
      }
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      if (stderr.length > 50000) {
        stderr = stderr.slice(-50000);
      }
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      const latency_ms = Date.now() - start;

      if (killed) {
        reject(new Error(`Command timed out after ${timeout}ms`));
        return;
      }

      const output = stdout.trim() || stderr.trim() || '(no output)';

      resolve({
        text: output,
        model: 'shell',
        tokens: 0,
        exitCode: code,
        latency_ms,
      });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`CLI spawn error: ${err.message}`));
    });
  });
}

/**
 * Health check — run a simple echo
 */
export async function healthCheck() {
  try {
    const result = await execute({ command: 'echo ok', timeout: 5000 });
    return { online: result.exitCode === 0, latency: result.latency_ms };
  } catch (e) {
    return { online: false, latency: -1, error: e.message };
  }
}

export default { execute, healthCheck };

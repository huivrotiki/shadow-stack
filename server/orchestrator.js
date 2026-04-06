/**
 * Orchestrator — Shadow Stack Phase 2
 * State machine: IDLE → PLANNING → EXECUTING → REPORTING → IDLE
 * Handles task execution, error recovery, and resource management
 */

import { EventEmitter } from 'events';
import { broadcastHealth } from './index.js';

// State definitions
const State = {
  IDLE: 'IDLE',
  PLANNING: 'PLANNING',
  EXECUTING: 'EXECUTING',
  REPORTING: 'REPORTING',
  ERROR: 'ERROR',
};

// Valid transitions
const transitions = {
  [State.IDLE]: [State.PLANNING],
  [State.PLANNING]: [State.EXECUTING, State.ERROR],
  [State.EXECUTING]: [State.REPORTING, State.ERROR],
  [State.REPORTING]: [State.IDLE, State.ERROR],
  [State.ERROR]: [State.IDLE], // Recovery always goes to IDLE
};

export class Orchestrator extends EventEmitter {
  constructor(config = {}) {
    super();
    this.state = State.IDLE;
    this.tasks = [];
    this.currentTask = null;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.executionTimeout = config.executionTimeout || 60000;
    this.tools = {}; // Registered tools
    this.history = [];
    this.stuckCounter = 0;
    this.maxStuck = 3;
  }

  /**
   * Register a tool for task execution
   * @param {string} name - Tool identifier
   * @param {object} tool - Tool with execute(input) method
   */
  registerTool(name, tool) {
    this.tools[name] = tool;
    return this;
  }

  /**
   * Transition to new state with validation
   */
  transition(newState) {
    const valid = transitions[this.state];
    if (!valid || !valid.includes(newState)) {
      throw new Error(`Invalid transition: ${this.state} → ${newState}`);
    }

    const oldState = this.state;
    this.state = newState;
    this.emit('stateChange', { from: oldState, to: newState, timestamp: Date.now() });

    if (newState === State.IDLE) {
      this.stuckCounter = 0;
    }

    return this;
  }

  /**
   * Add task to queue
   * @param {object} task - { id, type, input, tool, priority }
   */
  enqueue(task) {
    const entry = {
      id: task.id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: task.type || 'default',
      input: task.input,
      tool: task.tool || 'llm',
      priority: task.priority || 0,
      status: 'pending',
      createdAt: Date.now(),
      retries: 0,
      result: null,
      error: null,
    };

    this.tasks.push(entry);
    this.tasks.sort((a, b) => b.priority - a.priority);
    this.emit('taskEnqueued', entry);
    return entry.id;
  }

  /**
   * Execute a single task with retry logic
   */
  async executeTask(task) {
    const tool = this.tools[task.tool];
    if (!tool) {
      throw new Error(`Tool not found: ${task.tool}`);
    }

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        this.emit('taskAttempt', { taskId: task.id, attempt });

        const result = await Promise.race([
          tool.execute(task.input),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Execution timeout')), this.executionTimeout)
          ),
        ]);

        task.status = 'completed';
        task.result = result;
        task.completedAt = Date.now();
        this.emit('taskCompleted', task);
        return result;
      } catch (err) {
        task.retries = attempt + 1;

        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          this.emit('taskRetry', { taskId: task.id, attempt, delay, error: err.message });
          await new Promise(r => setTimeout(r, delay));
        } else {
          task.status = 'failed';
          task.error = err.message;
          task.completedAt = Date.now();
          this.emit('taskFailed', task);
          throw err;
        }
      }
    }
  }

  /**
   * Main execution loop — processes queue
   */
  async run() {
    if (this.state !== State.IDLE) {
      throw new Error(`Cannot start from state: ${this.state}`);
    }

    while (this.tasks.length > 0) {
      this.currentTask = this.tasks.shift();

      try {
        // PLANNING phase
        this.transition(State.PLANNING);
        this.emit('planning', { task: this.currentTask });

        // EXECUTING phase
        this.transition(State.EXECUTING);
        await this.executeTask(this.currentTask);

        // REPORTING phase
        this.transition(State.REPORTING);
        this.history.push({
          task: this.currentTask,
          completedAt: Date.now(),
        });
        this.emit('reported', { task: this.currentTask });

        // Back to IDLE
        this.transition(State.IDLE);

        // Broadcast health after each task
        try { await broadcastHealth(); } catch {}

      } catch (err) {
        this.stuckCounter++;
        this.emit('error', { task: this.currentTask, error: err.message, stuckCounter: this.stuckCounter });

        if (this.stuckCounter >= this.maxStuck) {
          // Circuit breaker — reset to IDLE, mark task failed
          this.emit('circuitBreaker', { stuckCounter: this.stuckCounter });
          this.state = State.IDLE;
          this.stuckCounter = 0;
        } else {
          // Self-healing: try to recover
          this.transition(State.ERROR);
          await new Promise(r => setTimeout(r, this.retryDelay));
          this.transition(State.IDLE);
        }
      }
    }

    this.emit('drained');
    return this.history;
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      state: this.state,
      queueSize: this.tasks.length,
      currentTask: this.currentTask?.id || null,
      stuckCounter: this.stuckCounter,
      historySize: this.history.length,
      registeredTools: Object.keys(this.tools),
    };
  }

  /**
   * Clear queue and reset
   */
  reset() {
    this.tasks = [];
    this.currentTask = null;
    this.stuckCounter = 0;
    this.state = State.IDLE;
    this.emit('reset');
    return this;
  }
}

// Singleton instance
let instance = null;

export function getOrchestrator(config) {
  if (!instance) {
    instance = new Orchestrator(config);
  }
  return instance;
}

export { State };
export default { Orchestrator, getOrchestrator, State };

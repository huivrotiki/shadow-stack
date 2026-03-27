// server/lib/metrics.cjs — Query Metrics
// Tracks latency per provider, success/failure counts, tokens
// Stores in data/metrics.json

const fs = require('fs');
const path = require('path');

const METRICS_FILE = path.resolve(__dirname, '../../data/metrics.json');

let metrics = {
  total_queries: 0,
  successful: 0,
  failed: 0,
  by_provider: {},
  updated_at: new Date().toISOString(),
};

function load() {
  try {
    if (fs.existsSync(METRICS_FILE)) {
      metrics = JSON.parse(fs.readFileSync(METRICS_FILE, 'utf-8'));
    }
  } catch (e) {
    // Reset on parse error
  }
}

function save() {
  const dir = path.dirname(METRICS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  metrics.updated_at = new Date().toISOString();
  fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2));
}

function record(provider, latency_ms, tokens, success) {
  metrics.total_queries++;
  if (success) metrics.successful++;
  else metrics.failed++;

  if (!metrics.by_provider[provider]) {
    metrics.by_provider[provider] = {
      total: 0,
      success: 0,
      failed: 0,
      total_latency_ms: 0,
      total_tokens: 0,
      avg_latency_ms: 0,
    };
  }

  const p = metrics.by_provider[provider];
  p.total++;
  if (success) p.success++;
  else p.failed++;
  p.total_latency_ms += latency_ms;
  p.total_tokens += tokens;
  p.avg_latency_ms = Math.round(p.total_latency_ms / p.total);

  save();
}

function getMetrics() {
  load();
  return { ...metrics };
}

// Load on startup
load();

module.exports = { record, getMetrics };

// server/lib/ram-guard.cjs — RAM Guard
// Monitor memory usage, reject requests if threshold exceeded

const config = require('./config.cjs');
const logger = require('./logger.cjs');

const THRESHOLD_MB = config.RAM_THRESHOLD_MB || 512;

function check() {
  const rss = process.memoryUsage().rss / (1024 * 1024);
  const heapUsed = process.memoryUsage().heapUsed / (1024 * 1024);
  const heapTotal = process.memoryUsage().heapTotal / (1024 * 1024);
  const exceeded = rss > THRESHOLD_MB;

  return {
    rss_mb: Math.round(rss),
    heap_used_mb: Math.round(heapUsed),
    heap_total_mb: Math.round(heapTotal),
    threshold_mb: THRESHOLD_MB,
    exceeded,
    status: exceeded ? 'WARNING' : 'OK',
  };
}

function middleware(req, res, next) {
  const status = check();
  if (status.exceeded) {
    logger.warn('RAM guard triggered', { rss_mb: status.rss_mb, threshold: THRESHOLD_MB });
    return res.status(503).json({ error: 'Service overloaded', ram: status });
  }
  if (next) next();
}

module.exports = { check, middleware };

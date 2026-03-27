// server/lib/rate-limiter.cjs — Token Bucket Rate Limiter
// Per-IP rate limiting for API endpoints

const config = require('./config.cjs');
const logger = require('./logger.cjs');

const RPS = config.RATE_LIMIT_RPS || 10;
const BURST = RPS * 2;

const buckets = new Map();

function getBucket(ip) {
  if (!buckets.has(ip)) {
    buckets.set(ip, { tokens: BURST, lastRefill: Date.now() });
  }
  return buckets.get(ip);
}

function refill(bucket) {
  const now = Date.now();
  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(BURST, bucket.tokens + elapsed * RPS);
  bucket.lastRefill = now;
}

function middleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const bucket = getBucket(ip);
  refill(bucket);

  if (bucket.tokens < 1) {
    const retryAfter = Math.ceil((1 - bucket.tokens) / RPS);
    logger.warn('Rate limited', { ip, retryAfter });
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({ error: 'Rate limited', retry_after: retryAfter });
  }

  bucket.tokens -= 1;
  if (next) next();
}

// Cleanup old buckets every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - 300000;
  for (const [ip, bucket] of buckets) {
    if (bucket.lastRefill < cutoff) buckets.delete(ip);
  }
}, 300000);

module.exports = { middleware };

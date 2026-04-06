// server/lib/rate-limiter.cjs — Token Bucket Rate Limiter
// Per-IP rate limiting with speed profile support

const config = require('./config.cjs');
const { getProfile } = require('./speed-profiles.cjs');

let currentSpeed = config.MODEL_SPEED || 'medium';
let currentProfile = getProfile(currentSpeed);

let RPS = currentProfile.rateLimit;
let BURST = RPS * 2;

// Model-specific rate limits (stricter for blocking models)
const MODEL_LIMITS = {
  'zen-sonnet': { rps: 0.5, burst: 1 },  // Blocked — very slow
  'zen-opus':   { rps: 0.5, burst: 1 },  // Blocked — very slow
  'qwen3.6':    { rps: 1, burst: 2 },    // Strict limit
};

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

function updateFromSpeed() {
  const profile = getProfile(currentSpeed);
  RPS = profile.rateLimit;
  BURST = RPS * 2;
}

function setSpeed(speed) {
  currentSpeed = speed;
  currentProfile = getProfile(speed);
  updateFromSpeed();
}

function getSpeed() {
  return currentSpeed;
}

function middleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const model = req.body?.model || '';
  
  // Check model-specific limits
  const modelLimit = MODEL_LIMITS[model] || MODEL_LIMITS[model.split('/')[0]];
  
  const effectiveRPS = modelLimit ? modelLimit.rps : RPS;
  const effectiveBurst = modelLimit ? modelLimit.burst : BURST;
  
  const bucket = getBucket(ip);
  bucket.tokens = Math.min(effectiveBurst, bucket.tokens + (effectiveRPS * ((Date.now() - bucket.lastRefill) / 1000)));
  bucket.lastRefill = Date.now();

  if (bucket.tokens < 1) {
    const retryAfter = Math.ceil((1 - bucket.tokens) / effectiveRPS);
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({ 
      error: 'Rate limited', 
      retry_after: retryAfter,
      model: model,
      rps: effectiveRPS,
    });
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

module.exports = { middleware, setSpeed, getSpeed, getCurrentProfile: () => currentProfile };

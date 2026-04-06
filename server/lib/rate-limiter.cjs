// server/lib/rate-limiter.cjs — Token Bucket Rate Limiter
// Per-IP rate limiting with speed profile support + per-model limits for free Claude

const config = require('./config.cjs');
const { getProfile, getClaudeLimits } = require('./speed-profiles.cjs');

let currentSpeed = config.MODEL_SPEED || 'medium';
let currentProfile = getProfile(currentSpeed);

let RPS = currentProfile.rateLimit;
let BURST = RPS * 2;

const buckets = new Map();
const claudeBuckets = new Map();

const FREE_CLAUDE_MODELS = {
  'kr/claude-sonnet-4.5': { rpm: 15, rph: 200, burst: 2 },
  'kr/claude-haiku-4.5': { rpm: 30, rph: 500, burst: 5 },
  'omni-sonnet': { rpm: 15, rph: 200, burst: 2 },
  'omni-haiku': { rpm: 30, rph: 500, burst: 5 },
};

const FREE_MODEL_LIMITS = {
  // OpenRouter free models - based on speed tests (2026-04-06)
  'qwen/qwen3.6-plus:free': { rpm: 30, rph: 500, burst: 5 },  // 6733ms - SLOW
  'or-qwen3.6': { rpm: 30, rph: 500, burst: 5 },              // 6733ms - SLOW
  'stepfun/step-3.5-flash:free': { rpm: 40, rph: 700, burst: 7 }, // 5234ms - MEDIUM
  'or-step-flash': { rpm: 40, rph: 700, burst: 7 },           // 5234ms - MEDIUM
  'nvidia/nemotron-nano-9b-v2:free': { rpm: 60, rph: 1000, burst: 10 }, // 2633ms - FAST
  'or-nemotron': { rpm: 60, rph: 1000, burst: 10 },           // 2633ms - FAST
};

function getBucket(ip) {
  if (!buckets.has(ip)) {
    buckets.set(ip, { tokens: BURST, lastRefill: Date.now() });
  }
  return buckets.get(ip);
}

function getClaudeBucket(ip, model) {
  const key = `${ip}:${model}`;
  if (!claudeBuckets.has(key)) {
    const limits = FREE_CLAUDE_MODELS[model] || { burst: 3, rpm: 15 };
    claudeBuckets.set(key, { tokens: limits.burst, lastRefill: Date.now(), rpm: limits.rpm, rph: limits.rph, hourlyCount: 0, lastHourlyReset: Date.now() });
  }
  return claudeBuckets.get(key);
}

function refill(bucket) {
  const now = Date.now();
  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(BURST, bucket.tokens + elapsed * RPS);
  bucket.lastRefill = now;
}

function refillClaudeBucket(bucket) {
  const now = Date.now();
  const elapsed = (now - bucket.lastRefill) / 1000;
  const refillRate = bucket.rpm / 60;
  bucket.tokens = Math.min(bucket.burst || 3, bucket.tokens + elapsed * refillRate);
  bucket.lastRefill = now;
  
  if (now - bucket.lastHourlyReset > 3600000) {
    bucket.hourlyCount = 0;
    bucket.lastHourlyReset = now;
  }
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

function checkFreeModelLimit(model) {
  const limits = FREE_MODEL_LIMITS[model];
  if (!limits) return { allowed: true };
  return { allowed: true, rpm: limits.rpm, rph: limits.rph };
}

function checkClaudeLimit(model) {
  const limits = FREE_CLAUDE_MODELS[model];
  if (!limits) return { allowed: true };
  return { allowed: true, rpm: limits.rpm, rph: limits.rph };
}

function claudeMiddleware(req, res, next) {
  const model = req.body?.model || 'unknown';
  const limits = FREE_CLAUDE_MODELS[model];
  
  if (!limits) {
    return next ? next() : null;
  }
  
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const bucket = getClaudeBucket(ip, model);
  refillClaudeBucket(bucket);
  
  if (bucket.hourlyCount >= bucket.rph) {
    const retryAfter = Math.ceil((3600000 - (Date.now() - bucket.lastHourlyReset)) / 1000);
    res.set('Retry-After', String(Math.max(retryAfter, 60)));
    return res.status(429).json({ 
      error: 'Claude hourly limit exceeded', 
      model,
      retry_after: retryAfter,
      limit: bucket.rph,
    });
  }
  
  if (bucket.tokens < 1) {
    const retryAfter = Math.ceil((1 - bucket.tokens) / (bucket.rpm / 60));
    res.set('Retry-After', String(Math.max(retryAfter, 1)));
    return res.status(429).json({ 
      error: 'Claude rate limited', 
      model,
      retry_after: retryAfter,
      rpm: bucket.rpm,
    });
  }
  
  bucket.tokens -= 1;
  bucket.hourlyCount++;
  if (next) next();
}

function middleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const bucket = getBucket(ip);
  refill(bucket);

  if (bucket.tokens < 1) {
    const retryAfter = Math.ceil((1 - bucket.tokens) / RPS);
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({ 
      error: 'Rate limited', 
      retry_after: retryAfter,
      speed: currentSpeed,
      rps: RPS,
    });
  }

  bucket.tokens -= 1;
  if (next) next();
}

function getClaudeStats() {
  return {
    claudeModels: Object.keys(FREE_CLAUDE_MODELS),
    claudeLimits: FREE_CLAUDE_MODELS,
    freeModels: Object.keys(FREE_MODEL_LIMITS),
    freeLimits: FREE_MODEL_LIMITS,
  };
}

// Cleanup old buckets every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - 300000;
  for (const [ip, bucket] of buckets) {
    if (bucket.lastRefill < cutoff) buckets.delete(ip);
  }
  for (const [key, bucket] of claudeBuckets) {
    if (bucket.lastRefill < cutoff) claudeBuckets.delete(key);
  }
}, 300000);

module.exports = { middleware, claudeMiddleware, setSpeed, getSpeed, getCurrentProfile: () => currentProfile, getClaudeStats, checkClaudeLimit, checkFreeModelLimit };

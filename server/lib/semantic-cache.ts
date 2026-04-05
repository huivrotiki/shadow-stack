import crypto from 'crypto';

const cache = new Map<string, { result: string; ts: number }>();
const TTL = 60 * 60 * 1000; // 1 hour

function hash(p: string) {
  return crypto.createHash('md5').update(p.trim().toLowerCase()).digest('hex');
}

export function getCached(p: string): string | null {
  const e = cache.get(hash(p));
  if (!e || Date.now() - e.ts > TTL) return null;
  console.log('[CACHE] ✅ HIT — zero tokens used');
  return e.result;
}

export function setCached(p: string, r: string) {
  cache.set(hash(p), { result: r, ts: Date.now() });
}

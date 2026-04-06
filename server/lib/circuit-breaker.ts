const circuits = new Map<string, { failures: number; openUntil: number }>();

export function isOpen(name: string): boolean {
  const s = circuits.get(name);
  if (!s) return false;
  if (s.openUntil > Date.now()) {
    console.warn(`[CB] 🔴 ${name} — cooldown active`);
    return true;
  }
  circuits.delete(name);
  return false;
}

export function recordFailure(name: string) {
  const s = circuits.get(name) ?? { failures: 0, openUntil: 0 };
  s.failures++;
  if (s.failures >= 3) s.openUntil = Date.now() + 5 * 60 * 1000;
  circuits.set(name, s);
}

export function recordSuccess(name: string) {
  circuits.delete(name);
}

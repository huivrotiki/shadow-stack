let idx = 0;

export function getNextGeminiKey(): string {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ].filter(Boolean) as string[];
  if (!keys.length) throw new Error('No GEMINI_API_KEY configured');
  return keys[idx++ % keys.length];
}

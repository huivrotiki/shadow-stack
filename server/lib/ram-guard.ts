export async function checkRAM(): Promise<{ free_mb: number; safe_mode: boolean }> {
  try {
    const res = await fetch('http://localhost:3001/ram');
    const data = await res.json() as { free_mb: number };
    return { free_mb: data.free_mb, safe_mode: data.free_mb < 300 };
  } catch {
    return { free_mb: 200, safe_mode: true }; // M1 8GB: safe default
  }
}

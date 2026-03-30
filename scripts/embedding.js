/**
 * embedding.js — Ollama nomic-embed-text embeddings
 * 
 * CRITICAL: After generating embedding, immediately unloads model
 * from VRAM via keep_alive:0 to protect Mac mini M1 8GB RAM.
 * 
 * @module scripts/embedding
 */

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const EMBED_MODEL = 'nomic-embed-text';

/**
 * Generate embedding vector for given text using Ollama nomic-embed-text.
 * Automatically unloads model from VRAM after use to save memory.
 * 
 * @param {string} text - Text to embed (max ~8K tokens for nomic-embed-text)
 * @returns {Promise<number[]>} Embedding vector (768 dimensions)
 * @throws {Error} If Ollama is unreachable or model not available
 */
export async function generateEmbedding(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('generateEmbedding: text must be a non-empty string');
  }

  // Truncate to safe limit (~2000 words ≈ ~8000 chars)
  const truncated = text.slice(0, 8000);

  const t0 = Date.now();

  try {
    // 1. Generate embedding
    const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: EMBED_MODEL,
        prompt: truncated,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Ollama embeddings returned ${res.status}: ${err.slice(0, 200)}`);
    }

    const data = await res.json();

    if (!data.embedding || !Array.isArray(data.embedding)) {
      throw new Error('Ollama returned no embedding array');
    }

    const latency = Date.now() - t0;
    console.log(`[embedding] Generated ${data.embedding.length}d vector in ${latency}ms`);

    return data.embedding;
  } finally {
    // 2. CRITICAL: Unload model from VRAM immediately
    // This prevents nomic-embed-text from occupying GPU memory
    // between embedding calls on memory-constrained Mac mini M1
    try {
      await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: EMBED_MODEL,
          prompt: '',
          keep_alive: 0,
        }),
        signal: AbortSignal.timeout(5000),
      });
      console.log(`[embedding] Model ${EMBED_MODEL} unloaded from VRAM`);
    } catch (e) {
      // Non-critical — model will auto-unload eventually
      console.warn(`[embedding] Failed to unload ${EMBED_MODEL}: ${e.message}`);
    }
  }
}

/**
 * Generate embeddings for multiple texts sequentially.
 * Uses for...of (NOT Promise.all) to avoid RAM spikes on M1.
 * 
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<number[][]>} Array of embedding vectors
 */
export async function generateEmbeddings(texts) {
  const results = [];
  for (const text of texts) {
    const embedding = await generateEmbedding(text);
    results.push(embedding);
  }
  return results;
}

/**
 * Check if the embedding model is available in Ollama.
 * 
 * @returns {Promise<boolean>}
 */
export async function isEmbeddingModelAvailable() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return (data.models || []).some(m => m.name.includes(EMBED_MODEL));
  } catch {
    return false;
  }
}

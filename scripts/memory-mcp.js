/**
 * memory-mcp.js — RAG Memory Layer for Shadow Stack
 * 
 * Combines Ollama embeddings (nomic-embed-text) with ChromaDB
 * for persistent, searchable memory across agent sessions.
 * 
 * All operations are sequential (for...of, NOT Promise.all)
 * to respect Mac mini M1 8GB RAM constraints.
 * 
 * @module scripts/memory-mcp
 */

import { generateEmbedding } from './embedding.js';
import {
  isChromaAvailable,
  ensureCollection,
  addDocuments,
  queryDocuments,
  getCollectionStats,
} from './chroma.js';

/**
 * Split text into overlapping chunks for embedding.
 * 
 * @param {string} text - Input text
 * @param {number} size - Chunk size in characters (default 500)
 * @param {number} overlap - Overlap between chunks (default 50)
 * @returns {string[]} Array of text chunks
 */
export function chunkText(text, size = 500, overlap = 50) {
  if (!text || text.length <= size) return [text].filter(Boolean);

  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + size;

    // Try to break at sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > start + size * 0.5) {
        end = breakPoint + 1;
      }
    }

    const chunk = text.slice(start, Math.min(end, text.length)).trim();
    if (chunk.length > 20) {
      chunks.push(chunk);
    }

    start = end - overlap;
    if (start >= text.length) break;
  }

  return chunks;
}

/**
 * Store text in memory with embedding.
 * Chunks text, generates embeddings sequentially, stores in ChromaDB.
 * 
 * @param {string} text - Text to store
 * @param {object} metadata - Metadata (source, type, tags, etc.)
 * @returns {Promise<{stored: number, collection: string} | null>} Result or null if ChromaDB unavailable
 */
export async function smartStore(text, metadata = {}) {
  // Graceful fallback if ChromaDB is not running
  if (!(await isChromaAvailable())) {
    console.warn('[memory] ChromaDB unavailable — skipping store');
    return null;
  }

  await ensureCollection();

  const chunks = chunkText(text);
  const timestamp = Date.now();
  const baseId = `${metadata.source || 'mem'}-${timestamp}`;

  const ids = [];
  const embeddings = [];
  const documents = [];
  const metadatas = [];

  // Sequential embedding — NEVER Promise.all on M1 8GB
  for (const [i, chunk] of chunks.entries()) {
    try {
      const embedding = await generateEmbedding(chunk);
      ids.push(`${baseId}-${i}`);
      embeddings.push(embedding);
      documents.push(chunk);
      metadatas.push({
        ...metadata,
        chunk_index: i,
        total_chunks: chunks.length,
        stored_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn(`[memory] Failed to embed chunk ${i}: ${e.message}`);
      // Continue with remaining chunks
    }
  }

  if (ids.length === 0) {
    console.warn('[memory] No chunks were embedded successfully');
    return null;
  }

  await addDocuments(ids, embeddings, documents, metadatas);

  console.log(`[memory] Stored ${ids.length}/${chunks.length} chunks from "${metadata.source || 'unknown'}"`);
  return { stored: ids.length, collection: 'shadow-stack-memory' };
}

/**
 * Retrieve relevant context from memory.
 * 
 * @param {string} query - Search query
 * @param {number} k - Number of results (default 3)
 * @returns {Promise<Array<{text: string, score: number, metadata: object}> | null>}
 */
export async function smartRetrieve(query, k = 3) {
  // Graceful fallback
  if (!(await isChromaAvailable())) {
    console.warn('[memory] ChromaDB unavailable — returning empty results');
    return null;
  }

  try {
    await ensureCollection();
    const embedding = await generateEmbedding(query);
    const results = await queryDocuments(embedding, k);

    if (!results?.documents?.[0]) return [];

    return results.documents[0].map((doc, i) => ({
      text: doc,
      score: results.distances?.[0]?.[i] ?? 0,
      metadata: results.metadatas?.[0]?.[i] || {},
    }));
  } catch (e) {
    console.warn(`[memory] Retrieve failed: ${e.message}`);
    return null;
  }
}

/**
 * Inject relevant memory context into a prompt.
 * Prepends retrieved context or returns original prompt if ChromaDB is down.
 * 
 * @param {string} prompt - Original prompt
 * @param {number} maxContext - Max characters of context to inject (default 1500)
 * @returns {Promise<string>} Enhanced prompt with context or original prompt
 */
export async function injectMemory(prompt, maxContext = 1500) {
  try {
    const results = await smartRetrieve(prompt, 3);

    if (!results || results.length === 0) {
      return prompt;
    }

    // Build context block from results
    let context = '';
    for (const r of results) {
      if (context.length + r.text.length > maxContext) break;
      context += r.text + '\n---\n';
    }

    if (!context) return prompt;

    return `[CONTEXT from memory]\n${context.trim()}\n[END CONTEXT]\n\n${prompt}`;
  } catch (e) {
    // Graceful fallback — never break the prompt pipeline
    console.warn(`[memory] injectMemory fallback: ${e.message}`);
    return prompt;
  }
}

/**
 * Get memory stats.
 * 
 * @returns {Promise<object | null>}
 */
export async function getMemoryStats() {
  if (!(await isChromaAvailable())) return null;

  try {
    return await getCollectionStats();
  } catch {
    return null;
  }
}

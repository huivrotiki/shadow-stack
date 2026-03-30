/**
 * chroma.js — ChromaDB REST client (no npm packages)
 * 
 * Pure fetch-based client for ChromaDB at localhost:8000.
 * Used for RAG memory layer in Shadow Stack.
 * 
 * @module scripts/chroma
 */

const CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8000';
const COLLECTION_NAME = process.env.CHROMA_COLLECTION || 'shadow-stack-memory';

/**
 * Make a request to ChromaDB API.
 * @param {string} path - API path
 * @param {string} method - HTTP method
 * @param {object|null} body - Request body
 * @returns {Promise<any>} Parsed JSON response
 */
async function chromaFetch(path, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10000),
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${CHROMA_URL}${path}`, options);

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`ChromaDB ${method} ${path} returned ${res.status}: ${errText.slice(0, 300)}`);
  }

  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Check if ChromaDB is reachable.
 * @returns {Promise<boolean>}
 */
export async function isChromaAvailable() {
  try {
    await chromaFetch('/api/v1/heartbeat');
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure the collection exists, create if not.
 * @returns {Promise<object>} Collection metadata
 */
export async function ensureCollection() {
  try {
    // Try to get existing collection
    const collections = await chromaFetch('/api/v1/collections');
    const existing = collections.find(c => c.name === COLLECTION_NAME);

    if (existing) {
      console.log(`[chroma] Collection "${COLLECTION_NAME}" exists (id: ${existing.id})`);
      return existing;
    }
  } catch (e) {
    console.warn(`[chroma] Failed to list collections: ${e.message}`);
  }

  // Create new collection
  const collection = await chromaFetch('/api/v1/collections', 'POST', {
    name: COLLECTION_NAME,
    metadata: {
      'hnsw:space': 'cosine',
      description: 'Shadow Stack RAG memory',
      created: new Date().toISOString(),
    },
  });

  console.log(`[chroma] Created collection "${COLLECTION_NAME}" (id: ${collection.id})`);
  return collection;
}

/**
 * Get collection ID by name.
 * @returns {Promise<string>} Collection UUID
 */
async function getCollectionId() {
  const collections = await chromaFetch('/api/v1/collections');
  const collection = collections.find(c => c.name === COLLECTION_NAME);
  if (!collection) {
    throw new Error(`Collection "${COLLECTION_NAME}" not found. Run ensureCollection() first.`);
  }
  return collection.id;
}

/**
 * Add documents to the collection.
 * 
 * @param {string[]} ids - Unique document IDs
 * @param {number[][]} embeddings - Embedding vectors
 * @param {string[]} documents - Document texts
 * @param {object[]} metadatas - Metadata for each document
 * @returns {Promise<void>}
 */
export async function addDocuments(ids, embeddings, documents, metadatas) {
  if (!ids.length) return;

  const collectionId = await getCollectionId();

  await chromaFetch(`/api/v1/collections/${collectionId}/add`, 'POST', {
    ids,
    embeddings,
    documents,
    metadatas: metadatas || ids.map(() => ({})),
  });

  console.log(`[chroma] Added ${ids.length} documents to "${COLLECTION_NAME}"`);
}

/**
 * Query documents by embedding similarity.
 * 
 * @param {number[]} embedding - Query embedding vector
 * @param {number} nResults - Number of results to return
 * @param {object|null} where - Optional metadata filter
 * @returns {Promise<{ids: string[][], documents: string[][], distances: number[][], metadatas: object[][]}>}
 */
export async function queryDocuments(embedding, nResults = 3, where = null) {
  const collectionId = await getCollectionId();

  const body = {
    query_embeddings: [embedding],
    n_results: nResults,
    include: ['documents', 'metadatas', 'distances'],
  };

  if (where) {
    body.where = where;
  }

  const results = await chromaFetch(`/api/v1/collections/${collectionId}/query`, 'POST', body);
  return results;
}

/**
 * Delete documents by IDs.
 * 
 * @param {string[]} ids - Document IDs to delete
 * @returns {Promise<void>}
 */
export async function deleteDocuments(ids) {
  if (!ids.length) return;
  const collectionId = await getCollectionId();
  await chromaFetch(`/api/v1/collections/${collectionId}/delete`, 'POST', { ids });
  console.log(`[chroma] Deleted ${ids.length} documents`);
}

/**
 * Get collection stats (document count).
 * 
 * @returns {Promise<{count: number, name: string}>}
 */
export async function getCollectionStats() {
  const collectionId = await getCollectionId();
  const count = await chromaFetch(`/api/v1/collections/${collectionId}/count`);
  return { count, name: COLLECTION_NAME };
}

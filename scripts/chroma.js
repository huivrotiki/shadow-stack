/**
 * chroma.js — ChromaDB REST client (v1 + v2 compatible)
 *
 * Auto-detects v1 vs v2 API. v2 uses tenant/database path prefix.
 *
 * @module scripts/chroma
 */

const CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8000';
const COLLECTION_NAME = process.env.CHROMA_COLLECTION || 'shadow-stack-memory';
const TENANT = process.env.CHROMA_TENANT || 'default_tenant';
const DATABASE = process.env.CHROMA_DATABASE || 'default_database';

let _apiVersion = null; // 'v1' | 'v2'

async function detectApiVersion() {
  if (_apiVersion) return _apiVersion;
  try {
    const res = await fetch(`${CHROMA_URL}/api/v2/heartbeat`, {
      signal: AbortSignal.timeout(3000),
    });
    _apiVersion = res.ok ? 'v2' : 'v1';
  } catch {
    _apiVersion = 'v1';
  }
  return _apiVersion;
}

function collectionsBase(version) {
  return version === 'v2'
    ? `/api/v2/tenants/${TENANT}/databases/${DATABASE}/collections`
    : '/api/v1/collections';
}

async function chromaFetch(path, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10000),
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${CHROMA_URL}${path}`, options);
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`ChromaDB ${method} ${path} → ${res.status}: ${errText.slice(0, 300)}`);
  }
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

export async function isChromaAvailable() {
  try {
    const v = await detectApiVersion();
    await chromaFetch(v === 'v2' ? '/api/v2/heartbeat' : '/api/v1/heartbeat');
    return true;
  } catch {
    return false;
  }
}

export async function ensureCollection() {
  const v = await detectApiVersion();
  const base = collectionsBase(v);

  // v2: ensure tenant + database exist first
  if (v === 'v2') {
    await chromaFetch(`/api/v2/tenants/${TENANT}`, 'GET').catch(async () => {
      await chromaFetch('/api/v2/tenants', 'POST', { name: TENANT });
    });
    await chromaFetch(`/api/v2/tenants/${TENANT}/databases/${DATABASE}`, 'GET').catch(async () => {
      await chromaFetch(`/api/v2/tenants/${TENANT}/databases`, 'POST', { name: DATABASE });
    });
  }

  const collections = await chromaFetch(base);
  const existing = (Array.isArray(collections) ? collections : collections?.collections || [])
    .find(c => c.name === COLLECTION_NAME);

  if (existing) {
    console.log(`[chroma] Collection "${COLLECTION_NAME}" exists (id: ${existing.id})`);
    return existing;
  }

  const body = v === 'v2'
    ? { name: COLLECTION_NAME, configuration: { hnsw: { space: 'cosine' } } }
    : { name: COLLECTION_NAME, metadata: { 'hnsw:space': 'cosine' } };

  const collection = await chromaFetch(base, 'POST', body);
  console.log(`[chroma] Created collection "${COLLECTION_NAME}" (id: ${collection.id})`);
  return collection;
}

async function getCollectionId() {
  const v = await detectApiVersion();
  const base = collectionsBase(v);
  const collections = await chromaFetch(base);
  const list = Array.isArray(collections) ? collections : collections?.collections || [];
  const collection = list.find(c => c.name === COLLECTION_NAME);
  if (!collection) throw new Error(`Collection "${COLLECTION_NAME}" not found. Run ensureCollection() first.`);
  return collection.id;
}

export async function addDocuments(ids, embeddings, documents, metadatas) {
  if (!ids.length) return;
  const v = await detectApiVersion();
  const collectionId = await getCollectionId();
  const path = `${collectionsBase(v)}/${collectionId}/add`;
  await chromaFetch(path, 'POST', {
    ids,
    embeddings,
    documents,
    metadatas: metadatas || ids.map(() => ({})),
  });
  console.log(`[chroma] Added ${ids.length} documents to "${COLLECTION_NAME}"`);
}

export async function queryDocuments(embedding, nResults = 3, where = null) {
  const v = await detectApiVersion();
  const collectionId = await getCollectionId();
  const path = `${collectionsBase(v)}/${collectionId}/query`;
  const body = {
    query_embeddings: [embedding],
    n_results: nResults,
    include: ['documents', 'metadatas', 'distances'],
  };
  if (where) body.where = where;
  return chromaFetch(path, 'POST', body);
}

export async function deleteDocuments(ids) {
  if (!ids.length) return;
  const v = await detectApiVersion();
  const collectionId = await getCollectionId();
  await chromaFetch(`${collectionsBase(v)}/${collectionId}/delete`, 'POST', { ids });
  console.log(`[chroma] Deleted ${ids.length} documents`);
}

export async function getCollectionStats() {
  const v = await detectApiVersion();
  const collectionId = await getCollectionId();
  const count = await chromaFetch(`${collectionsBase(v)}/${collectionId}/count`);
  return { count, name: COLLECTION_NAME };
}

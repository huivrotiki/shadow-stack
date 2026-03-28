#!/usr/bin/env python3
"""
index_knowledge.py — Векторизация базы знаний Shadow Stack
Использует ChromaDB PersistentClient (на диск, без сервера) + Ollama nomic-embed-text.

Запускать ТОЛЬКО когда нужно обновить базу знаний:
  source .venv/bin/activate && python scripts/index_knowledge.py

КРИТИЧНО: После завершения модель автоматически выгружается из VRAM (keep_alive:0)
"""

import os
import sys
import json
import time
import requests

try:
    import chromadb
except ImportError:
    print("❌ chromadb не установлен. Запустите:")
    print("   .venv/bin/pip install chromadb requests")
    sys.exit(1)

# ─── CONFIG ───────────────────────────────────────────────────────────────────
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "memory", "shadow_memory")
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
EMBED_MODEL = "nomic-embed-text"
CHUNK_SIZE = 500
PROJECT_ROOT = os.path.join(os.path.dirname(__file__), "..")

# Файлы для индексации (только документация и конфиги, не код)
INCLUDE_EXTENSIONS = {".md", ".txt", ".json", ".toml", ".yaml", ".yml"}
EXCLUDE_DIRS = {
    "node_modules", ".git", ".venv", "__pycache__", "memory",
    "dist", "build", ".next", ".cache", "coverage",
    "health-dashboard-v5", "shadow-stack-widget-1",
}
MAX_FILE_SIZE = 50_000  # 50KB max per file


# ─── EMBEDDING ────────────────────────────────────────────────────────────────
def get_embedding(text: str) -> list[float] | None:
    """Get embedding from Ollama nomic-embed-text."""
    try:
        res = requests.post(
            f"{OLLAMA_URL}/api/embeddings",
            json={"model": EMBED_MODEL, "prompt": text[:2000]},  # Limit to ~2000 chars
            timeout=30,
        )
        if res.status_code == 200:
            return res.json().get("embedding")
        print(f"  ⚠️  Ollama returned {res.status_code}")
        return None
    except Exception as e:
        print(f"  ❌ Embedding error: {e}")
        return None


def unload_model():
    """Unload nomic-embed-text from VRAM (keep_alive:0)."""
    try:
        requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={"model": EMBED_MODEL, "prompt": "", "keep_alive": 0},
            timeout=5,
        )
        print(f"🧹 Model {EMBED_MODEL} unloaded from VRAM")
    except:
        pass


# ─── CHUNKING ─────────────────────────────────────────────────────────────────
def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = 50) -> list[str]:
    """Split text into overlapping chunks."""
    if len(text) <= size:
        return [text] if text.strip() else []
    
    chunks = []
    start = 0
    while start < len(text):
        end = start + size
        # Try to break at paragraph or sentence boundary
        if end < len(text):
            for sep in ["\n\n", "\n", ". ", "! ", "? "]:
                last = text.rfind(sep, start + size // 2, end)
                if last > start:
                    end = last + len(sep)
                    break
        
        chunk = text[start:end].strip()
        if len(chunk) > 20:
            chunks.append(chunk)
        
        start = end - overlap
        if start >= len(text):
            break
    
    return chunks


# ─── MAIN ─────────────────────────────────────────────────────────────────────
def main():
    # Ensure memory directory exists
    os.makedirs(DB_PATH, exist_ok=True)
    
    # Check Ollama
    try:
        r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=3)
        models = [m["name"] for m in r.json().get("models", [])]
        if not any(EMBED_MODEL in m for m in models):
            print(f"❌ Model {EMBED_MODEL} not found. Run: ollama pull {EMBED_MODEL}")
            sys.exit(1)
    except:
        print(f"❌ Ollama not reachable at {OLLAMA_URL}")
        sys.exit(1)
    
    # Init ChromaDB PersistentClient (disk-based, no server!)
    chroma_client = chromadb.PersistentClient(path=DB_PATH)
    collection = chroma_client.get_or_create_collection(
        name="project_knowledge",
        metadata={"hnsw:space": "cosine"},
    )
    
    existing_count = collection.count()
    print(f"🧠 Shadow Stack Knowledge Indexer")
    print(f"   DB path: {DB_PATH}")
    print(f"   Existing docs: {existing_count}")
    print(f"   Model: {EMBED_MODEL}")
    print()
    
    # Scan project files
    doc_id = existing_count
    indexed = 0
    skipped = 0
    errors = 0
    
    print("📂 Scanning project files...")
    for root, dirs, files in os.walk(PROJECT_ROOT):
        # Skip excluded directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]
        
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext not in INCLUDE_EXTENSIONS:
                continue
            
            filepath = os.path.join(root, file)
            relpath = os.path.relpath(filepath, PROJECT_ROOT)
            
            # Skip large files
            if os.path.getsize(filepath) > MAX_FILE_SIZE:
                print(f"  ⏭️  {relpath} (too large)")
                skipped += 1
                continue
            
            try:
                with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                
                if not content.strip():
                    continue
                
                # Chunk the content
                chunks = chunk_text(content)
                
                for i, chunk in enumerate(chunks):
                    embedding = get_embedding(chunk)
                    if embedding:
                        chunk_id = f"{relpath}:{i}"
                        collection.upsert(
                            ids=[chunk_id],
                            embeddings=[embedding],
                            documents=[chunk],
                            metadatas=[{
                                "source": relpath,
                                "chunk": i,
                                "total_chunks": len(chunks),
                                "indexed_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
                            }],
                        )
                        doc_id += 1
                    else:
                        errors += 1
                
                indexed += 1
                print(f"  ✅ {relpath} ({len(chunks)} chunks)")
                
            except Exception as e:
                print(f"  ❌ {relpath}: {e}")
                errors += 1
    
    # Unload model from VRAM
    unload_model()
    
    final_count = collection.count()
    print()
    print(f"═══════════════════════════════════════")
    print(f"  Indexing Complete")
    print(f"  Files indexed: {indexed}")
    print(f"  Chunks in DB:  {final_count}")
    print(f"  Skipped:       {skipped}")
    print(f"  Errors:        {errors}")
    print(f"═══════════════════════════════════════")


if __name__ == "__main__":
    main()

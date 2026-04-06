#!/usr/bin/env python3
"""
notebooklm-query.py — NotebookLM pre-step retrieval for Agent Factory
Primary: notebooklm-py via NotebookLMClient.from_storage()
Fallback: MemoryLayer keyword search (gateway-memory.json)

Usage:
  python3 scripts/notebooklm-query.py \
    --query "What prior decisions are relevant to portable state layer?" \
    --step-id "1" \
    --limit 3 \
    --output ".agent/context/step-1-nlm.json"
"""

import argparse
import asyncio
import json
import os
from pathlib import Path

NOTEBOOK_ID = os.getenv("NOTEBOOKLM_ID", "489988c4-0293-44f4-b7c7-ea1f86a08410")
MEMORY_FILE = Path("data/gateway-memory.json")


def fallback_memory(query: str, limit: int = 3) -> dict:
    """Keyword-based retrieval from gateway-memory.json"""
    if not MEMORY_FILE.exists():
        return {
            "query": query,
            "sources": [],
            "key_facts": [],
            "relevant_decisions": [],
            "recommended_files": [],
            "warnings": ["memory file missing"],
            "fallback": "empty",
        }

    try:
        data = json.loads(MEMORY_FILE.read_text())
    except Exception as e:
        return {
            "query": query,
            "sources": [],
            "key_facts": [],
            "relevant_decisions": [],
            "recommended_files": [],
            "warnings": [f"memory parse error: {str(e)}"],
            "fallback": "empty",
        }

    keywords = [w for w in query.lower().split() if len(w) > 3]

    conversations = data.get("conversations", [])
    scored = []
    for conv in conversations:
        text = json.dumps(conv, ensure_ascii=False).lower()
        score = sum(1 for kw in keywords if kw in text)
        if score > 0:
            scored.append((score, conv))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = [x[1] for x in scored[:limit]]

    decisions = data.get("decisions", [])[-3:]

    return {
        "query": query,
        "sources": top,
        "key_facts": [x.get("result") for x in top if x.get("result")],
        "relevant_decisions": decisions,
        "recommended_files": [],
        "warnings": ["NotebookLM unavailable; memory fallback used"],
        "fallback": "memory_layer",
    }


async def ask_notebook(query: str, limit: int) -> dict:
    """Primary: notebooklm-py. Fallback: MemoryLayer."""
    try:
        from notebooklm import NotebookLMClient

        async with await NotebookLMClient.from_storage() as client:
            result = await client.chat.ask(NOTEBOOK_ID, query)
            answer = getattr(result, "answer", "") or ""
            citations = getattr(result, "citations", []) or []
            return {
                "query": query,
                "sources": citations[:limit],
                "key_facts": [answer] if answer else [],
                "relevant_decisions": [],
                "recommended_files": [],
                "warnings": [],
                "fallback": None,
            }
    except Exception as e:
        print(f"[notebooklm] Primary failed: {e}, using memory fallback")
        return fallback_memory(query, limit)


async def main():
    parser = argparse.ArgumentParser(description="NotebookLM pre-step query")
    parser.add_argument("--query", required=True, help="Task instruction to query")
    parser.add_argument("--output", required=True, help="Output JSON path")
    parser.add_argument("--limit", type=int, default=3, help="Max sources")
    parser.add_argument("--step-id", default="0", help="Step identifier")
    args = parser.parse_args()

    result = await ask_notebook(args.query, args.limit)
    result["step_id"] = args.step_id

    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2))

    status = "ok" if result["fallback"] is None else "fallback"
    sources = len(result.get("sources", []))
    print(
        f"[notebooklm] step={args.step_id} status={status} sources={sources} output={out}"
    )


if __name__ == "__main__":
    asyncio.run(main())

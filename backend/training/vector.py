"""
Vector store for training pair retrieval.
Embeds the question text and uses ChromaDB for similarity search.
"""
from __future__ import annotations
from pathlib import Path

import chromadb
from chromadb.utils import embedding_functions

from config import settings

_COLLECTION = "training_pairs"

_chroma: chromadb.ClientAPI | None = None
_collection: chromadb.Collection | None = None


def _get_ef():
    if settings.embedding_backend == "anthropic":
        # Anthropic doesn't yet expose a direct embedding endpoint in the same way;
        # fall back to sentence-transformers.
        pass
    return embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name=settings.st_model_name
    )


def _get_collection() -> chromadb.Collection:
    global _chroma, _collection
    if _collection is None:
        Path(settings.chroma_path).mkdir(parents=True, exist_ok=True)
        _chroma = chromadb.PersistentClient(path=settings.chroma_path)
        _collection = _chroma.get_or_create_collection(
            name=_COLLECTION,
            embedding_function=_get_ef(),
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def upsert(pair_id: str, question: str) -> None:
    col = _get_collection()
    col.upsert(ids=[pair_id], documents=[question])


def delete(pair_id: str) -> None:
    col = _get_collection()
    try:
        col.delete(ids=[pair_id])
    except Exception:
        pass


def search(question: str, n: int = 3) -> list[str]:
    """Return list of matching pair IDs ordered by similarity."""
    col = _get_collection()
    count = col.count()
    if count == 0:
        return []
    results = col.query(
        query_texts=[question],
        n_results=min(n, count),
        include=["distances"],
    )
    ids = results.get("ids", [[]])[0]
    return list(ids)

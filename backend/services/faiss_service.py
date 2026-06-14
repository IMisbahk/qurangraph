"""
FAISS index service for nearest-neighbor search.
"""
import logging
import numpy as np
import faiss
from typing import Optional
from backend.app.config import FAISS_INDEX_PATH, VERSES_JSON_PATH
import json

logger = logging.getLogger(__name__)

_index: Optional[faiss.Index] = None
_verse_ids: Optional[list[str]] = None


def load_index() -> None:
    """Load FAISS index and verse ID mapping into memory."""
    global _index, _verse_ids
    if not FAISS_INDEX_PATH.exists():
        logger.warning(f"FAISS index not found at {FAISS_INDEX_PATH}")
        return
    _index = faiss.read_index(str(FAISS_INDEX_PATH))
    logger.info(f"FAISS index loaded: {_index.ntotal} vectors")

    if VERSES_JSON_PATH.exists():
        with open(VERSES_JSON_PATH, "r", encoding="utf-8") as f:
            verses = json.load(f)
        _verse_ids = [v["verse_id"] for v in verses]
        logger.info(f"Loaded {len(_verse_ids)} verse IDs")


def search(query_vector: np.ndarray, top_k: int = 10) -> list[tuple[str, float]]:
    """
    Search the FAISS index for the nearest neighbors.
    Returns list of (verse_id, similarity_score) tuples.
    """
    if _index is None or _verse_ids is None:
        logger.error("FAISS index not loaded. Call load_index() first.")
        return []

    vec = query_vector.astype(np.float32).reshape(1, -1)
    # Normalize for cosine similarity (index uses inner product on normalized vectors)
    faiss.normalize_L2(vec)

    distances, indices = _index.search(vec, top_k + 1)

    results = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx < 0 or idx >= len(_verse_ids):
            continue
        results.append((_verse_ids[idx], float(dist)))

    return results


def search_by_verse_id(verse_id: str, top_k: int = 10) -> list[tuple[str, float]]:
    """
    Search for similar verses given a verse_id.
    Excludes the query verse itself.
    """
    if _verse_ids is None:
        return []
    if verse_id not in _verse_ids:
        return []
    idx = _verse_ids.index(verse_id)
    # Reconstruct vector from index
    vec = np.zeros((1, _index.d), dtype=np.float32)
    _index.reconstruct(idx, vec[0])

    distances, indices = _index.search(vec, top_k + 2)
    results = []
    for dist, i in zip(distances[0], indices[0]):
        if i < 0 or i >= len(_verse_ids):
            continue
        vid = _verse_ids[i]
        if vid == verse_id:
            continue
        results.append((vid, float(dist)))
        if len(results) >= top_k:
            break
    return results


def get_index() -> Optional[faiss.Index]:
    return _index


def get_verse_ids() -> Optional[list[str]]:
    return _verse_ids

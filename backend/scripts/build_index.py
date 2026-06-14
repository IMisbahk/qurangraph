#!/usr/bin/env python3
"""
build_index.py
==============
Build a FAISS index from pre-generated verse embeddings.

Features:
- L2-normalizes all vectors for cosine similarity via inner product
- Uses IndexFlatIP (exact cosine similarity, no approximation error)
- Persists index to disk for fast API loading
- Verifies index by running a sample search

Usage:
    python -m backend.scripts.build_index
    # or:
    python backend/scripts/build_index.py
"""
import sys
import logging
from pathlib import Path

import numpy as np
import faiss

PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.config import EMBEDDINGS_PATH, VERSES_JSON_PATH, FAISS_INDEX_PATH, DATA_DIR
import json

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)


def build_faiss_index() -> None:
    print("\n" + "=" * 60)
    print("  QuranGraph — FAISS Index Builder")
    print("=" * 60 + "\n")

    # Load embeddings
    if not EMBEDDINGS_PATH.exists():
        logger.error(f"Embeddings file not found: {EMBEDDINGS_PATH}")
        logger.error("Run generate_embeddings.py first.")
        sys.exit(1)

    logger.info(f"Loading embeddings from {EMBEDDINGS_PATH}")
    embeddings = np.load(EMBEDDINGS_PATH).astype(np.float32)
    logger.info(f"Loaded embeddings shape: {embeddings.shape}")

    # Load verse count
    if not VERSES_JSON_PATH.exists():
        logger.error(f"verses.json not found: {VERSES_JSON_PATH}")
        sys.exit(1)

    with open(VERSES_JSON_PATH, "r", encoding="utf-8") as f:
        verses = json.load(f)

    n_verses = len(verses)
    n_embeddings = embeddings.shape[0]

    if n_verses != n_embeddings:
        logger.warning(
            f"Verse count mismatch: {n_verses} verses vs {n_embeddings} embeddings. "
            f"Using min({n_verses}, {n_embeddings})."
        )
        n = min(n_verses, n_embeddings)
        embeddings = embeddings[:n]
        verses = verses[:n]

    dim = embeddings.shape[1]
    logger.info(f"Building FAISS index: {n_embeddings} vectors, dim={dim}")

    # L2 normalize for cosine similarity via inner product
    logger.info("Normalizing vectors for cosine similarity...")
    faiss.normalize_L2(embeddings)

    # Build IndexFlatIP (exact inner product = cosine similarity on normalized vectors)
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)

    logger.info(f"Index built: {index.ntotal} vectors indexed")

    # Verify with a sample search
    logger.info("Verifying index with sample search...")
    test_vec = embeddings[0:1].copy()
    faiss.normalize_L2(test_vec)
    distances, indices = index.search(test_vec, 5)
    logger.info(f"Sample search top-5 indices: {indices[0].tolist()}")
    logger.info(f"Sample search top-5 scores:  {[round(float(d), 4) for d in distances[0]]}")

    # Save index
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(FAISS_INDEX_PATH))
    logger.info(f"FAISS index saved to {FAISS_INDEX_PATH}")

    size_mb = FAISS_INDEX_PATH.stat().st_size / (1024 * 1024)
    print("\n" + "=" * 60)
    print("  FAISS Index Build Complete!")
    print("=" * 60)
    print(f"  Vectors indexed:  {index.ntotal}")
    print(f"  Embedding dim:    {dim}")
    print(f"  Index file:       {FAISS_INDEX_PATH}")
    print(f"  Index size:       {size_mb:.1f} MB")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    build_faiss_index()

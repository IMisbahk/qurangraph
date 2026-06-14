"""
Embedding service using local Ollama API.
"""
import time
import logging
import requests
from typing import Optional
import numpy as np

from backend.app.config import OLLAMA_BASE_URL, EMBEDDING_MODEL

logger = logging.getLogger(__name__)

EMBED_URL = f"{OLLAMA_BASE_URL}/api/embed"


def get_embedding(text: str, retries: int = 3, delay: float = 1.0) -> Optional[np.ndarray]:
    """
    Get embedding for a single text using Ollama.
    Returns numpy array or None on failure.
    """
    for attempt in range(retries):
        try:
            response = requests.post(
                EMBED_URL,
                json={"model": EMBEDDING_MODEL, "input": text},
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()
            # Ollama /api/embed returns {"embeddings": [[...]]}
            embeddings = data.get("embeddings") or data.get("embedding")
            if embeddings is None:
                logger.error(f"Unexpected Ollama response: {data}")
                return None
            if isinstance(embeddings[0], list):
                vec = np.array(embeddings[0], dtype=np.float32)
            else:
                vec = np.array(embeddings, dtype=np.float32)
            return vec
        except requests.RequestException as e:
            logger.warning(f"Attempt {attempt + 1}/{retries} failed: {e}")
            if attempt < retries - 1:
                time.sleep(delay * (attempt + 1))
    return None


def get_embeddings_batch(texts: list[str], batch_size: int = 16) -> list[Optional[np.ndarray]]:
    """
    Get embeddings for a list of texts in batches.
    """
    results = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        for text in batch:
            emb = get_embedding(text)
            results.append(emb)
    return results


async def get_embedding_async(text: str) -> Optional[np.ndarray]:
    """
    Async wrapper for embedding generation (used in API handlers).
    Runs synchronous Ollama call in a thread pool.
    """
    import asyncio
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, get_embedding, text)

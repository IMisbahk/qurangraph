"""
Search router: semantic search using Ollama embeddings + FAISS.
"""
from fastapi import APIRouter, HTTPException, Query
import aiosqlite
from typing import Optional

from backend.app.models import SearchResult
from backend.services.embedding_service import get_embedding_async
from backend.services import faiss_service
from backend.app.config import DB_PATH

router = APIRouter()


@router.get("/search", response_model=list[SearchResult], summary="Semantic verse search")
async def search_verses(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(10, ge=1, le=50),
):
    """
    Generate an embedding for the query, search the FAISS index,
    and return the top-matching Quran verses with similarity scores.
    """
    embedding = await get_embedding_async(q)
    if embedding is None:
        raise HTTPException(status_code=503, detail="Embedding service unavailable. Is Ollama running?")

    hits = faiss_service.search(embedding, top_k=limit)
    if not hits:
        return []

    verse_ids = [h[0] for h in hits]
    scores = {h[0]: h[1] for h in hits}

    # Fetch verse metadata from SQLite
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        placeholders = ",".join("?" * len(verse_ids))
        async with db.execute(
            f"SELECT * FROM verses WHERE id IN ({placeholders})",
            verse_ids,
        ) as cursor:
            rows = await cursor.fetchall()

    row_map = {r["id"]: r for r in rows}
    results = []
    for vid, score in hits:
        row = row_map.get(vid)
        if row is None:
            continue
        results.append(
            SearchResult(
                verse_id=vid,
                score=round(score, 4),
                english=row["english"],
                arabic=row["arabic"],
                surah=row["surah"],
                ayah=row["ayah"],
                surah_name_en=row["surah_name_en"],
                revelation_place=row["revelation_place"],
                community=row["community"],
            )
        )

    return results

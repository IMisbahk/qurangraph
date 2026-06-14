"""
Path router: find semantic path between two verses.
"""
from fastapi import APIRouter, HTTPException, Query
import aiosqlite

from backend.app.models import PathResult, Verse
from backend.app.repositories import VerseRepository
from backend.services.graph_service import find_path
from backend.app.config import DB_PATH

router = APIRouter()


@router.get("/path", response_model=PathResult, summary="Semantic path between two verses")
async def get_path(
    source: str = Query(..., description="Source verse ID, e.g. '1:1'"),
    target: str = Query(..., description="Target verse ID, e.g. '2:255'"),
):
    """
    Find the shortest semantic path between two verses in the knowledge graph.
    Returns the list of verse IDs and their metadata.
    """
    path = find_path(source, target)
    if path is None:
        raise HTTPException(
            status_code=404,
            detail=f"No path found between '{source}' and '{target}'. They may be in disconnected components.",
        )

    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        repo = VerseRepository(db)
        verses = []
        for vid in path:
            verse = await repo.get_by_id(vid)
            if verse:
                verses.append(verse)

    return PathResult(path=path, length=len(path) - 1, verses=verses)

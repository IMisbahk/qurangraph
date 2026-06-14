"""
Verses router: fetch verse by ID and similar verses.
"""
from fastapi import APIRouter, HTTPException
import aiosqlite

from backend.app.models import Verse, NeighborResult
from backend.app.repositories import VerseRepository, EdgeRepository
from backend.app.config import DB_PATH

router = APIRouter()


@router.get("/verse/{verse_id:path}", response_model=Verse, summary="Get a verse by ID")
async def get_verse(verse_id: str):
    """
    Fetch a single verse by its ID (format: 'surah:ayah', e.g., '2:255').
    """
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        repo = VerseRepository(db)
        verse = await repo.get_by_id(verse_id)
    if verse is None:
        raise HTTPException(status_code=404, detail=f"Verse '{verse_id}' not found")
    return verse


@router.get("/neighbors/{verse_id:path}", response_model=list[NeighborResult], summary="Get similar verses")
async def get_neighbors(verse_id: str, limit: int = 10):
    """
    Return the top similar verses for a given verse ID, based on pre-computed graph edges.
    """
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        repo = EdgeRepository(db)
        neighbors = await repo.get_neighbors(verse_id)
    if not neighbors:
        raise HTTPException(status_code=404, detail=f"No neighbors found for verse '{verse_id}'")
    return neighbors[:limit]

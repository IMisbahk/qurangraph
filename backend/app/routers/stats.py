"""
Stats router: global analytics and system status.
"""
from fastapi import APIRouter
import aiosqlite

from backend.app.models import StatsResponse
from backend.app.repositories import VerseRepository
from backend.app.config import DB_PATH
from backend.services.graph_service import get_graph_summary

router = APIRouter()


@router.get("/stats", response_model=StatsResponse, summary="Global graph statistics")
async def get_stats():
    """
    Return verse count, edge count, community count, degree stats,
    and largest/most-connected verse information.
    """
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        repo = VerseRepository(db)
        stats = await repo.get_stats()
    return StatsResponse(**stats)

"""
Communities router: community listing and detail.
"""
from fastapi import APIRouter, HTTPException
import aiosqlite

from backend.app.models import CommunityStats, Verse
from backend.app.repositories import VerseRepository
from backend.services.graph_service import get_community_stats, get_community_by_id
from backend.app.config import DB_PATH

router = APIRouter()


@router.get("/communities", response_model=list[CommunityStats], summary="List all communities")
async def list_communities():
    """Return statistics for all detected Louvain communities."""
    stats = get_community_stats()
    if not stats:
        raise HTTPException(status_code=503, detail="Community data not loaded. Run build_graph.py first.")
    return [CommunityStats(**s) for s in stats]


@router.get("/community/{community_id}", summary="Get community detail")
async def get_community(community_id: int):
    """Return stats and all verses belonging to a specific community."""
    stats = get_community_by_id(community_id)
    if stats is None:
        raise HTTPException(status_code=404, detail=f"Community {community_id} not found")

    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        repo = VerseRepository(db)
        verses = await repo.get_by_community(community_id)

    return {"stats": CommunityStats(**stats), "verses": verses}

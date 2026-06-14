"""
Verses router: fetch verse by ID and similar verses.
"""
from fastapi import APIRouter, HTTPException
import aiosqlite
from datetime import datetime

from backend.app.models import Verse, NeighborResult, SurahMetadata
from backend.app.repositories import VerseRepository, EdgeRepository
from backend.app.config import DB_PATH

router = APIRouter()


@router.get("/surahs", response_model=list[SurahMetadata], summary="Get list of all 114 Surahs")
async def get_surahs():
    """
    Fetch the list of all 114 Surahs in the Quran with metadata.
    """
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            """
            SELECT surah, surah_name_en, surah_name_ar, revelation_place, COUNT(*) as verse_count
            FROM verses
            GROUP BY surah
            ORDER BY surah
            """
        ) as cursor:
            rows = await cursor.fetchall()
            
    return [
        SurahMetadata(
            surah=row["surah"],
            surah_name_en=row["surah_name_en"],
            surah_name_ar=row["surah_name_ar"],
            revelation_place=row["revelation_place"],
            verse_count=row["verse_count"],
        )
        for row in rows
    ]


@router.get("/surah/{surah_id}", response_model=list[Verse], summary="Get all verses in a Surah")
async def get_surah_verses(surah_id: int):
    """
    Fetch all verses in a specific Surah (1-114), ordered by Ayah.
    """
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM verses WHERE surah = ? ORDER BY ayah",
            (surah_id,),
        ) as cursor:
            rows = await cursor.fetchall()
            
    if not rows:
        raise HTTPException(status_code=404, detail=f"Surah {surah_id} not found or has no verses")
        
    return [
        Verse(
            verse_id=row["id"],
            surah=row["surah"],
            ayah=row["ayah"],
            ayah_quran=row["ayah_quran"],
            english=row["english"],
            arabic=row["arabic"],
            revelation_place=row["revelation_place"],
            surah_name_en=row["surah_name_en"],
            surah_name_ar=row["surah_name_ar"],
            community=row["community"],
            degree=row["degree"],
            pagerank=row["pagerank"],
        )
        for row in rows
    ]



@router.get("/verse/day", response_model=Verse, summary="Get the daily featured verse")
async def get_verse_of_the_day():
    """
    Get a stable daily verse based on the day of the year.
    """
    day_of_year = datetime.utcnow().timetuple().tm_yday
    # Contiguous ayah_quran goes from 1 to 6236.
    # We use a prime step (37) to cycle semantically across the whole Quran.
    ayah_quran_id = ((day_of_year * 37) % 6236) + 1

    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM verses WHERE ayah_quran = ?", (ayah_quran_id,)
        ) as cursor:
            row = await cursor.fetchone()

    if row is None:
        # Fallback to Surah Fatihah Ayah 1
        async with aiosqlite.connect(DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                "SELECT * FROM verses WHERE id = '1:1'"
            ) as cursor:
                row = await cursor.fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="No verses found in database")

    # Use _row_to_verse from repository-like structure
    return Verse(
        verse_id=row["id"],
        surah=row["surah"],
        ayah=row["ayah"],
        ayah_quran=row["ayah_quran"],
        english=row["english"],
        arabic=row["arabic"],
        revelation_place=row["revelation_place"],
        surah_name_en=row["surah_name_en"],
        surah_name_ar=row["surah_name_ar"],
        community=row["community"],
        degree=row["degree"],
        pagerank=row["pagerank"],
    )


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


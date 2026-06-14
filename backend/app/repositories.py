"""
Repository pattern for database access.
"""
import json
import sqlite3
from typing import Optional
import aiosqlite
import logging

from backend.app.models import Verse, NeighborResult

logger = logging.getLogger(__name__)


class VerseRepository:
    """Async repository for verse CRUD operations."""

    def __init__(self, db: aiosqlite.Connection):
        self.db = db

    async def get_by_id(self, verse_id: str) -> Optional[Verse]:
        async with self.db.execute(
            "SELECT * FROM verses WHERE id = ?", (verse_id,)
        ) as cursor:
            row = await cursor.fetchone()
            if row is None:
                return None
            return self._row_to_verse(row)

    async def get_all(self) -> list[Verse]:
        async with self.db.execute("SELECT * FROM verses ORDER BY ayah_quran") as cursor:
            rows = await cursor.fetchall()
            return [self._row_to_verse(r) for r in rows]

    async def get_by_community(self, community_id: int) -> list[Verse]:
        async with self.db.execute(
            "SELECT * FROM verses WHERE community = ? ORDER BY ayah_quran",
            (community_id,),
        ) as cursor:
            rows = await cursor.fetchall()
            return [self._row_to_verse(r) for r in rows]

    async def get_stats(self) -> dict:
        async with self.db.execute("SELECT COUNT(*) as count FROM verses") as cursor:
            verse_count = (await cursor.fetchone())["count"]
        async with self.db.execute("SELECT COUNT(DISTINCT community) as count FROM verses WHERE community IS NOT NULL") as cursor:
            community_count = (await cursor.fetchone())["count"]
        async with self.db.execute("SELECT COUNT(*) as count FROM edges") as cursor:
            edge_count = (await cursor.fetchone())["count"]
        async with self.db.execute("SELECT AVG(degree) as avg FROM verses") as cursor:
            avg_degree = (await cursor.fetchone())["avg"] or 0.0
        async with self.db.execute(
            "SELECT community, COUNT(*) as cnt FROM verses WHERE community IS NOT NULL GROUP BY community ORDER BY cnt DESC LIMIT 1"
        ) as cursor:
            largest = await cursor.fetchone()
        async with self.db.execute(
            "SELECT id, degree FROM verses ORDER BY degree DESC LIMIT 1"
        ) as cursor:
            most_connected = await cursor.fetchone()

        return {
            "verse_count": verse_count,
            "edge_count": edge_count,
            "community_count": community_count,
            "avg_degree": round(float(avg_degree), 2),
            "largest_community_id": largest["community"] if largest else 0,
            "largest_community_size": largest["cnt"] if largest else 0,
            "most_connected_verse": most_connected["id"] if most_connected else "",
            "most_connected_verse_degree": most_connected["degree"] if most_connected else 0,
        }

    def _row_to_verse(self, row: aiosqlite.Row) -> Verse:
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


class EdgeRepository:
    """Async repository for edge operations."""

    def __init__(self, db: aiosqlite.Connection):
        self.db = db

    async def get_neighbors(self, verse_id: str) -> list[NeighborResult]:
        async with self.db.execute(
            """
            SELECT e.source, e.target, e.similarity,
                   v.english, v.arabic, v.surah, v.ayah, v.surah_name_en, v.community
            FROM edges e
            JOIN verses v ON (
                CASE WHEN e.source = ? THEN e.target ELSE e.source END = v.id
            )
            WHERE e.source = ? OR e.target = ?
            ORDER BY e.similarity DESC
            LIMIT 20
            """,
            (verse_id, verse_id, verse_id),
        ) as cursor:
            rows = await cursor.fetchall()
            results = []
            seen = set()
            for row in rows:
                neighbor_id = row["target"] if row["source"] == verse_id else row["source"]
                if neighbor_id not in seen:
                    seen.add(neighbor_id)
                    results.append(
                        NeighborResult(
                            verse_id=neighbor_id,
                            similarity=row["similarity"],
                            english=row["english"],
                            arabic=row["arabic"],
                            surah=row["surah"],
                            ayah=row["ayah"],
                            surah_name_en=row["surah_name_en"],
                            community=row["community"],
                        )
                    )
            return results

    async def get_all_edges(self) -> list[dict]:
        async with self.db.execute(
            "SELECT source, target, similarity FROM edges"
        ) as cursor:
            rows = await cursor.fetchall()
            return [{"source": r["source"], "target": r["target"], "similarity": r["similarity"]} for r in rows]

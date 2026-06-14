"""
Database initialization, schema creation, and connection management.
"""
import sqlite3
import aiosqlite
import logging
from pathlib import Path
from backend.app.config import DB_PATH

logger = logging.getLogger(__name__)

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS verses (
    id TEXT PRIMARY KEY,
    surah INTEGER NOT NULL,
    ayah INTEGER NOT NULL,
    ayah_quran INTEGER NOT NULL,
    english TEXT NOT NULL,
    arabic TEXT NOT NULL,
    revelation_place TEXT NOT NULL,
    surah_name_en TEXT NOT NULL,
    surah_name_ar TEXT NOT NULL,
    community INTEGER,
    degree INTEGER DEFAULT 0,
    pagerank REAL DEFAULT 0.0
);

CREATE TABLE IF NOT EXISTS embeddings (
    verse_id TEXT PRIMARY KEY,
    embedding BLOB NOT NULL,
    FOREIGN KEY (verse_id) REFERENCES verses(id)
);

CREATE TABLE IF NOT EXISTS edges (
    source TEXT NOT NULL,
    target TEXT NOT NULL,
    similarity REAL NOT NULL,
    PRIMARY KEY (source, target),
    FOREIGN KEY (source) REFERENCES verses(id),
    FOREIGN KEY (target) REFERENCES verses(id)
);

CREATE INDEX IF NOT EXISTS idx_verses_surah ON verses(surah);
CREATE INDEX IF NOT EXISTS idx_verses_community ON verses(community);
CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source);
CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target);
"""


def init_db() -> None:
    """Initialize the SQLite database synchronously (used in scripts)."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.executescript(SCHEMA_SQL)
        conn.commit()
    logger.info(f"Database initialized at {DB_PATH}")


async def get_db() -> aiosqlite.Connection:
    """Async context manager for database connections."""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA foreign_keys=ON")
    return db


async def init_db_async() -> None:
    """Initialize the database asynchronously."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(SCHEMA_SQL)
        await db.commit()
    logger.info(f"Async database initialized at {DB_PATH}")

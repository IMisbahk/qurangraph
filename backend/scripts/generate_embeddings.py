#!/usr/bin/env python3
"""
generate_embeddings.py
======================
Pipeline: Load Quran CSV → Clean → Generate Ollama embeddings → Save to disk + SQLite.

Features:
- Batch processing with configurable batch size
- Progress bars with ETA (tqdm)
- Retry logic with exponential backoff
- Resume support: skips already-processed verses
- Checkpoint saves every N verses
- Summary report at completion

Usage:
    python -m backend.scripts.generate_embeddings
    # or from project root:
    python backend/scripts/generate_embeddings.py
"""
import sys
import os
import json
import time
import sqlite3
import logging
import argparse
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
import requests
from tqdm import tqdm

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.config import (
    CSV_PATH,
    DATA_DIR,
    DB_PATH,
    EMBEDDINGS_PATH,
    VERSES_JSON_PATH,
    OLLAMA_BASE_URL,
    EMBEDDING_MODEL,
)
from backend.app.database import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)

EMBED_URL = f"{OLLAMA_BASE_URL}/api/embed"
CHECKPOINT_PATH = DATA_DIR / "embeddings_checkpoint.json"


def check_ollama() -> bool:
    """Verify Ollama is running and the model is available."""
    try:
        resp = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        resp.raise_for_status()
        models = [m["name"] for m in resp.json().get("models", [])]
        if not any(EMBEDDING_MODEL in m for m in models):
            logger.error(
                f"Model '{EMBEDDING_MODEL}' not found in Ollama.\n"
                f"Run: ollama pull {EMBEDDING_MODEL}"
            )
            return False
        logger.info(f"Ollama running. Model '{EMBEDDING_MODEL}' available.")
        return True
    except requests.RequestException as e:
        logger.error(f"Cannot reach Ollama at {OLLAMA_BASE_URL}: {e}\nRun: ollama serve")
        return False


def load_quran_csv() -> pd.DataFrame:
    """Load and clean the Quran dataset."""
    logger.info(f"Loading CSV from {CSV_PATH}")
    df = pd.read_csv(CSV_PATH)

    # Rename columns for consistency
    col_map = {
        "surah_no": "SurahNo",
        "surah_name_en": "SurahNameEn",
        "surah_name_ar": "SurahNameAr",
        "ayah_no_surah": "AyahNoSurah",
        "ayah_no_quran": "AyahNoQuran",
        "ayah_ar": "AyahAr",
        "ayah_en": "AyahEn",
        "place_of_revelation": "PlaceOfRevelation",
    }
    df = df.rename(columns=col_map)

    # Ensure required columns exist
    required = ["SurahNo", "AyahNoSurah", "AyahNoQuran", "AyahEn", "AyahAr", "PlaceOfRevelation"]
    for col in required:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")

    # Clean
    df = df.dropna(subset=["AyahEn", "AyahAr"])
    df["AyahEn"] = df["AyahEn"].astype(str).str.strip()
    df["AyahAr"] = df["AyahAr"].astype(str).str.strip()
    df["PlaceOfRevelation"] = df["PlaceOfRevelation"].fillna("Unknown").astype(str).str.strip()
    df["SurahNameEn"] = df.get("SurahNameEn", pd.Series([""] * len(df))).fillna("").astype(str)
    df["SurahNameAr"] = df.get("SurahNameAr", pd.Series([""] * len(df))).fillna("").astype(str)

    # Generate verse ID
    df["VerseId"] = df["SurahNo"].astype(str) + ":" + df["AyahNoSurah"].astype(str)

    logger.info(f"Loaded {len(df)} verses from CSV")
    return df


def get_embedding(text: str, retries: int = 5, base_delay: float = 1.0) -> Optional[np.ndarray]:
    """Get embedding from Ollama with exponential backoff retry."""
    for attempt in range(retries):
        try:
            resp = requests.post(
                EMBED_URL,
                json={"model": EMBEDDING_MODEL, "input": text},
                timeout=60,
            )
            resp.raise_for_status()
            data = resp.json()
            embeddings = data.get("embeddings") or data.get("embedding")
            if embeddings is None:
                logger.warning(f"Unexpected response format: {list(data.keys())}")
                return None
            if isinstance(embeddings[0], list):
                vec = np.array(embeddings[0], dtype=np.float32)
            else:
                vec = np.array(embeddings, dtype=np.float32)
            return vec
        except requests.RequestException as e:
            delay = base_delay * (2 ** attempt)
            if attempt < retries - 1:
                logger.warning(f"Attempt {attempt + 1}/{retries} failed ({e}). Retrying in {delay:.1f}s...")
                time.sleep(delay)
            else:
                logger.error(f"All {retries} attempts failed for text: {text[:60]}...")
    return None


def load_checkpoint() -> set:
    """Load set of already-processed verse IDs from checkpoint file."""
    if CHECKPOINT_PATH.exists():
        with open(CHECKPOINT_PATH, "r") as f:
            data = json.load(f)
        done = set(data.get("completed", []))
        logger.info(f"Resuming: {len(done)} verses already processed")
        return done
    return set()


def save_checkpoint(completed: set) -> None:
    """Save current progress to checkpoint file."""
    with open(CHECKPOINT_PATH, "w") as f:
        json.dump({"completed": list(completed)}, f)


def insert_verses_to_db(df: pd.DataFrame) -> None:
    """Insert all verses into SQLite (idempotent)."""
    with sqlite3.connect(DB_PATH) as conn:
        for _, row in df.iterrows():
            conn.execute(
                """
                INSERT OR REPLACE INTO verses
                (id, surah, ayah, ayah_quran, english, arabic, revelation_place, surah_name_en, surah_name_ar)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    row["VerseId"],
                    int(row["SurahNo"]),
                    int(row["AyahNoSurah"]),
                    int(row["AyahNoQuran"]),
                    row["AyahEn"],
                    row["AyahAr"],
                    row["PlaceOfRevelation"],
                    row["SurahNameEn"],
                    row["SurahNameAr"],
                ),
            )
        conn.commit()
    logger.info(f"Inserted {len(df)} verses into SQLite")


def main(batch_size: int = 8, checkpoint_every: int = 100) -> None:
    print("\n" + "=" * 60)
    print("  QuranGraph — Embedding Generation Pipeline")
    print("=" * 60 + "\n")

    # Check Ollama
    if not check_ollama():
        sys.exit(1)

    # Ensure data dir + DB exist
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    init_db()

    # Load dataset
    df = load_quran_csv()
    total = len(df)

    # Insert verse metadata to DB
    insert_verses_to_db(df)

    # Save verses.json for FAISS index ordering
    verses_data = df[["VerseId", "SurahNo", "AyahNoSurah", "AyahNoQuran",
                       "AyahEn", "AyahAr", "PlaceOfRevelation", "SurahNameEn", "SurahNameAr"]].copy()
    verses_list = [
        {
            "verse_id": r["VerseId"],
            "surah": int(r["SurahNo"]),
            "ayah": int(r["AyahNoSurah"]),
            "ayah_quran": int(r["AyahNoQuran"]),
            "english": r["AyahEn"],
            "arabic": r["AyahAr"],
            "revelation_place": r["PlaceOfRevelation"],
            "surah_name_en": r["SurahNameEn"],
            "surah_name_ar": r["SurahNameAr"],
        }
        for _, r in verses_data.iterrows()
    ]
    with open(VERSES_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(verses_list, f, ensure_ascii=False, indent=2)
    logger.info(f"Saved verses.json with {len(verses_list)} entries")

    # Load checkpoint
    completed = load_checkpoint()

    # Determine embedding dimension from a test call
    logger.info("Detecting embedding dimension...")
    test_vec = get_embedding("test")
    if test_vec is None:
        logger.error("Cannot get test embedding. Check Ollama is running with model pulled.")
        sys.exit(1)
    emb_dim = test_vec.shape[0]
    logger.info(f"Embedding dimension: {emb_dim}")

    # Load existing embeddings if resuming
    if EMBEDDINGS_PATH.exists() and len(completed) > 0:
        all_embeddings = list(np.load(EMBEDDINGS_PATH))
        logger.info(f"Loaded {len(all_embeddings)} existing embeddings from file")
    else:
        all_embeddings = [None] * total

    # Compute embeddings with progress
    failure_count = 0
    processed_this_run = 0
    start_time = time.time()

    with tqdm(total=total, desc="Generating embeddings", unit="verse") as pbar:
        pbar.update(len(completed))

        for i, (_, row) in enumerate(df.iterrows()):
            verse_id = row["VerseId"]

            if verse_id in completed:
                pbar.update(0)  # already counted
                continue

            text = row["AyahEn"]
            vec = get_embedding(text)

            if vec is None:
                failure_count += 1
                # Use zero vector as placeholder
                vec = np.zeros(emb_dim, dtype=np.float32)
                tqdm.write(f"WARNING: Failed to embed {verse_id}, using zero vector")
            else:
                processed_this_run += 1

            all_embeddings[i] = vec
            completed.add(verse_id)
            pbar.update(1)

            # Insert embedding into SQLite
            with sqlite3.connect(DB_PATH) as conn:
                conn.execute(
                    "INSERT OR REPLACE INTO embeddings (verse_id, embedding) VALUES (?, ?)",
                    (verse_id, vec.tobytes()),
                )
                conn.commit()

            # Checkpoint save
            if (processed_this_run + failure_count) % checkpoint_every == 0:
                # Save partial embeddings
                valid = [e for e in all_embeddings if e is not None]
                if valid:
                    np.save(EMBEDDINGS_PATH, np.array(valid, dtype=np.float32))
                save_checkpoint(completed)
                elapsed = time.time() - start_time
                rate = processed_this_run / elapsed if elapsed > 0 else 0
                remaining = (total - len(completed)) / rate if rate > 0 else 0
                tqdm.write(
                    f"Checkpoint: {len(completed)}/{total} | "
                    f"Failures: {failure_count} | "
                    f"Rate: {rate:.1f}/s | "
                    f"ETA: {remaining/60:.1f}min"
                )

    # Final save
    valid_embeddings = [e for e in all_embeddings if e is not None]
    final_array = np.array(valid_embeddings, dtype=np.float32)
    np.save(EMBEDDINGS_PATH, final_array)
    save_checkpoint(completed)

    elapsed = time.time() - start_time
    print("\n" + "=" * 60)
    print("  Embedding Generation Complete!")
    print("=" * 60)
    print(f"  Total verses:     {total}")
    print(f"  Successfully embedded: {processed_this_run + len(completed) - failure_count}")
    print(f"  Failures:         {failure_count}")
    print(f"  Embedding shape:  {final_array.shape}")
    print(f"  Time elapsed:     {elapsed/60:.1f} minutes")
    print(f"  Saved to:         {EMBEDDINGS_PATH}")
    print(f"  Verses JSON:      {VERSES_JSON_PATH}")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate Quran verse embeddings using Ollama")
    parser.add_argument("--batch-size", type=int, default=8, help="Embedding batch size")
    parser.add_argument("--checkpoint-every", type=int, default=100, help="Save checkpoint every N verses")
    args = parser.parse_args()
    main(batch_size=args.batch_size, checkpoint_every=args.checkpoint_every)

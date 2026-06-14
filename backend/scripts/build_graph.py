#!/usr/bin/env python3
"""
build_graph.py
==============
Build the semantic knowledge graph of the Quran.

Pipeline:
1. Load FAISS index + verse IDs
2. For each verse, find top-10 nearest neighbors (similarity >= 0.70)
3. Build NetworkX undirected weighted graph
4. Run Louvain community detection
5. Compute PageRank and degree centrality
6. Save graph as GraphML
7. Save community_stats.json
8. Update SQLite with community IDs, degree, PageRank

Usage:
    python -m backend.scripts.build_graph
    # or:
    python backend/scripts/build_graph.py
"""
import sys
import json
import sqlite3
import logging
from pathlib import Path
from collections import defaultdict

import numpy as np
import faiss
import networkx as nx
from tqdm import tqdm

try:
    import community as community_louvain
except ImportError:
    try:
        from community import community_louvain
    except ImportError:
        raise ImportError("Install python-louvain: pip install python-louvain")

PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.config import (
    EMBEDDINGS_PATH,
    VERSES_JSON_PATH,
    FAISS_INDEX_PATH,
    GRAPH_PATH,
    COMMUNITY_STATS_PATH,
    DB_PATH,
    DATA_DIR,
    SIMILARITY_THRESHOLD,
    TOP_K_NEIGHBORS,
)
from backend.app.database import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)


def load_faiss_and_verses():
    """Load FAISS index and verse ID list."""
    if not FAISS_INDEX_PATH.exists():
        logger.error(f"FAISS index not found: {FAISS_INDEX_PATH}")
        logger.error("Run build_index.py first.")
        sys.exit(1)

    if not VERSES_JSON_PATH.exists():
        logger.error(f"verses.json not found: {VERSES_JSON_PATH}")
        sys.exit(1)

    logger.info("Loading FAISS index...")
    index = faiss.read_index(str(FAISS_INDEX_PATH))
    logger.info(f"FAISS index loaded: {index.ntotal} vectors, dim={index.d}")

    with open(VERSES_JSON_PATH, "r", encoding="utf-8") as f:
        verses = json.load(f)
    verse_ids = [v["verse_id"] for v in verses]
    verse_map = {v["verse_id"]: v for v in verses}
    logger.info(f"Loaded {len(verse_ids)} verse IDs")

    return index, verse_ids, verse_map


def build_graph(index: faiss.Index, verse_ids: list, verse_map: dict) -> nx.Graph:
    """Build NetworkX graph with similarity-weighted edges."""
    logger.info(f"Building graph with threshold={SIMILARITY_THRESHOLD}, top_k={TOP_K_NEIGHBORS}")

    G = nx.Graph()

    # Add all nodes with metadata
    for vid, verse in verse_map.items():
        G.add_node(
            vid,
            surah=verse["surah"],
            ayah=verse["ayah"],
            ayah_quran=verse["ayah_quran"],
            english=verse["english"][:100],  # truncate for GraphML
            arabic=verse["arabic"][:100],
            surah_name_en=verse["surah_name_en"],
            revelation_place=verse["revelation_place"],
        )

    # Load normalized embeddings
    logger.info("Loading embeddings for graph construction...")
    embeddings = np.load(EMBEDDINGS_PATH).astype(np.float32)

    if embeddings.shape[0] != len(verse_ids):
        n = min(embeddings.shape[0], len(verse_ids))
        embeddings = embeddings[:n]
        verse_ids_used = verse_ids[:n]
    else:
        verse_ids_used = verse_ids

    # Already normalized in build_index, but re-normalize to be safe
    faiss.normalize_L2(embeddings)

    edge_count = 0
    skipped_self = 0

    batch_size = 256
    for start in tqdm(range(0, len(verse_ids_used), batch_size), desc="Finding neighbors"):
        end = min(start + batch_size, len(verse_ids_used))
        batch_vecs = embeddings[start:end]
        batch_ids = verse_ids_used[start:end]

        distances, indices = index.search(batch_vecs, TOP_K_NEIGHBORS + 1)

        for i, (dists, idxs) in enumerate(zip(distances, indices)):
            source_id = batch_ids[i]
            for dist, idx in zip(dists, idxs):
                if idx < 0 or idx >= len(verse_ids_used):
                    continue
                target_id = verse_ids_used[idx]
                if target_id == source_id:
                    skipped_self += 1
                    continue
                similarity = float(dist)
                if similarity < SIMILARITY_THRESHOLD:
                    continue
                # Add edge (undirected — avoid duplicates)
                if not G.has_edge(source_id, target_id):
                    G.add_edge(source_id, target_id, similarity=round(similarity, 4))
                    edge_count += 1

    logger.info(f"Graph constructed: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
    logger.info(f"Self-loops skipped: {skipped_self}")
    return G


def detect_communities(G: nx.Graph) -> dict:
    """Run Louvain community detection."""
    logger.info("Running Louvain community detection...")
    # Louvain on undirected weighted graph
    partition = community_louvain.best_partition(G, weight="similarity", random_state=42)
    logger.info(f"Detected {len(set(partition.values()))} communities")
    return partition


def compute_graph_analytics(G: nx.Graph) -> tuple[dict, dict]:
    """Compute PageRank and degree for all nodes."""
    logger.info("Computing PageRank...")
    try:
        pagerank = nx.pagerank(G, weight="similarity", max_iter=200)
    except nx.PowerIterationFailedConvergence:
        logger.warning("PageRank did not converge; using uniform values")
        pagerank = {n: 1.0 / G.number_of_nodes() for n in G.nodes()}

    degrees = dict(G.degree())
    return pagerank, degrees


def build_community_stats(G: nx.Graph, partition: dict, verse_map: dict, pagerank: dict) -> list[dict]:
    """Generate community statistics."""
    logger.info("Building community stats...")
    community_verses = defaultdict(list)
    for verse_id, comm_id in partition.items():
        community_verses[comm_id].append(verse_id)

    stats_list = []
    for comm_id, members in community_verses.items():
        subgraph = G.subgraph(members)

        # Density
        density = nx.density(subgraph) if len(members) > 1 else 0.0

        # Average similarity
        edge_sims = [d["similarity"] for _, _, d in subgraph.edges(data=True)]
        avg_sim = float(np.mean(edge_sims)) if edge_sims else 0.0

        # Central node (highest PageRank in community)
        central_id = max(members, key=lambda v: pagerank.get(v, 0.0))
        central_english = verse_map.get(central_id, {}).get("english", "")[:100]

        # Representative verses (top-3 by pagerank)
        rep_verses = sorted(members, key=lambda v: pagerank.get(v, 0.0), reverse=True)[:3]

        stats_list.append({
            "community_id": comm_id,
            "size": len(members),
            "density": round(density, 4),
            "avg_similarity": round(avg_sim, 4),
            "central_verse_id": central_id,
            "central_verse_english": central_english,
            "representative_verses": rep_verses,
        })

    # Sort by size descending
    stats_list.sort(key=lambda x: x["size"], reverse=True)
    return stats_list


def update_sqlite(partition: dict, degrees: dict, pagerank: dict) -> None:
    """Update SQLite verses table with community, degree, and pagerank."""
    logger.info("Updating SQLite with community IDs and analytics...")
    init_db()

    with sqlite3.connect(DB_PATH) as conn:
        for verse_id, comm_id in tqdm(partition.items(), desc="Updating communities"):
            conn.execute(
                "UPDATE verses SET community = ?, degree = ?, pagerank = ? WHERE id = ?",
                (
                    comm_id,
                    degrees.get(verse_id, 0),
                    round(pagerank.get(verse_id, 0.0), 8),
                    verse_id,
                ),
            )
        conn.commit()
    logger.info("SQLite updated with community data")


def save_edges_to_sqlite(G: nx.Graph) -> None:
    """Persist graph edges to SQLite edges table."""
    logger.info("Saving edges to SQLite...")
    with sqlite3.connect(DB_PATH) as conn:
        # Clear existing edges
        conn.execute("DELETE FROM edges")
        batch = []
        for source, target, data in G.edges(data=True):
            batch.append((source, target, data.get("similarity", 0.0)))
            if len(batch) >= 1000:
                conn.executemany(
                    "INSERT OR REPLACE INTO edges (source, target, similarity) VALUES (?, ?, ?)",
                    batch,
                )
                batch = []
        if batch:
            conn.executemany(
                "INSERT OR REPLACE INTO edges (source, target, similarity) VALUES (?, ?, ?)",
                batch,
            )
        conn.commit()
    logger.info(f"Saved {G.number_of_edges()} edges to SQLite")


def annotate_graph_nodes(G: nx.Graph, partition: dict, pagerank: dict, degrees: dict) -> None:
    """Add community, pagerank, degree to graph node attributes."""
    for node in G.nodes():
        G.nodes[node]["community"] = partition.get(node, -1)
        G.nodes[node]["pagerank"] = round(pagerank.get(node, 0.0), 8)
        G.nodes[node]["degree"] = degrees.get(node, 0)


def main() -> None:
    print("\n" + "=" * 60)
    print("  QuranGraph — Knowledge Graph Builder")
    print("=" * 60 + "\n")

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    init_db()

    # Load data
    index, verse_ids, verse_map = load_faiss_and_verses()

    # Build graph
    G = build_graph(index, verse_ids, verse_map)

    if G.number_of_edges() == 0:
        logger.error("No edges found! Check your similarity threshold or embeddings.")
        logger.error(f"Current threshold: {SIMILARITY_THRESHOLD}")
        sys.exit(1)

    # Community detection
    partition = detect_communities(G)

    # Analytics
    pagerank, degrees = compute_graph_analytics(G)

    # Annotate graph
    annotate_graph_nodes(G, partition, pagerank, degrees)

    # Community stats
    community_stats = build_community_stats(G, partition, verse_map, pagerank)

    # Save GraphML
    logger.info(f"Saving graph to {GRAPH_PATH}...")
    nx.write_graphml(G, str(GRAPH_PATH))
    logger.info(f"GraphML saved: {GRAPH_PATH.stat().st_size / (1024*1024):.1f} MB")

    # Save community stats
    with open(COMMUNITY_STATS_PATH, "w", encoding="utf-8") as f:
        json.dump(community_stats, f, indent=2, ensure_ascii=False)
    logger.info(f"Community stats saved: {len(community_stats)} communities → {COMMUNITY_STATS_PATH}")

    # Update SQLite
    update_sqlite(partition, degrees, pagerank)
    save_edges_to_sqlite(G)

    # Summary
    n_communities = len(set(partition.values()))
    avg_degree = float(np.mean([d for _, d in G.degree()]))
    largest_comm = community_stats[0] if community_stats else {}

    print("\n" + "=" * 60)
    print("  Knowledge Graph Build Complete!")
    print("=" * 60)
    print(f"  Nodes (verses):   {G.number_of_nodes()}")
    print(f"  Edges:            {G.number_of_edges()}")
    print(f"  Communities:      {n_communities}")
    print(f"  Avg degree:       {avg_degree:.1f}")
    print(f"  Largest community: {largest_comm.get('community_id', 'N/A')} ({largest_comm.get('size', 0)} verses)")
    print(f"  Graph file:       {GRAPH_PATH}")
    print(f"  Community stats:  {COMMUNITY_STATS_PATH}")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()

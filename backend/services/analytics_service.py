"""
Analytics service: PageRank, centrality, and top-verse calculations.
"""
import logging
from typing import Optional
import networkx as nx
from backend.services.graph_service import get_graph

logger = logging.getLogger(__name__)

_pagerank: Optional[dict] = None
_degree_centrality: Optional[dict] = None
_betweenness: Optional[dict] = None


def compute_analytics() -> None:
    """Compute and cache all graph analytics."""
    global _pagerank, _degree_centrality, _betweenness
    graph = get_graph()
    if graph is None:
        logger.warning("Graph not loaded — skipping analytics computation")
        return

    logger.info("Computing PageRank...")
    _pagerank = nx.pagerank(graph, weight="similarity")

    logger.info("Computing degree centrality...")
    _degree_centrality = nx.degree_centrality(graph)

    logger.info("Analytics computed successfully")


def get_top_pagerank(n: int = 10) -> list[tuple[str, float]]:
    if _pagerank is None:
        return []
    return sorted(_pagerank.items(), key=lambda x: x[1], reverse=True)[:n]


def get_top_degree(n: int = 10) -> list[tuple[str, int]]:
    graph = get_graph()
    if graph is None:
        return []
    return sorted(graph.degree(), key=lambda x: x[1], reverse=True)[:n]


def get_pagerank(verse_id: str) -> float:
    if _pagerank is None:
        return 0.0
    return _pagerank.get(verse_id, 0.0)


def get_degree_centrality(verse_id: str) -> float:
    if _degree_centrality is None:
        return 0.0
    return _degree_centrality.get(verse_id, 0.0)

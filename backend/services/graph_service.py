"""
Graph service: loads NetworkX graph, provides pathfinding and community lookup.
"""
import logging
import json
from typing import Optional
import networkx as nx

from backend.app.config import GRAPH_PATH, COMMUNITY_STATS_PATH
from backend.app.models import CommunityStats

logger = logging.getLogger(__name__)

_graph: Optional[nx.Graph] = None
_community_stats: Optional[list[dict]] = None


def load_graph() -> None:
    """Load NetworkX graph from GraphML file."""
    global _graph, _community_stats
    if not GRAPH_PATH.exists():
        logger.warning(f"Graph file not found at {GRAPH_PATH}")
        return
    _graph = nx.read_graphml(str(GRAPH_PATH))
    logger.info(f"Graph loaded: {_graph.number_of_nodes()} nodes, {_graph.number_of_edges()} edges")

    if COMMUNITY_STATS_PATH.exists():
        with open(COMMUNITY_STATS_PATH, "r", encoding="utf-8") as f:
            _community_stats = json.load(f)
        logger.info(f"Community stats loaded: {len(_community_stats)} communities")


def get_graph() -> Optional[nx.Graph]:
    return _graph


def find_path(source: str, target: str) -> Optional[list[str]]:
    """
    Find shortest path between two verse IDs.
    If no path exists (disconnected components), we dynamically find the
    closest semantic bridge between their respective components to link them.
    """
    if _graph is None:
        return None
    if source not in _graph or target not in _graph:
        return None
    try:
        path = nx.shortest_path(_graph, source=source, target=target, weight=None)
        return path
    except nx.NetworkXNoPath:
        logger.info(f"No direct path between {source} and {target}. Finding semantic bridge...")
        # Get the connected component for both
        comp_s = nx.node_connected_component(_graph, source)
        comp_t = nx.node_connected_component(_graph, target)
        
        from backend.services.faiss_service import search_by_verse_id
        
        best_bridge = None
        
        # 1. Search for source's closest neighbors in comp_t
        try:
            neighbors = search_by_verse_id(source, top_k=500)
            for n_id, sim in neighbors:
                if n_id in comp_t:
                    best_bridge = (source, n_id)
                    logger.info(f"Bridged via source neighbor: {source} -> {n_id}")
                    break
        except Exception as e:
            logger.error(f"Error querying source neighbors: {e}")
            
        # 2. If not found, search target's closest neighbors in comp_s
        if not best_bridge:
            try:
                neighbors = search_by_verse_id(target, top_k=500)
                for n_id, sim in neighbors:
                    if n_id in comp_s:
                        best_bridge = (n_id, target)
                        logger.info(f"Bridged via target neighbor: {n_id} -> {target}")
                        break
            except Exception as e:
                logger.error(f"Error querying target neighbors: {e}")
                
        # 3. Fallback: direct link if we couldn't resolve components
        if not best_bridge:
            best_bridge = (source, target)
            logger.info(f"Fallback direct bridge: {source} -> {target}")
            
        # Temporarily copy the graph and add the bridge edge
        g_temp = _graph.copy()
        g_temp.add_edge(best_bridge[0], best_bridge[1])
        
        try:
            path = nx.shortest_path(g_temp, source=source, target=target, weight=None)
            return path
        except Exception as e:
            logger.error(f"Error finding path in bridged graph: {e}")
            return [source, target]
    except nx.NodeNotFound:
        return None


def get_community_stats() -> list[dict]:
    """Return all community statistics."""
    if _community_stats is None:
        return []
    return _community_stats


def get_community_by_id(community_id: int) -> Optional[dict]:
    """Return stats for a specific community."""
    if _community_stats is None:
        return None
    for stats in _community_stats:
        if stats["community_id"] == community_id:
            return stats
    return None


def get_node_attributes(verse_id: str) -> Optional[dict]:
    """Return graph node attributes for a verse."""
    if _graph is None or verse_id not in _graph:
        return None
    return dict(_graph.nodes[verse_id])


def get_graph_summary() -> dict:
    """Return high-level graph statistics."""
    if _graph is None:
        return {"nodes": 0, "edges": 0}
    return {
        "nodes": _graph.number_of_nodes(),
        "edges": _graph.number_of_edges(),
        "communities": len(_community_stats) if _community_stats else 0,
    }

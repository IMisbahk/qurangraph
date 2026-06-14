"""
Graph router: full graph data for frontend visualization.
"""
import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import aiosqlite

from backend.app.models import GraphData, GraphNode, GraphEdge
from backend.app.config import DB_PATH

router = APIRouter()


@router.get("/graph", response_model=GraphData, summary="Full graph for visualization")
async def get_graph():
    """
    Return all nodes and edges for the force-graph visualization.
    Nodes include community, degree, and PageRank.
    """
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        async with db.execute(
            "SELECT id, surah, ayah, english, arabic, surah_name_en, community, degree, pagerank, revelation_place FROM verses"
        ) as cursor:
            verse_rows = await cursor.fetchall()

        async with db.execute("SELECT source, target, similarity FROM edges") as cursor:
            edge_rows = await cursor.fetchall()

    nodes = [
        GraphNode(
            id=r["id"],
            surah=r["surah"],
            ayah=r["ayah"],
            english=r["english"],
            arabic=r["arabic"],
            surah_name_en=r["surah_name_en"],
            community=r["community"] if r["community"] is not None else 0,
            degree=r["degree"] if r["degree"] is not None else 0,
            pagerank=r["pagerank"] if r["pagerank"] is not None else 0.0,
            revelation_place=r["revelation_place"],
        )
        for r in verse_rows
    ]

    edges = [
        GraphEdge(source=r["source"], target=r["target"], similarity=r["similarity"])
        for r in edge_rows
    ]

    return GraphData(
        nodes=nodes,
        edges=edges,
        node_count=len(nodes),
        edge_count=len(edges),
    )

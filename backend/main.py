"""
QuranGraph FastAPI Application Entry Point
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import API_TITLE, API_VERSION, API_DESCRIPTION
from backend.app.database import init_db_async
from backend.services.faiss_service import load_index
from backend.services.graph_service import load_graph
from backend.services.analytics_service import compute_analytics
from backend.app.routers import search, verses, graph, communities, stats, path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize all services on startup."""
    logger.info("Starting QuranGraph API...")
    await init_db_async()
    load_index()
    load_graph()
    compute_analytics()
    logger.info("All services initialized. QuranGraph API is ready.")
    yield
    logger.info("Shutting down QuranGraph API...")


app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description=API_DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router, tags=["Search"])
app.include_router(verses.router, tags=["Verses"])
app.include_router(graph.router, tags=["Graph"])
app.include_router(communities.router, tags=["Communities"])
app.include_router(stats.router, tags=["Stats"])
app.include_router(path.router, tags=["Pathfinding"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "name": "QuranGraph API",
        "version": API_VERSION,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health():
    from backend.services.faiss_service import get_index, get_verse_ids
    from backend.services.graph_service import get_graph

    index = get_index()
    grph = get_graph()
    verse_ids = get_verse_ids()

    return {
        "status": "ok",
        "faiss_loaded": index is not None,
        "faiss_vectors": index.ntotal if index else 0,
        "graph_loaded": grph is not None,
        "graph_nodes": grph.number_of_nodes() if grph else 0,
        "graph_edges": grph.number_of_edges() if grph else 0,
        "verse_ids_loaded": len(verse_ids) if verse_ids else 0,
    }

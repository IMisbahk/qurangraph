"""
QuranGraph Backend Configuration
"""
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "quranGraph.db"
EMBEDDINGS_PATH = DATA_DIR / "embeddings.npy"
VERSES_JSON_PATH = DATA_DIR / "verses.json"
FAISS_INDEX_PATH = DATA_DIR / "faiss.index"
GRAPH_PATH = DATA_DIR / "graph.graphml"
COMMUNITY_STATS_PATH = DATA_DIR / "community_stats.json"
CSV_PATH = BASE_DIR.parent / "The Quran Dataset.csv"

# Embedding settings
OLLAMA_BASE_URL = "http://localhost:11434"
EMBEDDING_MODEL = "embeddinggemma:300m"
EMBEDDING_DIM = 512  # embeddinggemma:300m output dimension

# Graph settings
SIMILARITY_THRESHOLD = 0.70
TOP_K_NEIGHBORS = 10

# API settings
API_TITLE = "QuranGraph API"
API_VERSION = "1.0.0"
API_DESCRIPTION = "Semantic Knowledge Graph of the Quran"

# Ensure data directory exists
DATA_DIR.mkdir(parents=True, exist_ok=True)

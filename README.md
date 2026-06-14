  # QuranGraph 🕸️📖

> **The world's first interactive Semantic Knowledge Graph of the Quran.**  
> Explore the connections, concepts, and communities of 6,236 verses using local AI embeddings, FAISS vector search, and Louvain community detection.

---

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12+-blue?logo=python&logoColor=white" alt="Python 3.12+">
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs&logoColor=white" alt="Next.js 15">
  <img src="https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Ollama-embeddinggemma-orange?logo=ollama&logoColor=white" alt="Ollama Local Embeddings">
  <img src="https://img.shields.io/badge/FAISS-Vector--Search-lightgrey" alt="FAISS Search">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License">
</p>

---

## 🌟 Product Vision & Features

QuranGraph bridges ancient sacred text with modern Graph Intelligence and Machine Learning. By shifting from traditional keyword searches to **semantic relationships**, users can explore the Quran as a fully connected conceptual network.

*   **🔍 Natural Language Semantic Search**: Search concepts like *"patience during trials"* or *"cosmology"* in natural language. Local Ollama embeddings return relevant verses even if they share zero literal keywords.
*   **🕸️ Interactive 2D/3D Knowledge Graph**: Visualize all 6,236 verses as nodes connected by semantic similarity edges (threshold $\ge$ 0.70). Click, zoom, drag, and traverse connections dynamically.
*   **🧩 Unsupervised Community Detection**: The Louvain algorithm automatically groups verses into thematic clusters, revealing hidden threads and narrative communities across Surahs.
*   **📊 Graph Analytics**: 
    *   **PageRank Centrality**: Identifies the most structurally influential verses.
    *   **Degree Centrality**: Highlights highly-connected verses that act as semantic hubs.
    *   **Shortest Conceptual Path**: Trace the semantic steps linking any two verses (e.g., how the concept of *charity* bridges to *repentance*).
*   **🔒 100% Local & Private**: No API keys, no cloud data transmission, and no tracking. All embeddings, storage, and models run on your local machine.

---

## 🛠️ The Semantic Pipeline

```
┌──────────────────────┐      ┌──────────────────────────┐      ┌─────────────────────────┐
│ The Quran Dataset    │ ───> │ Ollama Embeddings        │ ───> │ FAISS Index             │
│ (6,236 Verses / CSV) │      │ (embeddinggemma:300m)    │      │ (Exact Cosine L2 Space) │
└──────────────────────┘      └──────────────────────────┘      └─────────────────────────┘
                                                                             │
┌──────────────────────┐      ┌──────────────────────────┐                   │
│ Next.js Frontend     │ <─── │ FastAPI Backend          │ <─────────────────┘
│ (Force Graph UI)     │      │ (NetworkX + Louvain Cls) │
└──────────────────────┘      └──────────────────────────┘
```

1.  **Ingestion & Cleaning**: Parse the 6,236 verses, stripping markdown but retaining surah, ayah numbers, and revelation settings (Meccan/Medinan).
2.  **Vectorization**: Batch generate 300-dimension embeddings locally with **Ollama** (`embeddinggemma:300m`).
3.  **Indexing**: Build a **FAISS** index using Inner Product (Cosine Similarity) for millisecond-level similarity searches.
4.  **Graph Topology**: Construct a **NetworkX** graph. Add edges between verses with similarity $\ge 0.70$. Apply **Louvain Clustering** to identify thematic communities.
5.  **Service**: Expose endpoints via **FastAPI** with cached startup graphs and SQLite database storage.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Python 3.12+**
- **Node.js 20+**
- [Ollama](https://ollama.ai) installed and running

### 2. Configure Ollama
Make sure Ollama is running, then pull the lightweight embedding model:
```bash
# Pull the required embedding model
ollama pull embeddinggemma:300m
```

### 3. Setup Backend Environment
```bash
# Clone the repository
git clone https://github.com/imisbahk/qurangraph.git
cd qurangraph

# Initialize virtual env
python3 -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate

# Install requirements
pip install -r backend/requirements.txt
```

### 4. Build the Semantic Pipeline
Generate the embeddings, index, and network graph files.
```bash
# Step 1: Embed all verses (~2-3 hours depending on hardware, supports resume/checkpoints)
python -m backend.scripts.generate_embeddings

# Step 2: Build FAISS search index
python -m backend.scripts.build_index

# Step 3: Compute graph edges and communities
python -m backend.scripts.build_graph
```

### 5. Launch the Applications
Run both servers locally to interact with the application:

*   **Backend API** (Port `8000`):
    ```bash
    uvicorn backend.main:app --reload
    ```
    *Interactive docs available at: [http://localhost:8000/docs](http://localhost:8000/docs)*

*   **Frontend UI** (Port `3000`):
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    *Open [http://localhost:3000](http://localhost:3000) in your browser.*

---

## 🔌 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/search?q=...` | Query the semantic FAISS index with natural language. |
| `GET` | `/verse/{id}` | Retrieve verse content, metadata, and analytics by ID (e.g., `2:255`). |
| `GET` | `/neighbors/{id}` | Find the top semantically similar verses for a target verse. |
| `GET` | `/community/{id}` | Get details of a Louvain community cluster along with its verses. |
| `GET` | `/communities` | Get a list of all detected communities and summary statistics. |
| `GET` | `/graph` | Export full node-link structure (JSON) for graph visualizations. |
| `GET` | `/path?source=...&target=...` | Find shortest semantic path between two verse IDs. |
| `GET` | `/stats` | Return high-level repository stats (verse count, edge count, density). |
| `GET` | `/health` | Server status check. |

---

## 📁 Repository Structure

```
quran-project/
├── .github/                  # GitHub actions, Issue/PR templates
├── backend/                  # FastAPI Web Server & Data Scripts
│   ├── app/                  # Main application models, database, and routers
│   ├── data/                 # Local data directory (.gitignored database/index files)
│   ├── scripts/              # Pipeline creation scripts (embed, index, graph)
│   ├── services/             # Core business logic (analytics, FAISS, Ollama)
│   └── requirements.txt      # Python dependencies
├── frontend/                 # Next.js Application
│   ├── app/                  # App Router views (search, graph, communities)
│   ├── components/           # React elements (force-graph integration, panels)
│   ├── lib/                  # Backend API clients
│   └── types/                # TypeScript interface definitions
├── CONTRIBUTING.md           # Contribution guidelines
├── LICENSE                   # MIT License
└── The Quran Dataset.csv     # Raw dataset source
```

---

## 🤝 Contributing

We welcome contributions of all types: bug reports, styling improvements, feature suggestions, or documentation. Please check out [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Developed with ❤️ by [imisbahk](https://github.com/imisbahk).

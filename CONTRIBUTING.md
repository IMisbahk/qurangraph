# Contributing to QuranGraph

First off, thank you for your interest in contributing to QuranGraph! Projects like this thrive on community contributions.

Please review the guidelines below to ensure a smooth, efficient process for everyone.

---

## Code of Conduct

By participating in this project, you agree to maintain a respectful, welcoming, and collaborative environment. Please treat all contributors with kindness and respect.

---

## Getting Started

### 1. Prerequisites
Before setting up the project locally, make sure you have installed:
- **Python 3.12+** (configured with virtual environments or `pyenv`)
- **Node.js 20+** and `npm`
- [Ollama](https://ollama.ai) installed and running on your system

### 2. Local Environment Setup

#### Clone the Repository
```bash
git clone https://github.com/imisbahk/qurangraph.git
cd qurangraph
```

#### Backend Setup
1. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On macOS/Linux
   # or
   .\venv\Scripts\activate   # On Windows
   ```
2. Install the backend dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Pull the required local Ollama embedding model:
   ```bash
   ollama pull embeddinggemma:300m
   ```

#### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

---

## Running the Data Pipeline

If you want to modify the graph building logic or recalculate embeddings:

1. **Clean/Embed Verses**:
   ```bash
   python -m backend.scripts.generate_embeddings
   ```
   *Note: Generating embeddings for all 6,236 verses using a local model can take 2-3 hours depending on your hardware. The script supports resume, so you can safely stop and restart it.*

2. **Rebuild FAISS Index**:
   ```bash
   python -m backend.scripts.build_index
   ```

3. **Rebuild Knowledge Graph & Detect Communities**:
   ```bash
   python -m backend.scripts.build_graph
   ```

---

## Running the Development Servers

To run both services concurrently during development:

- **Start Backend**:
  With virtualenv active, run:
  ```bash
  uvicorn backend.main:app --reload
  ```
  The backend API is served at `http://localhost:8000`. Interactive documentation is available at `http://localhost:8000/docs`.

- **Start Frontend**:
  In the `frontend` folder, run:
  ```bash
  npm run dev
  ```
  The application UI is served at `http://localhost:3000`.

---

## Style Guides & Standards

### Python (Backend)
- Format code using modern formatters (e.g., `ruff format` or `black`).
- Use standard PEP 8 naming conventions.
- Add docstrings to new routers, models, or services.

### TypeScript / React (Frontend)
- Use functional React components with hooks.
- Adhere to TypeScript typing guidelines (avoid `any`).
- Format code using `prettier` or standard IDE settings.
- Ensure styling follows the existing theme structure (Vanilla CSS / TailwindCSS custom values).

---

## Submission Process

1. **Create a Branch**: Create a feature branch off of `main`.
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Commit Changes**: Follow conventional commits (e.g., `feat: add community search`, `fix: handle missing nodes in pathfinder`).
3. **Run Checks**:
   - Ensure the Next.js app builds cleanly: `npm run build` inside `frontend`.
   - Ensure there are no runtime imports errors in the backend.
4. **Push & PR**: Push to your fork and submit a Pull Request to `main`.
   - Complete the provided Pull Request template detailing what was changed and how it was tested.

# Anveshan Research AI 🧭

> **University Research Discovery, Cross-Disciplinary Knowledge Graph & Synthesis Platform**

Anveshan Research AI acts as an autonomous academic intelligence engine that bridges university faculty silos, extracts granular research entities, constructs multi-dimensional knowledge graphs, discovers cross-disciplinary synergies, detects potential research redundancy, and provides grounded AI synthesis.

---

## 🌟 Key Features

1. **🕸️ 95-Node Multi-Disciplinary Knowledge Graph**
   - Interactive force-clustered visualization preserving all academic entities (`Paper`, `Algorithm`, `Dataset`, `Methodology`, `Research Topic`, `Domain`, `Department`, `Technology`).
   - Touchpad pinch-to-zoom (`zoomOnPinch`) and two-finger scroll panning (`panOnScroll`).
   - Neighborhood focus on hover: directly connected edges and nodes highlight while unrelated nodes fade.
   - Search-to-focus: typing any concept zooms to 1.3x and opens the live slide-out entity inspector.

2. **🤖 Anveshan Research Assistant**
   - 5-node LangGraph agentic RAG workflow traversing 768-dimensional vector embeddings and multi-hop entity relationships.
   - Grounded citations and structured cross-departmental connection cards.

3. **🔗 Hidden Cross-Disciplinary Synergies**
   - Algorithmic radar detecting shared methodologies and datasets across isolated faculties (e.g. Cybersecurity ⟷ Statistics, Data Science ⟷ Biotechnology).

4. **📑 Potential Research Overlap Detection**
   - Calculates semantic and structural document similarity with configurable threshold filters and academic advisories to foster early co-authorship.

5. **📤 Multi-Source Ingestion & Document Manager**
   - **Local File Dropzone:** PDFs, Markdown (`.md`), and ZIP repositories.
   - **Public Document Link Ingestion:** Direct HTTP/HTTPS parser for open-access papers (arXiv, GitHub raw files, university journals).
   - **Multi-Link Comparison:** Ingests and synthesizes 2 to 5 public document links simultaneously.
   - **Document Removal:** Clean one-click delete with cascading graph cleanup.

6. **🎨 Linear + Vercel Design System & Uniform Top Navigation**
   - Clean, centered responsive layout (`.app-container`).
   - Uniform equal-sized top navbar buttons with defined borders and glowing hover shine.
   - Built-in Dark Mode and Light Mode with persistent `localStorage` state.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, `@xyflow/react`, Lucide React |
| **Backend** | FastAPI, Python 3.12+, Pydantic v2, Uvicorn, HTTPX |
| **Database & Vectors** | Dual-Mode Engine: Local SQLite (`sqlite+aiosqlite`) & Production PostgreSQL (`pgvector 16`), 768-dim normalized cosine vectors |
| **RAG & Agentic Synthesis** | 5-Node LangGraph Pipeline (Intent Router → Graph Entity Extractor → Vector Retriever → Synthesis Synthesizer → Citation Validator) |
| **Containerization** | Docker, Multi-Stage Dockerfile, Docker Compose v2 |

---

## 🚀 Quick Start (Docker Compose)

The entire application stack (Database, FastAPI Backend, Next.js Frontend) can be launched with a single command:

```bash
docker-compose up --build
```

- **Frontend Application:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8080](http://localhost:8080)
- **Interactive Swagger Docs:** [http://localhost:8080/docs](http://localhost:8080/docs)

---

## 💻 Manual Local Development

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run backend dev server on port 8080
python -m uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

### 2. Frontend Setup

```bash
cd frontend
npm install

# Run frontend dev server on port 3000
npm run dev
```

---

## 🧪 Testing & Validation

Run the automated backend test suite:

```bash
cd backend
python -m pytest tests/ -v
```

**Results:** `34 passed` covering security sanitization, zip-slip defense, text chunking, overlap labeling, and config.

---

## 📚 API Endpoints Overview

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Healthcheck and database connectivity status |
| `GET` | `/api/stats/dashboard` | Corpus metrics, entity distributions, and ingestion feed |
| `GET` | `/api/graph/` | Full 95-node, 255-edge ontology graph |
| `GET` | `/api/graph/entity/{id}` | Detailed entity metadata, referenced papers, and relationships |
| `POST` | `/api/assistant/query` | 5-node LangGraph agentic research synthesis |
| `GET` | `/api/search/` | 768-dim semantic search across papers and entities |
| `GET` | `/api/connections/insights` | Ranked cross-disciplinary connection discoveries |
| `GET` | `/api/overlap/insights` | Potential research overlap signals and excerpts |
| `POST` | `/api/documents/upload` | Ingest local PDF / Markdown / ZIP files |
| `POST` | `/api/documents/ingest-url` | Ingest single public document URL |
| `POST` | `/api/documents/compare-links` | Compare and synthesize 2–5 public document URLs |
| `DELETE` | `/api/documents/{id}` | Delete document and cascade delete graph nodes |

---

## 📜 License
MIT License. Built for the Google PromptWars Hackathon (Graph Theory & Data Synthesis Track).

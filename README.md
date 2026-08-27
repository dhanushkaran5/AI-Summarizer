# ANTI-SUMMARY: Adaptive Document Intelligence Platform

> **Not simply shorter text — an adaptive understanding layer.**

ANTI-SUMMARY transforms complex documents into multi-depth representations (Levels 0 through 5) tailored across 9 audience modes, backed by anti-hallucination source verification, an internal contradiction engine, and a semantic knowledge graph.

---

## ⚡ Key Capabilities

1. **Multi-Depth Understandings (Levels 0–5)**:
   - **Level 0 (Essence)**: Exactly one concise sentence capturing the core thesis.
   - **Level 1 (Executive)**: High-level executive overview with bulleted highlights.
   - **Level 2 (Structured)**: Mode-specific deep-dive breakdown.
   - **Level 3 (Sections)**: Section-by-section breakdown with takeaway summaries.
   - **Level 4 (Deep Technical)**: In-depth methodological, algorithmic, and architectural evaluation.
   - **Level 5 (Knowledge Base)**: Self-contained Q&A knowledge base.

2. **9 Specialized Audience Modes**:
   - `Executive`, `Student`, `Research`, `Technical`, `Beginner (ELI5)`, `Meeting`, `Exam Prep`, `Legal & Policy`, `Custom`.

3. **Grounded RAG with Anti-Hallucination Claim Verification**:
   - Every answer classifies claim support into: `EXPLICITLY STATED`, `INFERRED`, `UNCERTAIN`, or `NOT FOUND`.
   - Interactive **View Source** split pane allows users to click citations to inspect the exact original document paragraph, page number, and similarity score.

4. **Contradiction & Consistency Engine**:
   - Cross-section semantic audit that automatically detects opposing numbers, conflicting requirements, and changed dates across pages.

5. **Semantic Document Knowledge Map**:
   - Visual hierarchical concept tree categorizing entities and linking them directly back to source evidence.

6. **Change Detection ("What Changed?")**:
   - Version-aware diffing to compare evolving document releases.

7. **The Anti-Gravity Principle (Graceful Degradation)**:
   - Resilient multi-tier architecture with offline local heuristic engines and in-memory vector stores ensuring 100% platform availability if external LLMs or vector databases are unavailable.

8. **WCAG 2.1 Level AA Accessibility**:
   - Visible high-contrast focus rings, skip-to-main-content link, keyboard navigable controls, 44x44px touch targets, and text scaling support up to 200%.

---

## 🛠️ Technology Stack

- **AI Service**: Python 3.10+, FastAPI, Uvicorn, Sentence-Transformers, ChromaDB / In-Memory Cosine Store, PyPDF2, python-docx, python-pptx.
- **Backend**: Java 17+, Spring Boot 3.4.2, Spring Data JPA, Spring Security, JWT, H2 / PostgreSQL, Jackson.
- **Frontend**: Vite 8, React 19, TypeScript, TailwindCSS 4, Lucide Icons.

---

## 🚀 Quick Start

### 1. Start AI Intelligence Service
```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Start Spring Boot Backend
```bash
cd backend
./mvnw spring-boot:run
```

### 3. Start Frontend Workspace
```bash
cd frontend
npm install
npm run dev
```

Visit **http://localhost:5173** to access ANTI-SUMMARY.

---

## 🧪 Verification & Testing

- **Python AI Suite**: `python -m pytest ai-service/tests -v` (8/8 tests pass)
- **Java Backend Suite**: `./backend/mvnw test` (All unit & context tests pass)
- **Frontend Production Bundle**: `npm --prefix frontend run build` (Clean Vite build)

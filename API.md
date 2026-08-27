# API Reference: ANTI-SUMMARY

## Backend Endpoints (Spring Boot Port: `8080`)

### Authentication
- `POST /api/auth/register` — Create a new user profile.
- `POST /api/auth/login` — Authenticate and receive JWT.

### Documents & Ingestion
- `POST /api/documents/upload` — Multipart upload. Returns document metadata & async `jobId`.
- `GET /api/documents` — List user documents.
- `GET /api/documents/{id}` — Get document metadata.
- `DELETE /api/documents/{id}` — Safe deletion of document and vectors.
- `GET /api/documents/{id}/intelligence` — Reading time, word count, key concepts.
- `GET /api/documents/{id}/contradictions` — Inconsistency report across sections.
- `GET /api/documents/{id}/knowledge-map` — Semantic concept tree.

### Async Jobs
- `GET /api/jobs/{jobId}` — Poll ingestion status (`progressPercent`, `status`, `stageDescription`).

### Multi-Depth Summaries
- `POST /api/documents/{id}/summarize/multi-level` — Generate Levels 0 through 5 for selected mode.
- `POST /api/documents/{id}/summarize` — Generate standard summary.
- `GET /api/documents/{id}/summaries` — Retrieve history of generated summaries.

### Grounded Chat & RAG
- `POST /api/documents/{id}/chat` — Grounded Q&A with claim verification and sources.
- `GET /api/documents/{id}/conversations` — Retrieve conversation threads.

---

## AI Intelligence Service Endpoints (FastAPI Port: `8000`)

- `GET /ready` — Service readiness probe.
- `GET /metrics` — Operational runtime metrics.
- `POST /api/extract` — Extract text & structural metadata.
- `POST /api/summarize/multi-level` — Multi-level summary generator.
- `POST /api/contradictions` — Cross-section contradiction detector.
- `POST /api/knowledge-map` — Concept graph constructor.
- `POST /api/chat` — Grounded RAG with anti-hallucination labeling.

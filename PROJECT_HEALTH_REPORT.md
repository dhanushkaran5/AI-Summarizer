# PROJECT HEALTH REPORT — "ANTI-SUMMARY" (IntelliDoc AI Rebuild)

**Date**: 2026-08-23  
**Project Codename**: ANTI-SUMMARY  
**Author**: Lead AI Engineer, Full-Stack Architect, UX Designer, Accessibility Engineer, ML Engineer, QA Engineer & DevOps Engineer  
**Status**: Comprehensive Diagnostic Complete — Ready for Rebuild Execution  

---

## 1. Executive Summary & Architecture Overview

The system under inspection ("IntelliDoc AI / ANTI-SUMMARY") was intended to be an end-to-end AI document intelligence platform consisting of:
1. **Frontend**: React 19 + TypeScript + Vite + TailwindCSS 4
2. **Backend**: Spring Boot 3.4.2 (Java 17) + Spring Security + Spring Data JPA + H2 / PostgreSQL
3. **AI Service**: FastAPI + Sentence-Transformers + ChromaDB + Mock/OpenAI/Gemini LLM providers

While the foundational scaffolding is in place, the application suffers from **critical architectural flaws, missing modules, logic bugs in core chunking algorithms, synchronous processing bottlenecks, missing multi-format extractors, lack of accessibility compliance, and absence of the core ANTI-SUMMARY intelligence layers** (Multi-level Summaries L0–L5, Contradiction Engine, Semantic Knowledge Map, Version Change Detection, and Failure-First UX).

```
CURRENT ARCHITECTURE (FRAGILE & SYNCHRONOUS):
Client (React) ──[HTTP Sync]──> Spring Boot API ──[HTTP Sync]──> FastAPI AI Service ──> Mock LLM / ChromaDB
                                  │ (Blocks thread)               │ (Chunking bug, missing real providers)
                                  ▼                               ▼
                               H2 / Postgres (Missing entities) Local FS
```

```
TARGET REBUILT ARCHITECTURE (RESILIENT, ASYNC & EVIDENCE-GROUNDED):
Client (React 19 / WCAG AA) 
       │
   [REST / SSE]
       ▼
Spring Boot 3.4 Gateway & Service Layer ◄── Async Processing Queue / Job Scheduler
       │                                         │
       ├── JPA / PostgreSQL / H2 (Full Schema)   │ (Progress: 0% → 100%)
       │   ├── Document, Sections, Chunks        ▼
       │   ├── Summaries (L0-L5), Citations   FastAPI AI Service
       │   ├── Contradictions, KnowledgeMap      ├── Ingestion Pipeline (PDF, DOCX, PPTX, TXT, MD, HTML, CSV)
       │   └── Jobs, User Preferences            ├── OCR Fallback Pipeline
       │                                         ├── Semantic Segmentation & Structure Detection
       │                                         ├── Hybrid Search & Verified RAG
       │                                         ├── Contradiction & Change Engine
       │                                         └── Multi-Provider LLM (OpenAI, Gemini, Local/Mock)
       ▼
Graceful Degradation Fallbacks (Functions even if LLM or Vector DB is Offline)
```

---

## 2. Comprehensive Issue Registry

The following table records every identified issue across files, lines, severity, root cause, impact, and recommended fix:

| # | File | Line(s) | Severity | Category | Root Cause | Impact | Recommended Fix |
|---|------|---------|----------|----------|------------|--------|-----------------|
| 1 | `ai-service/app/providers/factory.py` | 20, 23 | **CRITICAL** | AI / Missing Files | Imports `OpenAIProvider` and `GeminiProvider` which do not exist in `app/providers/` | Service crashes immediately with `ModuleNotFoundError` when `AI_PROVIDER=openai` or `AI_PROVIDER=gemini` is configured | Implement resilient `OpenAIProvider` and `GeminiProvider` classes with retry policies, rate limiting, and graceful fallback to mock/deterministic engine |
| 2 | `ai-service/app/services/chunker.py` | 107-108 | **HIGH** | AI / Logic Bug | Condition `if current_pos <= current_pos - chunk_overlap + chunk_overlap:` is always true, immediately setting `current_pos = best_split` | Chunk overlap is completely destroyed (0 overlap). Boundary sentences between chunks are lost during semantic retrieval | Fix chunk pointer progression: `current_pos = max(current_pos + 1, best_split - chunk_overlap)` with strict guard against infinite loops |
| 3 | `ai-service/app/services/extractor.py` | 15-20 | **HIGH** | Ingestion / Formats | Only handles `.pdf`, `.docx`, `.pptx`, `.txt`. Missing Markdown, HTML, CSV, and OCR fallback | Uploading `.md`, `.html`, `.csv`, or scanned PDFs fails or produces blank output | Add extractors for Markdown, HTML, CSV; add image/scanned PDF OCR detection and graceful error messaging |
| 4 | `backend/src/main/java/com/intellidoc/service/DocumentService.java` | 42-126 | **HIGH** | Architecture / Performance | Synchronous end-to-end blocking pipeline (`uploadAndProcess`) blocks HTTP request threads through extraction, chunking, and embedding | Large documents cause HTTP gateway timeouts (504), thread pool starvation, and UI freezing | Implement asynchronous job-based processing (`ProcessingJob`) with status progression (0%–100%) and async workers |
| 5 | `backend/src/main/java/com/intellidoc/entity/` | N/A | **MEDIUM** | Database / Data Model | Missing schema entities: `DocumentVersion`, `DocumentSection`, `Citation`, `EmbeddingMetadata`, `ProcessingJob`, `UserPreference` | Cannot persist multi-level summaries, section hierarchies, version diffs, or background job logs cleanly in DB | Create JPA entities and repositories for all missing models with proper indexing and foreign key constraints |
| 6 | `ai-service/app/services/summarizer.py` | 6-54 | **HIGH** | AI / Feature Gap | Only generates single monolithic summary structure with 3 lengths and 4 levels; lacks ANTI-SUMMARY L0–L5 hierarchy and 9 specialized modes | System acts like a traditional summarizer rather than a multi-depth understanding platform | Implement full 6-level hierarchy (L0: Essence, L1: Executive, L2: Detailed, L3: Section-by-section, L4: Deep Technical, L5: Q&A Knowledge Base) and 9 specialized modes |
| 7 | `ai-service/app/services/` | N/A | **HIGH** | AI / Feature Gap | Contradiction Engine and Semantic Knowledge Map modules are absent from backend and AI service | Cannot detect conflicting statements across document sections or visualize concept trees | Build `contradiction_engine.py` (cross-section conflict detection) and `knowledge_mapper.py` (hierarchical concept graph builder) |
| 8 | `backend/src/main/java/com/intellidoc/config/SecurityConfig.java` | 65 | **MEDIUM** | Security | `configuration.setAllowedOriginPatterns(List.of("*"))` paired with `allowCredentials(true)` | Overly permissive CORS policy poses CSRF/credential leakage risks in production environments | Restrict allowed origins to configurable environment-based whitelists with strict header policies |
| 9 | `backend/src/main/resources/application.yml` | 47 | **MEDIUM** | Security | Hardcoded JWT secret key fallback in configuration | Insecure default in production if environment variable is not explicitly supplied | Require strong 256-bit secret validation on application startup; reject insecure default in `prod` profile |
| 10 | `backend/src/main/java/com/intellidoc/controller/` | All | **MEDIUM** | API Design / Resilience | Controllers throw generic unhandled `RuntimeException` leading to uninformative 500 error payloads | Violates failure-first UX principle; frontend receives generic error strings with no recovery guidance | Implement `@RestControllerAdvice` Global Exception Handler returning RFC 7807 problem details with actionable user remedies |
| 11 | `frontend/src/pages/DocumentPage.tsx` | 136-484 | **HIGH** | UX / Accessibility | No "View Source" interactive split-pane, missing WCAG 2.1 AA keyboard landmarks, no skip-to-content link, no high-contrast support | Fails accessibility compliance; users cannot jump from summary claim directly to highlighted document source text | Rebuild Document Workspace with accessible split-view layout, source-claim tracing, ARIA landmarks, and focus rings |
| 12 | `frontend/src/pages/` | N/A | **MEDIUM** | UX / Architecture | Missing dedicated navigation routes: Ask Document, Knowledge Map, Contradictions, Version Compare, Settings | Navigation is fragmented across tabs inside a single document page rather than a cohesive intelligence platform | Add dedicated top-level and in-document views for Ask Document, Knowledge Map, Compare, and System Settings |
| 13 | `ai-service/tests` | N/A | **MEDIUM** | Testing / QA | Zero unit or integration tests in `ai-service` (no test files present) | Regressions in extraction, RAG, and AI generation go completely undetected | Add comprehensive pytest suite covering extractors, chunker, RAG pipeline, anti-hallucination verification, and mock providers |
| 14 | `backend/src/test/` | 1 | **MEDIUM** | Testing / QA | Only 1 bare default test class (`IntelliDocBackendApplicationTests.java`) | API endpoints, security authentication, and service workflows lack automated test coverage | Add Spring Boot MockMvc unit and integration tests covering Auth, Document, Summary, Chat, and Collection APIs |
| 15 | `docker-compose.yml` | N/A | **MEDIUM** | DevOps / Deployment | No root `docker-compose.yml` or multi-stage Dockerfiles for automated container orchestration | Developers and CI/CD pipelines must manually run three separate runtimes without container parity | Create production-grade Dockerfiles for Frontend, Backend, and AI Service, plus unified `docker-compose.yml` with dev/prod profiles |

---

## 3. Deep Architectural Diagnosis by Subsystem

### 3.1 AI Service & Ingestion Pipeline
- **Missing Multi-format Ingestion**: Text extraction is currently fragile. PDFs with complex formatting or non-standard encodings fail silently. Missing support for Markdown (`.md`), HTML (`.html`), and tabular CSV (`.csv`).
- **Chunking Flaw**: Due to the arithmetic bug on line 107 of `chunker.py`, the overlapping window mechanism was effectively disabled. Every chunk started exactly at `best_split`, causing queries matching cross-boundary sentences to receive low similarity scores.
- **Provider Architecture**: `factory.py` attempted to dynamically import non-existent `OpenAIProvider` and `GeminiProvider` files. The system only worked in `mock` mode.
- **Anti-Hallucination & Evidence Grounding**: The RAG pipeline (`rag_pipeline.py`) performs vector retrieval, but lacks explicit categorization of claims into `EXPLICITLY STATED`, `INFERRED`, `UNCERTAIN`, and `NOT FOUND`.

### 3.2 Backend Service & Data Layer
- **Synchronous Bottleneck**: When `POST /api/documents/upload` is invoked, Spring Boot performs file I/O, calls FastAPI `/api/extract`, receives chunks, saves them to H2/Postgres, calls `/api/embed`, and only then returns. For a 20-page PDF, this blocks the connection for 5–15 seconds.
- **Data Model Omissions**: To support document versioning, citation mappings, contradiction tracking, semantic knowledge graphs, and asynchronous job states, additional database tables are required.

### 3.3 Frontend & User Experience
- **Aesthetics & Design System**: The current UI is a standard dashboard. It lacks the rich glassmorphism, refined micro-animations, purple-accented visual hierarchy, and multi-depth summary controls specified for "ANTI-SUMMARY".
- **Accessibility Gaps (WCAG 2.1 Level AA)**:
  - Missing `<main id="main-content">` and "Skip to main content" link.
  - Interactive custom elements lack `aria-expanded`, `aria-controls`, `aria-selected`, and `role="tab"`.
  - Focus outlines are suppressed or missing high-visibility focus indicators.
  - Touch targets on several icon buttons are 32×32px (below the required 44×44px minimum).
- **Failure-First UX**: Errors in upload or processing simply show "Upload failed" or "Processing failed". There is no diagnostic guidance explaining *why* it failed (e.g. malformed PDF header, scanned document requiring OCR) and *how* the user can resolve it.

---

## 4. Rebuild Roadmap & Phased Execution Plan

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ANTI-SUMMARY REBUILD ROADMAP                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ Checkpoint 1: Diagnostic Report & Health Audit (CURRENT STAGE)             │
│ Checkpoint 2: Dependency, Provider & Asset Recovery (OpenAI/Gemini/Ingest) │
│ Checkpoint 3: Core Architecture Rebuild (Async Jobs, L0-L5, Contradictions) │
│ Checkpoint 4: Comprehensive Test Suites (Python Pytest + Java JUnit + E2E)  │
│ Checkpoint 5: Accessibility (WCAG 2.1 AA) & Performance Validation         │
│ Checkpoint 6: Production Delivery, Documentation & Deployment Assets        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Resilience & Degradation Matrix (The Anti-Gravity Test)

| Failure Scenario | Current Behavior | Target ANTI-SUMMARY Rebuilt Behavior |
|------------------|------------------|---------------------------------------|
| **AI LLM API Unavailable** | Returns 500 error / fails completely | Gracefully falls back to deterministic extractive summary, structure analyzer, keyword graph, and local heuristics with clear user banner |
| **Vector DB / ChromaDB Unavailable** | Chat and search fail with exception | Falls back to BM25 / TF-IDF keyword retrieval and section-based exact-match search |
| **Uploaded Document is Corrupted** | Generic 400 error | Explains exact corruption point (e.g., EOF marker missing), attempts partial text recovery, suggests OCR / alternative format |
| **Scanned PDF (No Text Layer)** | Empty extraction / blank summary | Detects 0 text layer, alerts user with OCR recommendation and provides one-click OCR processing |
| **1,000 Concurrent Uploads** | Thread starvation & server crash | Queue-backed async processing with job worker throttling, progress persistence, and rate limiting |

---
*Report certified by Lead AI Engineer & Full-Stack Architect.*

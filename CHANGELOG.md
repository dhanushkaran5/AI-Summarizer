# Changelog: ANTI-SUMMARY Rebuild

All notable changes to the Document Intelligence platform are documented below.

## [2.0.0] - 2026-08-23

### Fixed
- **Missing AI Providers**: Implemented `openai_provider.py` and `gemini_provider.py` with exponential backoff and mock fallback.
- **Chunker Overlap Bug**: Fixed condition in `chunker.py` ensuring sliding overlap windows and character boundary tracking.
- **Synchronous Upload Bottleneck**: Replaced blocking ingestion with non-blocking asynchronous `JobService` with polling at `/api/jobs/{id}`.

### Added
- **Multi-Depth Summarization (Levels 0–5)**: Added adaptive understanding layer (Essence, Executive, Structured, Sectional, Deep Tech, Q&A KB) across 9 audience modes.
- **Anti-Hallucination Claim Verification**: Grounded RAG now labels claims as `EXPLICITLY STATED`, `INFERRED`, `UNCERTAIN`, or `NOT FOUND`.
- **Interactive "View Source" Split-Pane**: Users can click citations in chat or summaries to inspect original document text and character spans.
- **Contradiction & Consistency Engine**: Cross-section scanner for conflicting requirements, values, and dates.
- **Semantic Knowledge Map**: Hierarchical concept tree linked back to document evidence.
- **WCAG 2.1 Level AA Accessibility**: High-contrast focus rings, skip-to-content links, 44x44px touch targets, and text scaling support up to 200%.
- **New Extractors**: Full support for Markdown (`.md`), HTML (`.html`), and CSV (`.csv`) along with PDF, DOCX, PPTX, TXT.
- **Comprehensive Documentation & Testing**: 8/8 Pytest suite, Spring Boot tests, and complete technical guides.

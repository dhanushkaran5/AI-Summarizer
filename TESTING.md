# Testing & Verification Guide: ANTI-SUMMARY

## Test Coverage Overview

1. **AI Intelligence Engine Tests (`ai-service/tests/test_ai_service.py`)**:
   - `test_chunker_overlap_retention`: Verifies chunk overlap preservation and character offset tracking.
   - `test_document_classifier`: Validates auto-detection of research, technical, and general formats.
   - `test_document_intelligence_metrics`: Asserts word counts, reading speeds, and key concepts.
   - `test_extractors_txt_md_csv`: Validates plain text, markdown, and CSV file extraction.
   - `test_contradiction_engine`: Verifies cross-section semantic conflict detection.
   - `test_knowledge_mapper`: Asserts hierarchical concept graph construction.
   - `test_multi_level_summary`: Validates generation of Levels 0 through 5 across modes.
   - `test_rag_pipeline_with_claim_status`: Asserts source citation generation and claim status classification.

2. **Backend Unit & Integration Tests (`backend/src/test/java/com/intellidoc/`)**:
   - `IntelliDocBackendApplicationTests`: Validates Spring context, JPA entity mapping, and repository wiring.
   - `SummaryServiceTest`: Unit test mocking AI Service client and validating multi-level summary DTO responses.

3. **Frontend Production Build Test**:
   - TypeScript static type checking and Vite production bundling.

---

## Running Test Suites

### AI Service (Python):
```powershell
$env:PYTHONPATH="."; python -m pytest tests -v
```

### Backend (Java):
```powershell
.\mvnw.cmd test
```

### Frontend (TypeScript / Vite):
```powershell
npm run build
```

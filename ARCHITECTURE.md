# System Architecture: ANTI-SUMMARY

## High-Level Architecture Overview

```mermaid
graph TD
    Client["Frontend Workspace (React 19 + TypeScript)"] -->|"REST API + JWT"| Gateway["Spring Boot 3.4.2 API Backend"]
    
    subgraph "Backend Core"
        Gateway --> Auth["Security & Auth Service"]
        Gateway --> DocService["Document & Version Service"]
        Gateway --> JobService["Async Processing Job Scheduler"]
        Gateway --> SummaryService["Multi-Depth Summary Service"]
        Gateway --> DB[("Database (H2 / PostgreSQL)")]
    end
    
    subgraph "AI Intelligence Service (FastAPI)"
        JobService -->|"HTTP Async"| Extractor["Text & Structure Extractor (PDF/DOCX/PPTX/MD/CSV)"]
        Extractor --> Chunker["Boundary & Overlap Chunker"]
        Chunker --> Embed["Vector Store (ChromaDB + In-Memory Fallback)"]
        
        Gateway -->|"HTTP Sync/Async"| MultiLevel["Multi-Depth Engine (L0-L5)"]
        Gateway -->|"HTTP"| ContradictionEngine["Contradiction & Consistency Scanner"]
        Gateway -->|"HTTP"| KnowledgeMapper["Semantic Knowledge Graph Generator"]
        Gateway -->|"HTTP"| RAGPipeline["Grounded RAG & Anti-Hallucination Labeler"]
        
        MultiLevel --> LLMProvider["LLM Factory (Gemini / OpenAI / Local Heuristic)"]
        RAGPipeline --> LLMProvider
    end
```

## The Anti-Gravity Principle: Graceful Degradation Strategy

| Failure Scenario | Fallback Mechanism | User Experience Impact |
|---|---|---|
| **External LLM Outage** | Switches dynamically to `Local Heuristic Engine` | Summaries generated instantaneously using linguistic pattern extractors. No 500 error. |
| **Vector DB Unavailable** | Switches dynamically to `In-Memory Cosine Store` | Similarity search executed in memory via dot-product normalization. |
| **Scanned / Image PDF** | Scanned page detector with OCR advisory | System informs user and provides failure-first diagnostic guidance. |
| **High Traffic Spike** | Non-blocking async `ProcessingJob` architecture | User receives instant Job ID and can monitor stage-by-stage progress (0-100%). |
| **Network Disconnect** | Standard RFC 7807 problem details with user remedy | Clear remediation instructions returned instead of generic error codes. |

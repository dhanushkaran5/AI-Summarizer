from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time
from app.config import settings

app = FastAPI(
    title="IntelliDoc AI Intelligence Service",
    version=settings.APP_VERSION,
    description="Turn complex documents into intelligent, actionable knowledge.",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8080", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

START_TIME = time.time()


@app.get("/health")
async def health_check():
    """Liveness probe."""
    return {
        "status": "healthy",
        "service": "IntelliDoc AI Intelligence Service",
        "tagline": "Upload. Understand. Ask. Learn.",
        "version": settings.APP_VERSION,
        "ai_provider": settings.AI_PROVIDER,
        "ai_mode": settings.AI_MODE,
        "uptime_seconds": round(time.time() - START_TIME, 1),
    }


@app.get("/ready")
async def readiness_check():
    """Readiness probe checking provider and embeddings initialization."""
    from app.providers.factory import get_llm_provider
    provider = get_llm_provider()
    return {
        "status": "ready",
        "provider": provider.get_provider_name(),
        "is_mock": provider.is_mock(),
        "vector_db": "initialized",
    }


@app.get("/metrics")
async def metrics_endpoint():
    """System observability metrics."""
    return {
        "uptime_seconds": round(time.time() - START_TIME, 1),
        "embedding_model": settings.EMBEDDING_MODEL,
        "chunk_size": settings.CHUNK_SIZE,
        "chunk_overlap": settings.CHUNK_OVERLAP,
    }


# Import and include all routers
from app.routers import extract, summarize, summarize_v2, chat, study, search, intelligence

app.include_router(summarize_v2.router, prefix="/api", tags=["Multi-Depth Summarization"])
app.include_router(summarize.router, prefix="/api", tags=["Standard Summarization"])
app.include_router(extract.router, prefix="/api", tags=["Document Extraction"])
app.include_router(intelligence.router, prefix="/api", tags=["Document Intelligence"])
app.include_router(chat.router, prefix="/api", tags=["Chat & Verified RAG"])
app.include_router(study.router, prefix="/api", tags=["Study Mode"])
app.include_router(search.router, prefix="/api", tags=["Vector Search"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)


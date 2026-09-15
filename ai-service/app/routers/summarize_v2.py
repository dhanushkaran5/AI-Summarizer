"""Summarize AI V2 API router.

Endpoints:
- POST /api/summarize/v2: Primary full-featured summarization endpoint
- POST /api/summarize: Adaptive legacy/v1 endpoint updated with new capabilities
- POST /api/detect-language: Standalone fast language detector
- POST /api/quality-metrics: Standalone ROUGE/readability calculator
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.services.summarize_engine import process_summarization
from app.services.language_detection import detect_language
from app.services.quality import compute_quality_metrics

router = APIRouter()


class SummarizeRequestV2(BaseModel):
    text: str = Field(..., min_length=20, description="Source text to summarize")
    mode: str = Field(default="hybrid", description="Summarization mode: hybrid, extractive, abstractive")
    length: str = Field(default="standard", description="Summary length: brief, standard, detailed")
    persona: str = Field(default="executive", description="Target persona: executive, academic, technical, casual")
    language: Optional[str] = Field(default="auto", description="Target or detected language code, e.g. en, ta, es, auto")
    document_id: Optional[str] = Field(default=None, description="Optional document tracking ID")


class LanguageDetectionRequest(BaseModel):
    text: str = Field(..., min_length=5, description="Text for language detection")


class QualityMetricsRequest(BaseModel):
    source_text: str = Field(..., description="Original reference text")
    summary_text: str = Field(..., description="Generated summary text")


@router.post("/summarize/v2")
async def summarize_v2_endpoint(request: SummarizeRequestV2):
    """Generate intelligent summary with persona, mode, metrics, sentiment, insights, and traceability."""
    try:
        result = await process_summarization(
            text=request.text,
            mode=request.mode,
            length=request.length,
            persona=request.persona,
            language=request.language
        )
        result["document_id"] = request.document_id
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")


@router.post("/detect-language")
async def detect_language_endpoint(request: LanguageDetectionRequest):
    """Detect language of text with confidence score."""
    return detect_language(request.text)


@router.post("/quality-metrics")
async def calculate_quality_metrics_endpoint(request: QualityMetricsRequest):
    """Compute ROUGE, readability, compression, and confidence metrics."""
    return compute_quality_metrics(request.source_text, request.summary_text)

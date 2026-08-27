from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class SummarizeRequest(BaseModel):
    document_id: str
    text: str
    chunks: list[dict] = []
    length: str = "standard"  # brief, standard, detailed
    level: str = "student"  # beginner, student, professional, expert
    document_type: Optional[str] = None  # auto-detect if not provided


class SummarizeResponse(BaseModel):
    document_id: str
    document_type: str
    summary: dict
    mock: bool
    length: str
    level: str


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_document(request: SummarizeRequest):
    """Generate an adaptive summary based on document type."""
    from app.services.classifier import classify_document
    from app.services.summarizer import generate_summary

    # Auto-detect document type if not provided
    doc_type = request.document_type or classify_document(request.text)

    # Generate summary
    summary_result = await generate_summary(
        text=request.text,
        chunks=request.chunks,
        doc_type=doc_type,
        length=request.length,
        level=request.level,
    )

    return SummarizeResponse(
        document_id=request.document_id,
        document_type=doc_type,
        summary=summary_result["summary"],
        mock=summary_result["mock"],
        length=request.length,
        level=request.level,
    )

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ChatRequest(BaseModel):
    document_id: str
    question: str
    conversation_history: list[dict] = []
    collection_ids: list[str] = []


class Source(BaseModel):
    page_number: Optional[int] = None
    section: Optional[str] = None
    chunk_id: str
    text_preview: str
    relevance_score: float


class VerificationResult(BaseModel):
    status: str  # "supported", "partially_supported", "unsupported"
    confidence: float
    evidence_count: int
    details: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source]
    verification: VerificationResult
    mock: bool
    document_id: str


@router.post("/chat", response_model=ChatResponse)
async def chat_with_document(request: ChatRequest):
    """RAG-based question answering with source citations and evidence verification."""
    from app.services.rag_pipeline import rag_query

    result = await rag_query(
        document_id=request.document_id,
        question=request.question,
        conversation_history=request.conversation_history,
        collection_ids=request.collection_ids,
    )

    return ChatResponse(**result)


class CompareRequest(BaseModel):
    document_ids: list[str]
    question: Optional[str] = None
    aspects: list[str] = []


class CompareResponse(BaseModel):
    comparison: dict
    sources: list[dict]
    mock: bool


@router.post("/compare", response_model=CompareResponse)
async def compare_documents(request: CompareRequest):
    """Compare multiple documents and generate structured comparison."""
    from app.services.comparator import compare_documents

    result = await compare_documents(
        document_ids=request.document_ids,
        question=request.question,
        aspects=request.aspects,
    )

    return CompareResponse(**result)

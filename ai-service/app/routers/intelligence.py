"""Intelligence router exposing Contradiction Engine, Knowledge Map, and Multi-Level Summaries."""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

router = APIRouter()


class ContradictionRequest(BaseModel):
    document_id: str
    text: str
    chunks: Optional[List[Dict[str, Any]]] = []


class ContradictionResponse(BaseModel):
    document_id: str
    contradictions: List[Dict[str, Any]]
    count: int
    mock: bool


class KnowledgeMapRequest(BaseModel):
    document_id: str
    text: str
    chunks: Optional[List[Dict[str, Any]]] = []


class KnowledgeMapResponse(BaseModel):
    document_id: str
    title: str
    root: Dict[str, Any]
    mock: bool


class MultiLevelSummaryRequest(BaseModel):
    document_id: str
    text: str
    chunks: Optional[List[Dict[str, Any]]] = []
    mode: str = "student"
    target_level: int = 2


class MultiLevelSummaryResponse(BaseModel):
    document_id: str
    mode: str
    level_0: str
    level_1: str
    level_2: Dict[str, str]
    level_3: List[Dict[str, Any]]
    level_4: str
    level_5: List[Dict[str, str]]
    mock: bool


@router.post("/contradictions", response_model=ContradictionResponse)
async def check_contradictions(request: ContradictionRequest):
    """Scan document for internal cross-section contradictions."""
    from app.services.contradiction_engine import detect_contradictions
    from app.providers.factory import get_llm_provider

    contradictions = await detect_contradictions(
        document_id=request.document_id,
        text=request.text,
        chunks=request.chunks,
    )
    provider = get_llm_provider()
    return ContradictionResponse(
        document_id=request.document_id,
        contradictions=contradictions,
        count=len(contradictions),
        mock=provider.is_mock(),
    )


@router.post("/knowledge-map", response_model=KnowledgeMapResponse)
async def get_knowledge_map(request: KnowledgeMapRequest):
    """Generate hierarchical concept graph with evidence links."""
    from app.services.knowledge_mapper import generate_knowledge_map
    from app.providers.factory import get_llm_provider

    km_data = await generate_knowledge_map(
        document_id=request.document_id,
        text=request.text,
        chunks=request.chunks,
    )
    provider = get_llm_provider()
    return KnowledgeMapResponse(
        document_id=request.document_id,
        title=km_data.get("title", "Document Map"),
        root=km_data.get("root", {}),
        mock=provider.is_mock(),
    )


@router.post("/summarize/multi-level", response_model=MultiLevelSummaryResponse)
async def get_multi_level_summary(request: MultiLevelSummaryRequest):
    """Generate 6-level multi-depth summary across 9 specialized audience modes."""
    from app.services.summarizer import generate_multi_level_summary

    result = await generate_multi_level_summary(
        text=request.text,
        chunks=request.chunks,
        mode=request.mode,
        target_level=request.target_level,
    )

    return MultiLevelSummaryResponse(
        document_id=request.document_id,
        mode=request.mode,
        level_0=result.get("level_0", ""),
        level_1=result.get("level_1", ""),
        level_2=result.get("level_2", {}),
        level_3=result.get("level_3", []),
        level_4=result.get("level_4", ""),
        level_5=result.get("level_5", []),
        mock=result.get("mock", True),
    )

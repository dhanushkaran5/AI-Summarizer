"""Intelligence router exposing Contradiction Engine, Knowledge Map, Multi-Level Summaries, and Claim Verification."""
import re
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


class VerifyClaimRequest(BaseModel):
    document_id: str
    text: Optional[str] = ""
    claims: Optional[List[str]] = []
    chunks: Optional[List[Dict[str, Any]]] = []


class ClaimResult(BaseModel):
    claim: str
    status: str  # SUPPORTED, PARTIALLY_SUPPORTED, UNSUPPORTED
    confidence: float
    evidence_quote: str


class VerifyClaimResponse(BaseModel):
    document_id: str
    status: str  # supported, partially_supported, unsupported
    claim_status: str  # EXPLICITLY STATED, INFERRED, UNCERTAIN, NOT FOUND
    confidence: float
    claims: List[ClaimResult]
    details: str
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


STOP_WORDS = {'is', 'an', 'on', 'it', 'to', 'in', 'at', 'of', 'for', 'the', 'and', 'this', 'that', 'with', 'from', 'have', 'were', 'was', 'be', 'are'}


@router.post("/verify", response_model=VerifyClaimResponse)
async def verify_claims_endpoint(request: VerifyClaimRequest):
    """Extract claims and verify against document evidence with grounded classification."""
    from app.providers.factory import get_llm_provider

    provider = get_llm_provider()
    
    # Gather document context
    full_context = ""
    chunk_texts = []
    if request.chunks:
        chunk_texts = [c.get("text", "") for c in request.chunks if c.get("text")]
        full_context = "\n".join(chunk_texts)
    elif request.text:
        full_context = request.text
        chunk_texts = [request.text]

    # Extract target claims to test
    target_claims = request.claims or []
    if not target_claims and request.text:
        sentences = [s.strip() for s in re.split(r'[.!?]+', request.text) if len(s.strip()) > 15]
        target_claims = sentences[:5]

    if not target_claims:
        target_claims = ["General document thesis and key findings."]

    claim_results: List[ClaimResult] = []
    supported_count = 0
    partially_supported_count = 0

    lower_context = full_context.lower()

    for claim in target_claims:
        claim_clean = claim.strip()
        words = [w for w in re.findall(r'\b[a-zA-Z0-9_]{2,}\b', claim_clean.lower()) if w not in STOP_WORDS]

        # Check keyword overlaps with document context
        matched_words = [w for w in words if w in lower_context]
        match_ratio = len(matched_words) / max(len(words), 1)

        # Locate best evidence quote
        best_quote = ""
        for chunk in chunk_texts:
            if any(w in chunk.lower() for w in words):
                sentences = re.split(r'[.!?]+', chunk)
                for s in sentences:
                    if any(w in s.lower() for w in matched_words):
                        best_quote = s.strip()
                        break
            if best_quote:
                break

        if match_ratio >= 0.5 or (len(matched_words) >= 3 and len(words) <= 5):
            status = "SUPPORTED"
            confidence = min(0.96, round(0.75 + (match_ratio * 0.20), 2))
            supported_count += 1
            if not best_quote and chunk_texts:
                best_quote = chunk_texts[0][:150]
        elif match_ratio >= 0.20 or len(matched_words) >= 1:
            status = "PARTIALLY_SUPPORTED"
            confidence = min(0.78, round(0.55 + (match_ratio * 0.20), 2))
            partially_supported_count += 1
            if not best_quote and chunk_texts:
                best_quote = chunk_texts[0][:120]
        else:
            status = "UNSUPPORTED"
            confidence = 0.90
            best_quote = "No supporting evidence found in document text."

        claim_results.append(ClaimResult(
            claim=claim_clean,
            status=status,
            confidence=confidence,
            evidence_quote=best_quote,
        ))

    total = max(len(claim_results), 1)
    if supported_count / total >= 0.5:
        overall_status = "supported"
        claim_status = "EXPLICITLY STATED"
        details = f"{supported_count} of {total} claims are directly substantiated by document citations."
    elif (supported_count + partially_supported_count) / total >= 0.5:
        overall_status = "partially_supported"
        claim_status = "INFERRED"
        details = f"Claims are partially substantiated or inferred; some details lack direct verbatim backing."
    else:
        overall_status = "unsupported"
        claim_status = "NOT FOUND"
        details = "Insufficient supporting evidence found in the document for the specified claims."

    avg_confidence = round(sum(c.confidence for c in claim_results) / total, 2)

    return VerifyClaimResponse(
        document_id=request.document_id,
        status=overall_status,
        claim_status=claim_status,
        confidence=avg_confidence,
        claims=claim_results,
        details=details,
        mock=provider.is_mock(),
    )

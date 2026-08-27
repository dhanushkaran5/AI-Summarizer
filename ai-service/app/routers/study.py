from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class StudyRequest(BaseModel):
    document_id: str
    text: str
    chunks: list[dict] = []
    difficulty: str = "medium"  # easy, medium, hard
    types: list[str] = ["mcq", "short_answer", "flashcard"]
    count: int = 5


class StudyResponse(BaseModel):
    document_id: str
    questions: list[dict]
    mock: bool
    difficulty: str


@router.post("/study-material", response_model=StudyResponse)
async def generate_study_material(request: StudyRequest):
    """Generate study material (MCQs, flashcards, etc.) from document."""
    from app.services.study_generator import generate_study_material

    result = await generate_study_material(
        document_id=request.document_id,
        text=request.text,
        chunks=request.chunks,
        difficulty=request.difficulty,
        types=request.types,
        count=request.count,
    )

    return StudyResponse(
        document_id=request.document_id,
        questions=result["questions"],
        mock=result["mock"],
        difficulty=request.difficulty,
    )

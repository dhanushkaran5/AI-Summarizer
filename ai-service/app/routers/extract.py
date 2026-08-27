from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import uuid

from app.config import settings

router = APIRouter()


class ExtractionResponse(BaseModel):
    document_id: str
    filename: str
    file_type: str
    page_count: int
    word_count: int
    char_count: int
    reading_time_minutes: float
    chunks: list[dict]
    keywords: list[str]
    status: str


class DocumentIntelligence(BaseModel):
    page_count: int
    word_count: int
    char_count: int
    reading_time_minutes: float
    section_count: int
    chunk_count: int
    keywords: list[str]
    key_concepts: list[str]


SUPPORTED_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "text/plain": "txt",
}

EXTENSION_MAP = {".pdf": "pdf", ".docx": "docx", ".pptx": "pptx", ".txt": "txt"}


@router.post("/extract", response_model=ExtractionResponse)
async def extract_document(file: UploadFile = File(...)):
    """Extract text from uploaded document, chunk it, and return structured data."""
    # Validate file type
    ext = os.path.splitext(file.filename or "")[1].lower()
    file_type = EXTENSION_MAP.get(ext)

    if not file_type:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}. Supported: PDF, DOCX, PPTX, TXT")

    # Read file content
    content = await file.read()

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE // (1024*1024)}MB")

    # Save file
    document_id = str(uuid.uuid4())
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, f"{document_id}.{file_type}")

    with open(file_path, "wb") as f:
        f.write(content)

    # Extract text
    from app.services.extractor import extract_text
    extraction_result = extract_text(file_path, file_type)

    if not extraction_result["text"]:
        raise HTTPException(status_code=422, detail="Could not extract text from document. File may be corrupted or empty.")

    # Chunk text
    from app.services.chunker import chunk_text
    chunks = chunk_text(
        text=extraction_result["text"],
        pages=extraction_result.get("pages", []),
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
    )

    # Calculate intelligence
    from app.services.intelligence import calculate_intelligence
    intelligence = calculate_intelligence(extraction_result["text"], chunks)

    return ExtractionResponse(
        document_id=document_id,
        filename=file.filename or "unknown",
        file_type=file_type,
        page_count=extraction_result.get("page_count", 1),
        word_count=intelligence["word_count"],
        char_count=intelligence["char_count"],
        reading_time_minutes=intelligence["reading_time_minutes"],
        chunks=[{
            "chunk_index": c["chunk_index"],
            "text": c["text"],
            "page_number": c.get("page_number"),
            "section": c.get("section"),
            "metadata": c.get("metadata", {}),
        } for c in chunks],
        keywords=intelligence["keywords"],
        status="extracted",
    )

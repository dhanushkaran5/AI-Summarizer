from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class EmbedRequest(BaseModel):
    document_id: str
    chunks: list[dict]


class EmbedResponse(BaseModel):
    document_id: str
    chunks_embedded: int
    status: str


class SearchRequest(BaseModel):
    document_id: str
    query: str
    top_k: int = 5


class SearchResponse(BaseModel):
    results: list[dict]
    query: str


@router.post("/embed", response_model=EmbedResponse)
async def embed_chunks(request: EmbedRequest):
    """Generate embeddings for document chunks and store in vector DB."""
    from app.services.embedding_service import embed_and_store

    result = await embed_and_store(
        document_id=request.document_id,
        chunks=request.chunks,
    )

    return EmbedResponse(**result)


@router.post("/search", response_model=SearchResponse)
async def search_vectors(request: SearchRequest):
    """Search for similar chunks using vector similarity."""
    from app.services.embedding_service import similarity_search

    results = await similarity_search(
        document_id=request.document_id,
        query=request.query,
        top_k=request.top_k,
    )

    return SearchResponse(results=results, query=request.query)

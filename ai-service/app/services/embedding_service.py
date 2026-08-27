"""Embedding and vector search service with ChromaDB and resilient In-Memory Vector Store Fallback."""
import os
import math
import hashlib
from typing import Optional
from app.config import settings

# Lazy-loaded globals
_embedding_model = None
_chroma_client = None

# Resilient In-Memory Vector Store fallback
_in_memory_store: dict[str, list[dict]] = {}


def _get_embedding_model():
    """Lazy-load the embedding model with mock fallback."""
    global _embedding_model
    if _embedding_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
            print(f"Loaded embedding model: {settings.EMBEDDING_MODEL}")
        except Exception:
            _embedding_model = "mock"
    return _embedding_model


def _get_chroma_client():
    """Lazy-load ChromaDB client with in-memory fallback."""
    global _chroma_client
    if _chroma_client is None:
        try:
            import chromadb
            os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
            _chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
        except Exception:
            _chroma_client = "in_memory"
    return _chroma_client


def _generate_embedding(text: str) -> list[float]:
    """Generate normalized embedding vector for a single text."""
    model = _get_embedding_model()
    if model == "mock":
        # Deterministic pseudo-embedding from text hash
        hash_val = hashlib.sha256(text.encode("utf-8", errors="replace")).hexdigest()
        dim = settings.EMBEDDING_DIMENSION
        vec = []
        for i in range(dim):
            byte_idx = (i * 2) % len(hash_val)
            val = float(int(hash_val[byte_idx:byte_idx+2], 16)) / 255.0 - 0.5
            vec.append(val)
        norm = math.sqrt(sum(v*v for v in vec)) or 1.0
        return [v / norm for v in vec]

    embedding = model.encode(text, show_progress_bar=False)
    return embedding.tolist()


def _generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a batch of texts."""
    model = _get_embedding_model()
    if model == "mock":
        return [_generate_embedding(t) for t in texts]

    embeddings = model.encode(texts, show_progress_bar=False, batch_size=32)
    return embeddings.tolist()


def _cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    """Calculate cosine similarity between two float vectors."""
    dot = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1))
    norm2 = math.sqrt(sum(b * b for b in vec2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return max(0.0, min(1.0, dot / (norm1 * norm2)))


async def embed_and_store(document_id: str, chunks: list[dict]) -> dict:
    """Generate embeddings for document chunks and store in ChromaDB or In-Memory Store."""
    if not chunks:
        return {"document_id": document_id, "chunks_embedded": 0, "status": "no_chunks"}

    texts = [c["text"] for c in chunks]
    embeddings = _generate_embeddings_batch(texts)

    client = _get_chroma_client()

    if client != "in_memory":
        try:
            collection_name = f"doc_{document_id.replace('-', '_')[:50]}"
            collection = client.get_or_create_collection(
                name=collection_name,
                metadata={"document_id": document_id},
            )
            ids = [f"{document_id}_chunk_{c.get('chunk_index', i)}" for i, c in enumerate(chunks)]
            metadatas = [{
                "document_id": document_id,
                "chunk_index": c.get("chunk_index", i),
                "page_number": c.get("page_number") or 1,
                "section": c.get("section") or "",
                "word_count": len(c["text"].split()),
            } for i, c in enumerate(chunks)]

            collection.upsert(
                ids=ids,
                embeddings=embeddings,
                documents=texts,
                metadatas=metadatas,
            )
            return {"document_id": document_id, "chunks_embedded": len(chunks), "status": "completed"}
        except Exception:
            pass

    # In-memory store fallback
    stored_items = []
    for i, c in enumerate(chunks):
        stored_items.append({
            "chunk_id": f"{document_id}_chunk_{c.get('chunk_index', i)}",
            "text": c["text"],
            "embedding": embeddings[i],
            "page_number": c.get("page_number", 1),
            "section": c.get("section", ""),
            "document_id": document_id,
            "metadata": c.get("metadata", {}),
        })

    _in_memory_store[document_id] = stored_items

    return {
        "document_id": document_id,
        "chunks_embedded": len(chunks),
        "status": "completed_fallback_memory",
    }


async def similarity_search(document_id: str, query: str, top_k: int = None,
                             collection_ids: list[str] = None) -> list[dict]:
    """Search for similar chunks using vector similarity with ChromaDB or In-Memory fallback."""
    if top_k is None:
        top_k = settings.TOP_K

    query_embedding = _generate_embedding(query)
    document_ids = [document_id]
    if collection_ids:
        document_ids.extend(collection_ids)

    all_results = []
    client = _get_chroma_client()

    if client != "in_memory":
        try:
            for doc_id in document_ids:
                collection_name = f"doc_{doc_id.replace('-', '_')[:50]}"
                try:
                    collection = client.get_collection(name=collection_name)
                    results = collection.query(
                        query_embeddings=[query_embedding],
                        n_results=min(top_k, collection.count()) if collection.count() > 0 else top_k,
                        include=["documents", "metadatas", "distances"],
                    )
                    if results and results["documents"] and results["documents"][0]:
                        for i, doc in enumerate(results["documents"][0]):
                            metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                            distance = results["distances"][0][i] if results["distances"] else 1.0
                            similarity = max(0.0, 1.0 - distance / 2.0)
                            all_results.append({
                                "chunk_id": results["ids"][0][i],
                                "text": doc,
                                "page_number": metadata.get("page_number", 1),
                                "section": metadata.get("section", ""),
                                "relevance_score": round(similarity, 3),
                                "document_id": metadata.get("document_id", doc_id),
                            })
                except Exception:
                    continue
        except Exception:
            pass

    # If ChromaDB didn't return results, check in-memory store
    if not all_results:
        for doc_id in document_ids:
            doc_chunks = _in_memory_store.get(doc_id, [])
            for item in doc_chunks:
                sim = _cosine_similarity(query_embedding, item["embedding"])
                all_results.append({
                    "chunk_id": item["chunk_id"],
                    "text": item["text"],
                    "page_number": item["page_number"],
                    "section": item["section"],
                    "relevance_score": round(sim, 3),
                    "document_id": doc_id,
                    "metadata": item.get("metadata", {}),
                })

    # Sort by relevance and return top_k
    all_results.sort(key=lambda x: x["relevance_score"], reverse=True)
    return all_results[:top_k]

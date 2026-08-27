"""RAG (Retrieval-Augmented Generation) Pipeline with Anti-Hallucination Claim Verification."""
import re
from typing import Optional
from app.providers.factory import get_llm_provider
from app.services.embedding_service import similarity_search


async def rag_query(document_id: str, question: str, conversation_history: list[dict] = None,
                     collection_ids: list[str] = None) -> dict:
    """Execute the ANTI-SUMMARY RAG pipeline: retrieve → rerank → generate → verify claim grounding.
    
    Returns:
        dict with: answer, sources, verification, claim_status, mock, document_id
    """
    provider = get_llm_provider()

    # Step 1: Retrieve relevant chunks via similarity search
    search_doc_ids = collection_ids or []
    retrieved_chunks = await similarity_search(
        document_id=document_id,
        query=question,
        top_k=5,
        collection_ids=search_doc_ids,
    )

    # Step 2: Build context from retrieved chunks
    if retrieved_chunks:
        context_parts = []
        for i, chunk in enumerate(retrieved_chunks):
            page_info = f" (Page {chunk['page_number']})" if chunk.get('page_number') else ""
            section_info = f" [{chunk['section']}]" if chunk.get('section') else ""
            context_parts.append(f"[Source {i+1}{page_info}{section_info}]\n{chunk['text']}")
        context = "\n\n---\n\n".join(context_parts)
    else:
        context = "No relevant content was found in the document for this question."

    # Step 3: Build conversation history context
    history_text = ""
    if conversation_history:
        for msg in conversation_history[-5:]:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            history_text += f"\n{role.capitalize()}: {content}"

    # Step 4: Generate answer using grounded LLM instructions
    system_prompt = """You are ANTI-SUMMARY Document Intelligence, an evidence-grounded AI assistant. 
Your answers MUST be strictly derived from the provided document context. 
Every major factual claim should explicitly reference the source (e.g., "[Source 1, Page 2]").

ANTI-HALLUCINATION RULES:
1. If the context does not contain enough information, state clearly: "This document does not provide enough information to answer that question."
2. Distinguish clearly between what is EXPLICITLY STATED in the text and what is INFERRED.
3. NEVER invent or fabricate missing details, author intentions, or outside facts."""

    prompt = f"""Document Context:
{context}

{f"Previous Conversation:{history_text}" if history_text else ""}

User Question: {question}

Instructions:
1. Provide an accurate, comprehensive, and grounded answer based ONLY on the context.
2. Cite [Source X, Page Y] wherever applicable.
3. Conclude with a brief summary of claim support status: (EXPLICITLY STATED / INFERRED / NOT FOUND).
"""

    answer = await provider.generate(prompt, system_prompt=system_prompt)

    # Step 5: Build source citations
    sources = []
    for chunk in retrieved_chunks:
        sources.append({
            "page_number": chunk.get("page_number", 1),
            "section": chunk.get("section") or "Body Content",
            "chunk_id": chunk.get("chunk_id", ""),
            "text_preview": chunk["text"][:220] + ("..." if len(chunk["text"]) > 220 else ""),
            "relevance_score": chunk.get("relevance_score", 0.8),
            "char_start": chunk.get("metadata", {}).get("char_start", 0),
            "char_end": chunk.get("metadata", {}).get("char_end", len(chunk["text"])),
        })

    # Step 6: Anti-Hallucination Claim Verification
    verification = await _verify_evidence(answer, retrieved_chunks, provider)

    return {
        "answer": answer,
        "sources": sources,
        "verification": verification,
        "claim_status": verification.get("claim_status", "EXPLICITLY STATED"),
        "mock": provider.is_mock(),
        "document_id": document_id,
    }


async def _verify_evidence(answer: str, retrieved_chunks: list[dict], provider) -> dict:
    """Verify whether answer claims are supported and determine claim classification."""
    if not retrieved_chunks:
        return {
            "status": "unsupported",
            "claim_status": "NOT FOUND",
            "confidence": 0.0,
            "evidence_count": 0,
            "details": "This document does not contain relevant content to substantiate this answer.",
        }

    # For mock provider, determine based on evidence quantity and content presence
    if provider.is_mock():
        evidence_count = len(retrieved_chunks)
        if "does not provide enough information" in answer.lower() or "not found" in answer.lower():
            return {
                "status": "unsupported",
                "claim_status": "NOT FOUND",
                "confidence": 0.95,
                "evidence_count": 0,
                "details": "The query refers to information not found in the uploaded document.",
            }
        elif evidence_count >= 2:
            return {
                "status": "supported",
                "claim_status": "EXPLICITLY STATED",
                "confidence": 0.92,
                "evidence_count": evidence_count,
                "details": f"All core claims are grounded in {evidence_count} source citations from the document.",
            }
        else:
            return {
                "status": "partially_supported",
                "claim_status": "INFERRED",
                "confidence": 0.70,
                "evidence_count": 1,
                "details": "Answer is inferred from related context in 1 section; minor claims could not be directly matched.",
            }

    # For real LLM provider, run verification audit
    context = "\n".join([c["text"] for c in retrieved_chunks])
    verify_prompt = f"""Verify whether the following answer is supported by the document context.

Answer:
{answer}

Context:
{context[:4000]}

Classify the overall claim status:
- EXPLICITLY STATED: Directly backed by verbatim or near-verbatim text
- INFERRED: Logically deduced from text, but not verbatim
- UNCERTAIN: Context is ambiguous
- NOT FOUND: Claims are absent from context

Output format:
Status: [supported / partially_supported / unsupported]
ClaimStatus: [EXPLICITLY STATED / INFERRED / UNCERTAIN / NOT FOUND]
Confidence: [0.0 - 1.0]
Details: [Reasoning]
"""
    verification_text = await provider.generate(verify_prompt)

    status = "supported"
    claim_status = "EXPLICITLY STATED"
    confidence = 0.85

    if "unsupported" in verification_text.lower() or "not found" in verification_text.lower():
        status = "unsupported"
        claim_status = "NOT FOUND"
        confidence = 0.9
    elif "inferred" in verification_text.lower():
        status = "partially_supported"
        claim_status = "INFERRED"
        confidence = 0.75
    elif "uncertain" in verification_text.lower():
        status = "partially_supported"
        claim_status = "UNCERTAIN"
        confidence = 0.6

    return {
        "status": status,
        "claim_status": claim_status,
        "confidence": confidence,
        "evidence_count": len(retrieved_chunks),
        "details": verification_text.strip(),
    }

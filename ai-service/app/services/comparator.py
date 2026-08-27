"""Multi-document comparison service."""
from app.providers.factory import get_llm_provider
from app.services.embedding_service import similarity_search


async def compare_documents(document_ids: list[str], question: str = None,
                             aspects: list[str] = None) -> dict:
    """Compare multiple documents and generate structured comparison.
    
    Args:
        document_ids: List of document IDs to compare
        question: Optional comparison question
        aspects: Optional list of aspects to compare
    
    Returns:
        dict with: comparison (dict), sources (list), mock (bool)
    """
    provider = get_llm_provider()

    # Retrieve content from each document
    doc_contents = {}
    all_sources = []

    for doc_id in document_ids:
        chunks = await similarity_search(
            document_id=doc_id,
            query=question or "main content methodology results findings conclusion",
            top_k=5,
        )
        doc_contents[doc_id] = chunks
        for chunk in chunks:
            all_sources.append({
                "document_id": doc_id,
                "page_number": chunk.get("page_number"),
                "section": chunk.get("section"),
                "text_preview": chunk["text"][:150],
                "relevance_score": chunk["relevance_score"],
            })

    # Build comparison prompt
    context_parts = []
    for i, (doc_id, chunks) in enumerate(doc_contents.items()):
        doc_text = "\n".join([c["text"] for c in chunks])
        context_parts.append(f"=== Document {i+1} (ID: {doc_id}) ===\n{doc_text}")

    context = "\n\n".join(context_parts)

    comparison_question = question or "Compare these documents across their main themes, methodologies, findings, and conclusions."

    if aspects:
        aspects_str = ", ".join(aspects)
        comparison_question += f"\nFocus on these aspects: {aspects_str}"

    prompt = f"""Compare the following documents and provide a structured comparison.

{context}

Comparison Task: {comparison_question}

Provide your comparison in a structured format:
1. A summary comparison table (if applicable)
2. Key differences
3. Key similarities
4. Document-specific insights

Be specific and cite which document each point comes from.
All comparisons must be based on actual document content."""

    system_prompt = """You are a document comparison specialist. Compare documents objectively, 
noting key similarities and differences. Always reference which document supports each point. 
Never fabricate information not present in the documents."""

    response = await provider.generate(prompt, system_prompt=system_prompt)

    return {
        "comparison": {
            "text": response,
            "document_count": len(document_ids),
            "document_ids": document_ids,
        },
        "sources": all_sources,
        "mock": provider.is_mock(),
    }

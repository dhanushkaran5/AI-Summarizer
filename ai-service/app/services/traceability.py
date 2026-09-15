"""Source traceability and alignment engine for Summarize AI.

Aligns each summary sentence/segment to supporting source text sentences
using TF-IDF cosine similarity, providing transparent citation and traceability.
"""
from typing import List, Dict, Any
from app.services.preprocessing import segment_sentences
from app.services.embeddings import TextVectorizer, cosine_similarity


def compute_traceability(source_text: str, summary_text: str, min_threshold: float = 0.15) -> Dict[str, Any]:
    """Align summary segments to source sentences with cosine similarity scores.
    
    Returns:
        {
            "segments": [
                {
                    "segment_id": "seg-0",
                    "text": "Summary sentence text.",
                    "best_source_index": 2,
                    "similarity_score": 0.84,
                    "matched_source_indices": [2, 5],
                    "evidence_snippet": "Source sentence text..."
                }
            ],
            "source_sentences": [
                {
                    "index": 0,
                    "text": "Original source sentence...",
                    "start_char": 0,
                    "end_char": 42,
                    "is_referenced": True,
                    "referencing_segment_ids": ["seg-0"]
                }
            ]
        }
    """
    source_sents = segment_sentences(source_text)
    summary_sents = segment_sentences(summary_text)
    
    if not source_sents or not summary_sents:
        return {
            "segments": [],
            "source_sentences": source_sents
        }
        
    all_texts = [s["text"] for s in source_sents] + [s["text"] for s in summary_sents]
    vectorizer = TextVectorizer()
    all_matrix = vectorizer.fit_transform(all_texts)
    
    source_matrix = all_matrix[:len(source_sents)]
    summary_matrix = all_matrix[len(source_sents):]
    
    # Compute similarity between each summary sentence and each source sentence
    sim_matrix = cosine_similarity(summary_matrix, source_matrix)
    
    # Track which source sentences get cited
    source_citation_map = {i: [] for i in range(len(source_sents))}
    segments = []
    
    for sum_idx, sum_sent in enumerate(summary_sents):
        sim_scores = sim_matrix[sum_idx]
        best_source_idx = int(sim_scores.argmax())
        best_score = float(sim_scores[best_source_idx])
        
        # Find all sources above threshold or top 2
        matched_indices = []
        for src_idx, score in enumerate(sim_scores):
            if score >= max(min_threshold, best_score * 0.75):
                matched_indices.append(src_idx)
                
        if not matched_indices:
            matched_indices = [best_source_idx]
            
        seg_id = f"seg-{sum_idx}"
        for src_idx in matched_indices:
            source_citation_map[src_idx].append(seg_id)
            
        evidence_text = source_sents[best_source_idx]["text"]
        
        segments.append({
            "segment_id": seg_id,
            "text": sum_sent["text"],
            "best_source_index": best_source_idx,
            "similarity_score": round(max(0.1, best_score), 2),
            "matched_source_indices": matched_indices,
            "evidence_snippet": evidence_text
        })
        
    # Annotate source sentences with citation metadata
    annotated_sources = []
    for s in source_sents:
        ref_ids = source_citation_map.get(s["index"], [])
        annotated_sources.append({
            "index": s["index"],
            "text": s["text"],
            "start_char": s["start_char"],
            "end_char": s["end_char"],
            "is_referenced": len(ref_ids) > 0,
            "referencing_segment_ids": ref_ids
        })
        
    return {
        "segments": segments,
        "source_sentences": annotated_sources
    }

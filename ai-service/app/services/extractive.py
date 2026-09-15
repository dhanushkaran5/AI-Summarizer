"""Extractive summarization engine using TF-IDF, Centroid Centrality, and MMR.

Features:
- Sentence relevance scoring via document centroid cosine similarity
- Positional weighting (first sentences & paragraph leads)
- Maximal Marginal Relevance (MMR) for redundancy elimination (diversity parameter lambda=0.7)
- Dynamic length budgeting for BRIEF, STANDARD, and DETAILED modes
"""
import numpy as np
from typing import List, Dict, Any
from app.services.preprocessing import segment_sentences, normalize_text
from app.services.embeddings import TextVectorizer, compute_centroid, cosine_similarity

# Target sentence counts based on requested summary length
LENGTH_BUDGETS = {
    "brief": {"min_sentences": 2, "max_sentences": 4, "target_words": 120},
    "standard": {"min_sentences": 4, "max_sentences": 7, "target_words": 280},
    "detailed": {"min_sentences": 7, "max_sentences": 12, "target_words": 500},
}


def calculate_position_weight(sentence_index: int, total_sentences: int) -> float:
    """Apply positional bias: early sentences often contain thesis and key claims."""
    if total_sentences <= 1:
        return 1.0
    relative_pos = sentence_index / total_sentences
    if relative_pos < 0.15:
        return 1.25  # Boost introduction
    elif relative_pos > 0.85:
        return 1.15  # Boost conclusion
    return 1.0


def extract_key_sentences(
    text: str,
    length: str = "standard",
    diversity_lambda: float = 0.70
) -> Dict[str, Any]:
    """Execute extractive summarization using TF-IDF centroid similarity and MMR.
    
    Returns:
        {
            "summary_text": str,
            "sentences": List[Dict],  # selected sentences in chronological order
            "sentence_count": int,
            "compression_ratio": float,
            "total_source_sentences": int
        }
    """
    segmented = segment_sentences(text)
    total_sentences = len(segmented)
    if total_sentences == 0:
        return {
            "summary_text": "",
            "sentences": [],
            "sentence_count": 0,
            "compression_ratio": 0.0,
            "total_source_sentences": 0
        }
        
    length_cfg = LENGTH_BUDGETS.get(length.lower(), LENGTH_BUDGETS["standard"])
    target_count = min(total_sentences, max(length_cfg["min_sentences"], 
                                           min(length_cfg["max_sentences"], int(total_sentences * 0.35) + 1)))

    # If text is very short, return original sentences
    if total_sentences <= target_count:
        summary_text = " ".join(s["text"] for s in segmented)
        return {
            "summary_text": summary_text,
            "sentences": segmented,
            "sentence_count": total_sentences,
            "compression_ratio": 0.0,
            "total_source_sentences": total_sentences
        }

    raw_texts = [s["text"] for s in segmented]
    vectorizer = TextVectorizer()
    tfidf_matrix = vectorizer.fit_transform(raw_texts)
    
    # Compute document centroid
    doc_centroid = compute_centroid(tfidf_matrix)
    
    # Compute base relevance score to centroid for all sentences
    centroid_sims = cosine_similarity(tfidf_matrix, doc_centroid).flatten()
    
    # Pairwise similarity matrix for redundancy penalty
    pairwise_sims = cosine_similarity(tfidf_matrix, tfidf_matrix)
    
    # MMR Selection loop
    selected_indices = []
    unselected_indices = list(range(total_sentences))
    
    # Boost centroid similarities with positional weights
    weighted_scores = np.zeros(total_sentences)
    for idx in range(total_sentences):
        pos_weight = calculate_position_weight(idx, total_sentences)
        # Penalize very short sentences (< 5 words)
        len_penalty = 0.7 if segmented[idx]["word_count"] < 6 else 1.0
        weighted_scores[idx] = centroid_sims[idx] * pos_weight * len_penalty

    # Select first sentence: highest weighted centroid score
    first_idx = int(np.argmax(weighted_scores))
    selected_indices.append(first_idx)
    unselected_indices.remove(first_idx)
    
    # Iteratively select remaining sentences using MMR
    while len(selected_indices) < target_count and unselected_indices:
        best_mmr_score = -float("inf")
        best_candidate = -1
        
        for candidate_idx in unselected_indices:
            relevance = weighted_scores[candidate_idx]
            max_sim_to_selected = max(pairwise_sims[candidate_idx][sel] for sel in selected_indices)
            
            # MMR formula: lambda * Sim(Candidate, Query) - (1 - lambda) * MaxSim(Candidate, Selected)
            mmr_val = (diversity_lambda * relevance) - ((1.0 - diversity_lambda) * max_sim_to_selected)
            
            if mmr_val > best_mmr_score:
                best_mmr_score = mmr_val
                best_candidate = candidate_idx
                
        if best_candidate != -1:
            selected_indices.append(best_candidate)
            unselected_indices.remove(best_candidate)
        else:
            break
            
    # Sort selected sentences back to chronological order for natural reading flow
    selected_indices.sort()
    
    chosen_sentences = []
    for rank, idx in enumerate(selected_indices):
        s = segmented[idx]
        chosen_sentences.append({
            "index": s["index"],
            "text": s["text"],
            "score": round(float(weighted_scores[idx]), 4),
            "rank": rank + 1,
            "start_char": s["start_char"],
            "end_char": s["end_char"],
            "word_count": s["word_count"]
        })
        
    summary_text = " ".join(s["text"] for s in chosen_sentences)
    
    orig_words = sum(s["word_count"] for s in segmented)
    summ_words = sum(s["word_count"] for s in chosen_sentences)
    compression = round((1.0 - (summ_words / max(1, orig_words))) * 100, 1)
    
    return {
        "summary_text": summary_text,
        "sentences": chosen_sentences,
        "sentence_count": len(chosen_sentences),
        "compression_ratio": max(0.0, compression),
        "total_source_sentences": total_sentences
    }

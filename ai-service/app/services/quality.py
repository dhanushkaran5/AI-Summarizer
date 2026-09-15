"""Quality metrics calculation engine for Summarize AI.

Calculates:
- Compression ratio
- ROUGE-1, ROUGE-2, and ROUGE-L (Precision, Recall, F1)
- Readability Indices: Flesch-Kincaid, Flesch Reading Ease, Gunning Fog, ARI
- Semantic Coherence score (adjacent sentence transitions)
- Transparent confidence breakdown (factual grounding, coverage, readability)
"""
import re
import math
from typing import Dict, Any, List, Set, Tuple


def count_syllables(word: str) -> int:
    """Estimate syllable count in an English word."""
    word = word.lower().strip()
    if len(word) <= 3:
        return 1
    # Remove common endings
    word = re.sub(r'(?:[^laeiouy]|ed|es|e)$', '', word)
    word = re.sub(r'^y', '', word)
    syllables = len(re.findall(r'[aeiouy]{1,2}', word))
    return max(1, syllables)


def compute_readability(text: str) -> Dict[str, Any]:
    """Compute Flesch-Kincaid, Flesch Reading Ease, Gunning Fog, and ARI."""
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    num_sentences = max(1, len(sentences))
    
    words = re.findall(r'\b[a-zA-Z]+\b', text)
    num_words = max(1, len(words))
    
    characters = sum(len(w) for w in words)
    syllables = sum(count_syllables(w) for w in words)
    complex_words = sum(1 for w in words if count_syllables(w) >= 3)
    
    asl = num_words / num_sentences  # Average Sentence Length
    asw = syllables / num_words      # Average Syllables per Word
    cpw = characters / num_words     # Characters per Word
    pct_complex = (complex_words / num_words) * 100

    # Flesch Reading Ease
    fre = 206.835 - (1.015 * asl) - (84.6 * asw)
    fre = max(0.0, min(100.0, round(fre, 1)))

    # Flesch-Kincaid Grade Level
    fkgl = (0.39 * asl) + (11.8 * asw) - 15.59
    fkgl = max(1.0, round(fkgl, 1))

    # Gunning Fog Index
    fog = 0.4 * (asl + pct_complex)
    fog = max(1.0, round(fog, 1))

    # Automated Readability Index (ARI)
    ari = (4.71 * cpw) + (0.5 * asl) - 21.43
    ari = max(1.0, round(ari, 1))

    # Readability category
    if fre >= 80:
        level_label = "Easy"
    elif fre >= 60:
        level_label = "Standard"
    elif fre >= 40:
        level_label = "College Level"
    else:
        level_label = "Advanced / Academic"

    return {
        "flesch_reading_ease": fre,
        "flesch_kincaid_grade": fkgl,
        "gunning_fog_index": fog,
        "automated_readability_index": ari,
        "difficulty_label": level_label,
        "avg_sentence_length": round(asl, 1),
        "complex_word_percentage": round(pct_complex, 1)
    }


def get_ngrams(tokens: List[str], n: int) -> List[Tuple[str, ...]]:
    """Extract n-grams from a list of tokens."""
    return [tuple(tokens[i:i + n]) for i in range(len(tokens) - n + 1)]


def lcs_length(x: List[str], y: List[str]) -> int:
    """Compute length of Longest Common Subsequence between two token lists."""
    m, n = len(x), len(y)
    dp = [0] * (n + 1)
    for i in range(1, m + 1):
        prev = 0
        for j in range(1, n + 1):
            temp = dp[j]
            if x[i - 1] == y[j - 1]:
                dp[j] = prev + 1
            else:
                dp[j] = max(dp[j], dp[j - 1])
            prev = temp
    return dp[n]


def compute_rouge(reference: str, summary: str) -> Dict[str, Any]:
    """Compute ROUGE-1, ROUGE-2, and ROUGE-L precision, recall, and F1."""
    ref_tokens = re.findall(r'\b\w+\b', reference.lower())
    sum_tokens = re.findall(r'\b\w+\b', summary.lower())
    
    if not ref_tokens or not sum_tokens:
        return {
            "rouge_1": {"precision": 0.0, "recall": 0.0, "f1": 0.0},
            "rouge_2": {"precision": 0.0, "recall": 0.0, "f1": 0.0},
            "rouge_l": {"precision": 0.0, "recall": 0.0, "f1": 0.0}
        }
        
    def score_ngrams(n: int):
        ref_ngrams = get_ngrams(ref_tokens, n)
        sum_ngrams = get_ngrams(sum_tokens, n)
        if not ref_ngrams or not sum_ngrams:
            return {"precision": 0.0, "recall": 0.0, "f1": 0.0}
            
        ref_counts: Dict[Tuple[str, ...], int] = {}
        for g in ref_ngrams:
            ref_counts[g] = ref_counts.get(g, 0) + 1
            
        sum_counts: Dict[Tuple[str, ...], int] = {}
        for g in sum_ngrams:
            sum_counts[g] = sum_counts.get(g, 0) + 1
            
        overlap = sum(min(count, ref_counts.get(g, 0)) for g, count in sum_counts.items())
        p = overlap / len(sum_ngrams) if sum_ngrams else 0.0
        r = overlap / len(ref_ngrams) if ref_ngrams else 0.0
        f1 = (2 * p * r) / (p + r) if (p + r) > 0 else 0.0
        return {"precision": round(p, 4), "recall": round(r, 4), "f1": round(f1, 4)}

    # ROUGE-1 & ROUGE-2
    r1 = score_ngrams(1)
    r2 = score_ngrams(2)
    
    # ROUGE-L
    lcs_val = lcs_length(ref_tokens[:500], sum_tokens[:500])  # bound for performance
    rl_p = lcs_val / len(sum_tokens[:500]) if sum_tokens else 0.0
    rl_r = lcs_val / len(ref_tokens[:500]) if ref_tokens else 0.0
    rl_f1 = (2 * rl_p * rl_r) / (rl_p + rl_r) if (rl_p + rl_r) > 0 else 0.0
    rl = {"precision": round(rl_p, 4), "recall": round(rl_r, 4), "f1": round(rl_f1, 4)}

    return {
        "rouge_1": r1,
        "rouge_2": r2,
        "rouge_l": rl
    }


def compute_semantic_coherence(summary_sentences: List[str]) -> float:
    """Compute semantic coherence based on adjacent sentence word overlap."""
    if len(summary_sentences) <= 1:
        return 0.95
        
    transitions = []
    for i in range(len(summary_sentences) - 1):
        s1 = set(re.findall(r'\b\w{3,}\b', summary_sentences[i].lower()))
        s2 = set(re.findall(r'\b\w{3,}\b', summary_sentences[i + 1].lower()))
        if not s1 or not s2:
            transitions.append(0.5)
            continue
        jaccard = len(s1.intersection(s2)) / len(s1.union(s2))
        # Normal coherence range 0.4 to 0.9
        transitions.append(min(1.0, 0.45 + jaccard * 1.8))
        
    return round(sum(transitions) / len(transitions), 2)


def compute_quality_metrics(source_text: str, summary_text: str) -> Dict[str, Any]:
    """Calculate complete quality metrics and transparent confidence score."""
    source_words = len(re.findall(r'\b\w+\b', source_text))
    summary_words = len(re.findall(r'\b\w+\b', summary_text))
    
    # Compression ratio
    compression = round((1.0 - (summary_words / max(1, source_words))) * 100, 1)
    compression = max(0.0, min(99.0, compression))
    
    # Readability
    readability = compute_readability(summary_text)
    
    # ROUGE
    rouge = compute_rouge(source_text, summary_text)
    
    # Semantic coherence
    sum_sents = [s.strip() for s in re.split(r'[.!?]+', summary_text) if s.strip()]
    coherence = compute_semantic_coherence(sum_sents)
    
    # Factual grounding: proportion of summary keywords present in source
    source_vocab = set(re.findall(r'\b[a-zA-Z]{4,}\b', source_text.lower()))
    sum_vocab = set(re.findall(r'\b[a-zA-Z]{4,}\b', summary_text.lower()))
    grounding = (len(sum_vocab.intersection(source_vocab)) / max(1, len(sum_vocab))) if sum_vocab else 1.0
    grounding = round(min(0.99, max(0.60, grounding)), 2)
    
    # Coverage: ROUGE-1 recall
    coverage = round(min(0.98, max(0.40, rouge["rouge_1"]["recall"] * 1.5)), 2)
    
    # Readability score factor: normalize Flesch Reading Ease to 0-1
    readability_factor = round(min(1.0, max(0.5, readability["flesch_reading_ease"] / 100.0)), 2)
    
    # Transparent composite confidence score:
    # 50% Factual Grounding + 25% Coverage + 15% Coherence + 10% Readability
    composite_confidence = round(
        (0.50 * grounding) + (0.25 * coverage) + (0.15 * coherence) + (0.10 * readability_factor),
        2
    )

    return {
        "compression_ratio": compression,
        "source_word_count": source_words,
        "summary_word_count": summary_words,
        "coherence_score": coherence,
        "readability": readability,
        "rouge": rouge,
        "confidence": {
            "overall_score": composite_confidence,
            "factual_grounding": grounding,
            "coverage": coverage,
            "semantic_coherence": coherence,
            "syntactic_readability": readability_factor,
            "explanation": "Weighted synthesis: 50% factual grounding, 25% source coverage, 15% sentence coherence, 10% readability."
        }
    }

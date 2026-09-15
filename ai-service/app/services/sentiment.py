"""Sentiment analysis engine with document-level tone and section timeline distribution.

Provides:
- Overall document tone (Positive, Neutral, Negative, Mixed)
- Sentiment polarity score (-1.0 to 1.0) and confidence
- Section-by-section timeline distribution for trajectory visualization
- Percentage breakdown across sentiments
"""
import re
from typing import List, Dict, Any
from app.services.preprocessing import segment_sentences

# Lexicons for sentiment polarity and intensity
POSITIVE_TERMS = {
    "increase", "grow", "growth", "improve", "improvement", "success", "successful",
    "profit", "profitable", "benefit", "beneficial", "advantage", "gain", "opportunity",
    "excel", "excellence", "promising", "positive", "strong", "effective", "efficient",
    "breakthrough", "innovative", "innovation", "achieve", "achievement", "superior",
    "outperform", "optimistic", "robust", "resilient", "valuable", "favorable", "thrive"
}

NEGATIVE_TERMS = {
    "decrease", "decline", "drop", "fall", "loss", "risk", "risky", "threat", "danger",
    "hazard", "vulnerability", "defect", "fail", "failure", "flaw", "flawed", "adverse",
    "penalty", "damage", "damaging", "severe", "downturn", "recession", "stagnation",
    "negative", "weak", "inefficient", "costly", "deficit", "liability", "crisis", "problem"
}

INTENSIFIERS = {"very", "extremely", "substantially", "significantly", "remarkably", "highly", "critically"}
NEGATIONS = {"not", "no", "never", "neither", "barely", "hardly", "without", "rarely"}


def analyze_sentence_sentiment(text: str) -> float:
    """Compute polarity score from -1.0 (very negative) to +1.0 (very positive)."""
    words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
    if not words:
        return 0.0
        
    score = 0.0
    negation_active = False
    
    for i, word in enumerate(words):
        if word in NEGATIONS:
            negation_active = True
            continue
            
        weight = 1.0
        # Check preceding intensifier
        if i > 0 and words[i-1] in INTENSIFIERS:
            weight = 1.6
            
        if word in POSITIVE_TERMS:
            val = weight if not negation_active else -weight * 0.8
            score += val
            negation_active = False
        elif word in NEGATIVE_TERMS:
            val = -weight if not negation_active else weight * 0.8
            score += val
            negation_active = False
            
    # Normalize score between -1.0 and 1.0
    return max(-1.0, min(1.0, score / max(1, len(words) * 0.15)))


def analyze_sentiment(text: str, sections_count: int = 5) -> Dict[str, Any]:
    """Analyze overall sentiment and generate section timeline."""
    sentences = segment_sentences(text)
    if not sentences:
        return {
            "overall_tone": "Neutral",
            "polarity": 0.0,
            "confidence": 0.5,
            "distribution": {"positive": 0, "neutral": 100, "negative": 0},
            "timeline": []
        }
        
    sent_scores = [analyze_sentence_sentiment(s["text"]) for s in sentences]
    overall_polarity = sum(sent_scores) / max(1, len(sent_scores))
    
    pos_count = sum(1 for s in sent_scores if s > 0.1)
    neg_count = sum(1 for s in sent_scores if s < -0.1)
    neu_count = len(sent_scores) - pos_count - neg_count
    
    total = len(sent_scores)
    pos_pct = round((pos_count / total) * 100, 1)
    neg_pct = round((neg_count / total) * 100, 1)
    neu_pct = round((neu_count / total) * 100, 1)
    
    # Determine overall tone
    if pos_pct > 35 and neg_pct > 25:
        overall_tone = "Mixed"
    elif overall_polarity > 0.12:
        overall_tone = "Positive"
    elif overall_polarity < -0.12:
        overall_tone = "Negative"
    else:
        overall_tone = "Neutral"
        
    # Build timeline progression points
    num_points = min(sections_count, max(2, len(sentences)))
    bucket_size = max(1, len(sentences) // num_points)
    timeline = []
    
    for i in range(num_points):
        start_idx = i * bucket_size
        end_idx = (i + 1) * bucket_size if i < num_points - 1 else len(sentences)
        bucket_scores = sent_scores[start_idx:end_idx]
        bucket_sents = sentences[start_idx:end_idx]
        
        if not bucket_scores:
            continue
            
        avg_score = sum(bucket_scores) / len(bucket_scores)
        if avg_score > 0.1:
            lbl = "Positive"
        elif avg_score < -0.1:
            lbl = "Negative"
        else:
            lbl = "Neutral"
            
        snippet = bucket_sents[0]["text"][:80] + ("..." if len(bucket_sents[0]["text"]) > 80 else "")
        
        timeline.append({
            "section_index": i + 1,
            "label": lbl,
            "score": round(avg_score, 2),
            "key_phrase": snippet,
            "sentence_range": f"{start_idx + 1}-{end_idx}"
        })
        
    return {
        "overall_tone": overall_tone,
        "polarity": round(overall_polarity, 3),
        "confidence": round(min(0.98, 0.65 + abs(overall_polarity) * 0.35), 2),
        "distribution": {
            "positive": pos_pct,
            "neutral": neu_pct,
            "negative": neg_pct
        },
        "timeline": timeline
    }

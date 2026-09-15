"""Key Insights extraction engine for Summarize AI.

Generates structured key insights with:
- title: concise title
- insight: core takeaway statement
- whyThisMatters: practical, business, or scientific implication
- importance: high | medium | low
- sourceReferences: supporting sentence indices
"""
import re
from typing import List, Dict, Any
from app.services.preprocessing import segment_sentences
from app.services.extractive import extract_key_sentences


INSIGHT_SIGNAL_WORDS = {
    "high": ["critical", "crucial", "essential", "primary", "key", "breakthrough", "major", "fundamental", "significantly", "vital", "danger", "revenue", "urgent"],
    "medium": ["important", "notable", "indicates", "suggests", "demonstrates", "reveals", "observed", "results", "growth", "opportunity", "strategy"],
    "low": ["additionally", "furthermore", "also", "secondary", "minor", "optional", "context"]
}


def determine_importance(sentence: str) -> str:
    """Classify importance of a takeaway based on signal words and quantitative markers."""
    text_lower = sentence.lower()
    # Check for quantitative data (numbers, percentages, currency)
    has_metrics = bool(re.search(r'\b\d+(?:\.\d+)?%|\$\d+|\b\d+\b', text_lower))
    
    for word in INSIGHT_SIGNAL_WORDS["high"]:
        if word in text_lower or (has_metrics and "increase" in text_lower):
            return "high"
            
    for word in INSIGHT_SIGNAL_WORDS["medium"]:
        if word in text_lower or has_metrics:
            return "medium"
            
    return "low"


def generate_why_this_matters(sentence: str, persona: str = "executive") -> str:
    """Generate the 'why this matters' impact statement tailored to persona."""
    text_lower = sentence.lower()
    persona_key = (persona or "executive").lower()
    
    if "risk" in text_lower or "threat" in text_lower or "decline" in text_lower or "penalty" in text_lower:
        if persona_key == "executive":
            return "Requires immediate risk mitigation and strategic contingency allocation to prevent downside exposure."
        elif persona_key == "technical":
            return "Highlights failure modes that require defensive coding, architectural redundancy, and alerting."
        elif persona_key == "academic":
            return "Points to methodological vulnerabilities or negative effects that warrant rigorous empirical control."
        else:
            return "This is an important warning sign you should pay attention to."
            
    if "increase" in text_lower or "growth" in text_lower or "success" in text_lower or "improve" in text_lower:
        if persona_key == "executive":
            return "Demonstrates strong positive traction and validates continued investment in this direction."
        elif persona_key == "technical":
            return "Validates performance optimization gains and architectural scalability under load."
        elif persona_key == "academic":
            return "Provides statistically meaningful empirical support for the tested hypothesis."
        else:
            return "This shows real progress and makes a noticeable positive difference."

    if persona_key == "executive":
        return "Directly influences resource allocation, team priorities, and bottom-line delivery."
    elif persona_key == "academic":
        return "Deepens theoretical understanding and establishes a baseline for future peer-reviewed inquiry."
    elif persona_key == "technical":
        return "Dictates engineering constraints and informs architectural design patterns."
    else:
        return "Helps you understand the bigger picture and make more informed everyday decisions."


def generate_title_from_sentence(sentence: str) -> str:
    """Generate a punchy title from sentence keywords."""
    words = [w for w in re.findall(r'\b[A-Za-z]{3,}\b', sentence) if w.lower() not in {"this", "that", "with", "from", "have", "were", "been", "which"}]
    if len(words) >= 3:
        return " ".join(words[:4]).title()
    return "Key Finding"


def extract_insights(
    text: str,
    length: str = "standard",
    persona: str = "executive"
) -> List[Dict[str, Any]]:
    """Extract structured insights with importance badges and rationale."""
    extracted = extract_key_sentences(text, length=length)
    key_sentences = extracted.get("sentences", [])
    
    if not key_sentences:
        return []
        
    insights = []
    for idx, s in enumerate(key_sentences):
        sentence_text = s["text"]
        importance = determine_importance(sentence_text)
        title = generate_title_from_sentence(sentence_text)
        why_matters = generate_why_this_matters(sentence_text, persona=persona)
        
        insights.append({
            "id": f"insight-{idx + 1}",
            "title": title,
            "insight": sentence_text,
            "whyThisMatters": why_matters,
            "importance": importance,
            "sourceReferences": [s["index"]]
        })
        
    return insights

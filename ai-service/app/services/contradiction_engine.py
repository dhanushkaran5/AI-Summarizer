"""Contradiction Detection Engine — identifies internal document inconsistencies."""
import json
import re
from typing import Optional
from app.providers.factory import get_llm_provider


async def detect_contradictions(document_id: str, text: str, chunks: list[dict] = None) -> list[dict]:
    """Scan document sections for contradictions or conflicting statements.
    
    Returns:
        list of contradiction dicts:
            statement_a: first claim
            section_a: section/location of first claim
            page_a: page number
            statement_b: conflicting claim
            section_b: section/location of conflicting claim
            page_b: page number
            explanation: why they appear inconsistent
            severity: 'high' | 'medium' | 'low'
    """
    provider = get_llm_provider()

    # Rule-based heuristics for mock or quick deterministic pass
    if provider.is_mock() or len(text.strip()) < 100:
        return _heuristic_contradiction_check(text, chunks)

    # Real LLM cross-section contradiction prompt
    prompt = f"""You are an expert Document Intelligence Auditor. 
Analyze the following document text and find internal CONTRADICTIONS, conflicting requirements, inconsistent metrics, or opposing claims made in different sections.

Document Content:
{text[:9000]}

Instructions:
1. Identify any statements that appear inconsistent or contradict each other across different parts of the document.
2. For each contradiction found, specify Statement A (with source section/page), Statement B (with source section/page), an explanation of the inconsistency, and severity ('high', 'medium', 'low').
3. Do NOT declare something false; state that the statements appear inconsistent.
4. If no contradictions exist, return an empty JSON array [].

Output strictly in JSON format as an array of objects:
[
  {{
    "statement_a": "...",
    "section_a": "...",
    "page_a": 1,
    "statement_b": "...",
    "section_b": "...",
    "page_b": 2,
    "explanation": "...",
    "severity": "high"
  }}
]
"""
    system_prompt = "You are a factual consistency auditor. Respond ONLY with a valid JSON array."
    response = await provider.generate(prompt, system_prompt=system_prompt)

    try:
        cleaned = response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        parsed = json.loads(cleaned.strip())
        if isinstance(parsed, list):
            return parsed
    except Exception:
        pass

    # Fallback to heuristic pass if parsing fails
    return _heuristic_contradiction_check(text, chunks)


def _heuristic_contradiction_check(text: str, chunks: list[dict] = None) -> list[dict]:
    """Deterministic heuristic check for opposing numerical values or opposing statements."""
    contradictions = []
    text_lower = text.lower()

    # Look for common contradictory patterns (e.g. 2 GB vs 8 GB, required vs optional, increase vs decrease)
    ram_matches = re.findall(r'(\d+)\s*(?:gb|mb)\s+ram', text_lower)
    if len(set(ram_matches)) > 1:
        contradictions.append({
            "statement_a": f"System requires {ram_matches[0]} RAM.",
            "section_a": "System Specifications",
            "page_a": 1,
            "statement_b": f"System requires {ram_matches[-1]} RAM.",
            "section_b": "Requirements / Deployment",
            "page_b": 2,
            "explanation": f"Conflicting memory requirements found ({ram_matches[0]} RAM vs {ram_matches[-1]} RAM).",
            "severity": "high",
        })

    # Check for opposing keywords across sentences
    sentences = [s.strip() for s in re.split(r'[.!?]\s+', text) if len(s.strip()) > 20]
    for i, s1 in enumerate(sentences):
        for s2 in sentences[i+1:]:
            s1_lower = s1.lower()
            s2_lower = s2.lower()
            if "always" in s1_lower and "never" in s2_lower:
                common_words = set(s1_lower.split()) & set(s2_lower.split()) - {"always", "never", "the", "a", "is", "and", "in", "to"}
                if len(common_words) >= 2:
                    contradictions.append({
                        "statement_a": s1,
                        "section_a": "Initial Section",
                        "page_a": 1,
                        "statement_b": s2,
                        "section_b": "Later Section",
                        "page_b": 2,
                        "explanation": "Statements contain contradictory absolute terms ('always' vs 'never') regarding related topics.",
                        "severity": "medium",
                    })
                    break

    return contradictions

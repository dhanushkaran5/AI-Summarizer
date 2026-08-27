"""Document type classifier — detects document type for adaptive summarization."""
import re
from collections import Counter


DOCUMENT_TYPES = [
    "research_paper",
    "academic_notes",
    "business_report",
    "technical_documentation",
    "resume",
    "project_report",
    "legal_policy",
    "general",
]

# Keywords associated with each document type
TYPE_INDICATORS = {
    "research_paper": [
        "abstract", "introduction", "methodology", "methods", "results",
        "discussion", "conclusion", "references", "hypothesis", "findings",
        "literature review", "data analysis", "statistical", "experiment",
        "research", "study", "participants", "variables", "p-value",
        "significant", "correlation", "regression", "sample size",
    ],
    "academic_notes": [
        "lecture", "notes", "chapter", "topic", "definition", "theorem",
        "proof", "example", "exercise", "quiz", "exam", "semester",
        "course", "class", "professor", "textbook", "learning objectives",
    ],
    "business_report": [
        "executive summary", "revenue", "profit", "market", "stakeholder",
        "quarterly", "annual", "fiscal", "roi", "kpi", "budget",
        "forecast", "strategy", "competitive", "growth", "investment",
        "recommendation", "action items", "business", "client",
    ],
    "technical_documentation": [
        "api", "endpoint", "configuration", "installation", "setup",
        "architecture", "component", "module", "function", "class",
        "parameter", "return", "error", "debug", "deploy", "docker",
        "database", "server", "client", "framework", "library",
    ],
    "resume": [
        "experience", "education", "skills", "objective", "summary",
        "certifications", "achievements", "responsibilities", "projects",
        "contact", "phone", "email", "linkedin", "university", "degree",
    ],
    "project_report": [
        "project", "objectives", "scope", "timeline", "deliverables",
        "milestones", "requirements", "implementation", "testing",
        "deployment", "stakeholders", "risk", "status", "progress",
    ],
    "legal_policy": [
        "hereby", "whereas", "shall", "pursuant", "notwithstanding",
        "indemnify", "liability", "jurisdiction", "compliance", "regulation",
        "policy", "terms", "conditions", "agreement", "contract", "clause",
        "amendment", "statute", "provision", "enforce",
    ],
}


def classify_document(text: str) -> str:
    """Classify document type based on content analysis.
    
    Returns one of the DOCUMENT_TYPES strings.
    """
    text_lower = text.lower()
    words = re.findall(r'\b[a-zA-Z]+\b', text_lower)
    word_set = set(words)
    word_freq = Counter(words)

    scores = {}
    for doc_type, indicators in TYPE_INDICATORS.items():
        score = 0
        for indicator in indicators:
            if " " in indicator:
                # Multi-word indicator — check substring
                count = text_lower.count(indicator)
                score += count * 3  # Weight multi-word matches higher
            else:
                if indicator in word_set:
                    score += word_freq.get(indicator, 0)

        scores[doc_type] = score

    # Get the type with highest score
    if not scores or max(scores.values()) == 0:
        return "general"

    best_type = max(scores, key=scores.get)

    # Require minimum threshold to classify
    if scores[best_type] < 5:
        return "general"

    return best_type

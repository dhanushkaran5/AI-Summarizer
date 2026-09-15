"""Persona definitions, formatting guidelines, and transformations for Summarize AI.

Supported Personas:
- EXECUTIVE: Decision-oriented, bottom-line impact, key metrics, risks, action items
- ACADEMIC: Scholarly rigor, research questions, methodology, findings, limitations
- TECHNICAL: Engineering architecture, algorithms, data contracts, constraints
- CASUAL: High clarity, everyday analogies, conversational, jargon-free
"""
from typing import Dict, Any, List

PERSONAS_CONFIG = {
    "executive": {
        "id": "executive",
        "name": "Executive",
        "role_description": "Senior decision-maker focused on bottom-line outcomes, strategic risks, and immediate actions.",
        "tone": "Decisive, concise, impact-oriented, metrics-driven",
        "sections": [
            {"id": "exec_summary", "title": "Executive Summary", "icon": "briefcase"},
            {"id": "bottom_line", "title": "Key Decisions & Bottom Line", "icon": "trending-up"},
            {"id": "risks_ops", "title": "Strategic Risks & Opportunities", "icon": "alert-triangle"},
            {"id": "actions", "title": "Recommended Action Items", "icon": "check-square"}
        ],
        "system_instruction": (
            "You are a C-Suite executive advisor. Distill information into clear decision impacts, "
            "financial and strategic implications, quantified risks, and concrete actionable next steps. "
            "Eliminate unnecessary filler and highlight business value."
        )
    },
    "academic": {
        "id": "academic",
        "name": "Academic",
        "role_description": "Scholarly researcher evaluating methodologies, empirical evidence, and validity bounds.",
        "tone": "Objective, methodologically precise, evidence-grounded, peer-review standard",
        "sections": [
            {"id": "abstract", "title": "Research Abstract", "icon": "book-open"},
            {"id": "methodology", "title": "Methodology & Hypotheses", "icon": "clipboard"},
            {"id": "findings", "title": "Empirical Findings & Evidence", "icon": "bar-chart-2"},
            {"id": "limitations", "title": "Limitations & Future Inquiries", "icon": "help-circle"}
        ],
        "system_instruction": (
            "You are a peer-review academic analyst. Highlight the foundational premise, "
            "investigative methodology, statistical/empirical findings, critical assumptions, "
            "and scientific limitations or boundary conditions."
        )
    },
    "technical": {
        "id": "technical",
        "name": "Technical",
        "role_description": "Lead software engineer or systems architect focusing on specifications, protocols, and constraints.",
        "tone": "Precise, structural, algorithmic, engineering-centric",
        "sections": [
            {"id": "tech_overview", "title": "Technical Overview", "icon": "cpu"},
            {"id": "architecture", "title": "System Architecture & Algorithms", "icon": "layers"},
            {"id": "implementation", "title": "Implementation Details & Data Flow", "icon": "code"},
            {"id": "constraints", "title": "Constraints & Operational Specs", "icon": "settings"}
        ],
        "system_instruction": (
            "You are a Principal Systems Architect. Focus on data flow, architectural paradigms, "
            "algorithmic complexity, edge cases, failure modes, APIs, and engineering constraints. "
            "Maintain technical precision."
        )
    },
    "casual": {
        "id": "casual",
        "name": "Casual",
        "role_description": "Friendly explainer transforming complex concepts into accessible everyday language.",
        "tone": "Warm, accessible, conversational, conversational-analogy rich",
        "sections": [
            {"id": "big_picture", "title": "The Big Picture", "icon": "sun"},
            {"id": "analogy", "title": "In Everyday Terms", "icon": "coffee"},
            {"id": "why_it_matters", "title": "Why You Should Care", "icon": "heart"},
            {"id": "takeaways", "title": "Key Takeaways to Remember", "icon": "bookmark"}
        ],
        "system_instruction": (
            "You are an approachable science and technology communicator. Explain concepts as if "
            "speaking to an intelligent friend over coffee. Use relatable everyday analogies, "
            "demystify jargon, and focus on practical intuition."
        )
    }
}


def get_persona_config(persona: str) -> Dict[str, Any]:
    """Retrieve persona configuration with fallback to Executive."""
    key = (persona or "executive").lower().strip()
    return PERSONAS_CONFIG.get(key, PERSONAS_CONFIG["executive"])


def format_persona_output(
    persona_id: str,
    sections_content: Dict[str, Any],
    overview: str = ""
) -> Dict[str, Any]:
    """Structure persona summary content with metadata."""
    cfg = get_persona_config(persona_id)
    structured_sections = []
    
    for sec in cfg["sections"]:
        sec_id = sec["id"]
        content = sections_content.get(sec_id, "")
        if not content and sections_content.get(sec["title"]):
            content = sections_content[sec["title"]]
        structured_sections.append({
            "id": sec_id,
            "title": sec["title"],
            "icon": sec["icon"],
            "content": content
        })
        
    return {
        "persona": cfg["id"],
        "persona_name": cfg["name"],
        "tone": cfg["tone"],
        "overview": overview,
        "sections": structured_sections
    }

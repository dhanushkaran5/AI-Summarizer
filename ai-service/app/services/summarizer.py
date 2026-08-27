"""Multi-depth adaptive summarization engine for ANTI-SUMMARY.

Supports Levels 0-5:
- LEVEL 0: One-sentence essence
- LEVEL 1: Executive summary
- LEVEL 2: Detailed structured summary
- LEVEL 3: Section-by-section breakdown
- LEVEL 4: Deep technical explanation
- LEVEL 5: Question-answer knowledge base

Across 9 specialized modes:
Executive, Student, Research, Technical, Beginner, Meeting, Exam, Legal/Policy, Custom.
"""
import json
from typing import Optional
from app.providers.factory import get_llm_provider

MODES_CONFIG = {
    "executive": {
        "mode": "executive",
        "title": "Executive Mode",
        "focus": "Bottom-line impact, key metrics, strategic opportunities, risks, and actionable recommendations.",
        "sections": ["Bottom Line", "Key Metrics & Impact", "Strategic Risks", "Recommended Actions"],
    },
    "student": {
        "mode": "student",
        "title": "Student Mode",
        "focus": "Core concepts, foundational definitions, illustrative examples, key formulas, and review takeaways.",
        "sections": ["Core Concepts", "Key Definitions", "Real-World Examples", "Study Takeaways", "Probable Exam Points"],
    },
    "research": {
        "mode": "research",
        "title": "Research Mode",
        "focus": "Problem statement, methodology, assumptions, empirical findings, statistical evidence, and limitations.",
        "sections": ["Research Problem", "Methodology & Setup", "Key Findings", "Limitations & Validity", "Future Work"],
    },
    "technical": {
        "mode": "technical",
        "title": "Technical Mode",
        "focus": "Architecture, algorithms, component design, data flow, configuration, API specs, and technical constraints.",
        "sections": ["System Architecture", "Algorithmic Approach", "Component Specifications", "Dependencies & Constraints"],
    },
    "beginner": {
        "mode": "beginner",
        "title": "Beginner Mode (ELI5)",
        "focus": "Simple everyday analogies, jargon-free explanations, intuitive mental models, and step-by-step clarity.",
        "sections": ["The Big Picture in Simple Words", "Everyday Analogy", "Why This Matters", "Key Takeaways"],
    },
    "meeting": {
        "mode": "meeting",
        "title": "Meeting Mode",
        "focus": "Decisions reached, assigned action items, responsible owners, deadlines, and unresolved open questions.",
        "sections": ["Key Decisions Made", "Action Items & Owners", "Deadlines & Milestones", "Open Questions"],
    },
    "exam": {
        "mode": "exam",
        "title": "Exam Mode",
        "focus": "High-yield testable topics, critical definitions, distinguishing characteristics, and short revision notes.",
        "sections": ["High-Yield Topics", "Must-Know Definitions", "Common Pitfalls & Distinctions", "Quick Revision Flash-Notes"],
    },
    "legal_policy": {
        "mode": "legal_policy",
        "title": "Legal & Policy Review Mode",
        "focus": "Rights, duties, contractual obligations, compliance mandates, penalty clauses, and risk exposures.",
        "sections": ["Scope & Jurisdiction", "Rights & Obligations", "Compliance Mandates", "Liability & Risk Exposure"],
    },
    "custom": {
        "mode": "custom",
        "title": "Custom Mode",
        "focus": "Comprehensive multi-perspective analysis tailored to user inquiry.",
        "sections": ["Executive Summary", "Detailed Analysis", "Key Insights", "Evidence Points"],
    },
}


async def generate_multi_level_summary(text: str, chunks: list[dict] = None, mode: str = "student",
                                       target_level: int = 2) -> dict:
    """Generate multi-level ANTI-SUMMARY representations (Levels 0 through 5)."""
    provider = get_llm_provider()
    mode_key = mode.lower() if mode else "student"
    mode_info = MODES_CONFIG.get(mode_key, MODES_CONFIG["student"])

    if provider.is_mock() or len(text.strip()) < 100:
        return _deterministic_multi_level_summary(text, mode_info, chunks)

    system_prompt = f"""You are ANTI-SUMMARY, an advanced document intelligence platform.
Your mission is to transform complex documents into a multi-depth understanding layer tailored for {mode_info['title']}.
Focus: {mode_info['focus']}
You must generate 6 distinct representation levels in JSON format:
- level_0: Exactly one concise, high-impact sentence capturing the document essence.
- level_1: A 2-3 paragraph executive summary with bulleted highlights.
- level_2: Structured breakdown into sections: {', '.join(mode_info['sections'])}.
- level_3: Section-by-section explanation mapping each major topic to its key takeaway.
- level_4: Deep technical/conceptual breakdown including methodologies, limitations, and evidence.
- level_5: Array of 4-6 Q&A pairs forming a self-contained knowledge base.
"""

    prompt = f"""Document Content:
{text[:9000]}

Generate all 6 summary levels in strict JSON format:
{{
  "level_0": "...",
  "level_1": "...",
  "level_2": {{
    "{mode_info['sections'][0]}": "...",
    "{mode_info['sections'][1]}": "..."
  }},
  "level_3": [
    {{"section": "Section Name", "summary": "Key points for this section", "page": 1}}
  ],
  "level_4": "Deep analysis with mechanisms, evidence, and constraints...",
  "level_5": [
    {{"question": "...", "answer": "..."}}
  ]
}}
"""

    response = await provider.generate(prompt, system_prompt=system_prompt, max_tokens=3000)

    try:
        cleaned = response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        parsed = json.loads(cleaned.strip())
        if "level_0" in parsed:
            parsed["mode"] = mode_key
            parsed["mock"] = False
            return parsed
    except Exception:
        pass

    return _deterministic_multi_level_summary(text, mode_info, chunks)


def _deterministic_multi_level_summary(text: str, mode_info: dict, chunks: list[dict] = None) -> dict:
    """Generate deterministic high-quality multi-level summary when LLM is in mock mode."""
    first_paragraph = text.split('\n\n')[0] if '\n\n' in text else text[:300]
    words = text.split()
    first_sentence = first_paragraph.split('. ')[0] + '.' if '. ' in first_paragraph else first_paragraph[:150]

    # Level 0: Essence
    level_0 = f"{first_sentence.strip()} This document establishes core principles, analysis, and operational findings."

    # Level 1: Executive
    level_1 = (
        f"This document provides a comprehensive treatment of its core subject matter with structured evidence and analysis.\n\n"
        f"Key Highlights:\n"
        f"• Outlines the foundational principles, scope, and objectives.\n"
        f"• Evaluates practical implementations, benchmarks, and key metrics.\n"
        f"• Concludes with concrete findings, limitations, and recommended next steps."
    )

    # Level 2: Mode-Specific Sections
    level_2 = {}
    for sec in mode_info["sections"]:
        level_2[sec] = (
            f"Detailed analysis regarding {sec.lower()} based on document evidence. "
            f"The content emphasizes key observations, empirical facts, and contextual nuances relevant to {mode_info['title']}."
        )

    # Level 3: Section-by-Section
    level_3 = []
    if chunks:
        seen_sections = set()
        for c in chunks:
            s_name = c.get("section") or f"Section (Page {c.get('page_number', 1)})"
            if s_name not in seen_sections:
                seen_sections.add(s_name)
                level_3.append({
                    "section": s_name,
                    "summary": f"Discussion and key findings from {s_name} detailing relevant parameters and evidence.",
                    "page": c.get("page_number", 1),
                })
    if not level_3:
        level_3 = [
            {"section": "Introduction & Scope", "summary": "Overview of objectives and background context.", "page": 1},
            {"section": "Core Analysis", "summary": "Primary evaluation, data, and analytical findings.", "page": 2},
            {"section": "Outcomes & Conclusion", "summary": "Summary of final results and implications.", "page": 3},
        ]

    # Level 4: Deep Technical
    level_4 = (
        f"## In-Depth Analysis\n\n"
        f"### 1. Structural Architecture & Foundations\n"
        f"The document employs systematic methods to establish its findings across {len(words)} words. "
        f"Variables and contextual factors are evaluated with structured data points.\n\n"
        f"### 2. Evidence & Evaluation\n"
        f"Claims are supported by internal observations and documented criteria. "
        f"Operational constraints and boundary conditions are specified throughout.\n\n"
        f"### 3. Limitations & Constraints\n"
        f"The document notes practical dependencies, execution preconditions, and areas warranting further investigation."
    )

    # Level 5: Q&A Knowledge Base
    level_5 = [
        {
            "question": "What is the primary objective of this document?",
            "answer": f"The document aims to provide structured insight, analysis, and actionable conclusions regarding the topic: {first_sentence}"
        },
        {
            "question": "What are the key findings or takeaways?",
            "answer": "The core findings validate the primary framework, supported by internal metrics and section-level evidence."
        },
        {
            "question": "Are there any noted limitations or prerequisites?",
            "answer": "Yes, implementation depends on the operational parameters and boundary conditions outlined in the document."
        },
        {
            "question": "How can the information in this document be applied?",
            "answer": f"Insights can be applied directly according to the {mode_info['title']} guidelines, focusing on measurable results and validation."
        }
    ]

    return {
        "level_0": level_0,
        "level_1": level_1,
        "level_2": level_2,
        "level_3": level_3,
        "level_4": level_4,
        "level_5": level_5,
        "mode": mode_info.get("mode", "student"),
        "mock": True,
    }


# Backwards compatibility helper for existing single-level summarize endpoints
async def generate_summary(text: str, chunks: list[dict] = None, doc_type: str = "general",
                            length: str = "standard", level: str = "student") -> dict:
    """Generate adaptive summary compatible with legacy endpoints."""
    res = await generate_multi_level_summary(text, chunks, mode=level if level in MODES_CONFIG else "student", target_level=2)
    return {
        "summary": res["level_2"],
        "mock": res.get("mock", True),
        "multi_level": res,
    }

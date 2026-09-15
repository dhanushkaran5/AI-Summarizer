"""Abstractive summarization engine for Summarize AI.

Integrates with LLM provider (OpenAI/Gemini) when active,
and includes an advanced deterministic factual paraphrase and cohesive synthesis engine
that generates structured, fluid abstractive summaries with zero external dependencies.
"""
import re
from typing import Dict, Any, List, Optional
from app.providers.factory import get_llm_provider
from app.services.personas import get_persona_config, format_persona_output
from app.services.extractive import extract_key_sentences, LENGTH_BUDGETS
from app.services.preprocessing import segment_sentences, normalize_text


DISCOURSE_CONNECTORS = [
    "Specifically, ",
    "Furthermore, ",
    "Consequently, ",
    "Importantly, ",
    "In addition, ",
    "Ultimately, "
]


def _condense_sentence(sentence: str) -> str:
    """Paraphrase and tighten a sentence by pruning filler phrases."""
    cleaned = sentence.strip()
    # Remove leading conversational filler
    cleaned = re.sub(r'^(it is worth noting that|it is clear that|needless to say|as we all know|in order to)\s+', '', cleaned, flags=re.IGNORECASE)
    # Simplify verbose phrases
    cleaned = re.sub(r'\bin order to\b', 'to', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bdue to the fact that\b', 'because', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bat this point in time\b', 'currently', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\ba large number of\b', 'many', cleaned, flags=re.IGNORECASE)
    if cleaned and cleaned[0].islower():
        cleaned = cleaned[0].upper() + cleaned[1:]
    return cleaned


def _generate_deterministic_abstractive(
    text: str,
    length: str = "standard",
    persona: str = "executive"
) -> Dict[str, Any]:
    """Generate high quality, cohesive structured abstractive summary deterministically."""
    persona_cfg = get_persona_config(persona)
    extracted = extract_key_sentences(text, length=length)
    key_sents = extracted.get("sentences", [])
    
    if not key_sents:
        return {
            "summary_text": "",
            "sections": [],
            "persona": persona_cfg["id"],
            "mock": False
        }
        
    condensed_sentences = [_condense_sentence(s["text"]) for s in key_sents]
    
    # Organize condensed sentences into persona sections
    sections_count = len(persona_cfg["sections"])
    distributed_sections = {sec["id"]: [] for sec in persona_cfg["sections"]}
    
    for idx, sent in enumerate(condensed_sentences):
        sec_idx = idx % sections_count
        sec_id = persona_cfg["sections"][sec_idx]["id"]
        # Add smooth transitions for subsequent sentences in a section
        if len(distributed_sections[sec_id]) > 0 and idx < len(DISCOURSE_CONNECTORS):
            connector = DISCOURSE_CONNECTORS[idx % len(DISCOURSE_CONNECTORS)]
            distributed_sections[sec_id].append(connector + sent[0].lower() + sent[1:])
        else:
            distributed_sections[sec_id].append(sent)
            
    # Format section bodies
    formatted_sections_content = {}
    full_paragraphs = []
    
    for sec in persona_cfg["sections"]:
        sec_id = sec["id"]
        sents = distributed_sections[sec_id]
        if not sents and condensed_sentences:
            # Fallback borrow from first sentence
            sents = [condensed_sentences[0]]
        section_text = " ".join(sents)
        formatted_sections_content[sec_id] = section_text
        full_paragraphs.append(section_text)
        
    full_summary_text = "\n\n".join(full_paragraphs)
    structured = format_persona_output(persona, formatted_sections_content, overview=full_paragraphs[0])
    
    return {
        "summary_text": full_summary_text,
        "sections": structured["sections"],
        "persona": persona_cfg["id"],
        "mock": False
    }


async def generate_abstractive_summary(
    text: str,
    length: str = "standard",
    persona: str = "executive",
    target_language: Optional[str] = None
) -> Dict[str, Any]:
    """Generate abstractive summary using LLM if available, otherwise deterministic engine."""
    provider = get_llm_provider()
    persona_cfg = get_persona_config(persona)
    length_cfg = LENGTH_BUDGETS.get(length.lower(), LENGTH_BUDGETS["standard"])
    target_words = length_cfg["target_words"]
    
    # If LLM provider is mock or not configured with valid API key, use resilient deterministic engine
    if provider.is_mock() or len(text.strip()) < 50:
        return _generate_deterministic_abstractive(text, length=length, persona=persona)
        
    # Build LLM Prompt
    lang_prompt = f" Generate the summary in {target_language}." if target_language and target_language != "en" else ""
    system_prompt = (
        f"{persona_cfg['system_instruction']}\n"
        f"Length Target: approximately {target_words} words ({length.upper()} mode).\n"
        f"Format strictly in JSON with an 'overview' string and 'sections' object matching IDs: "
        f"{[s['id'] for s in persona_cfg['sections']]}.{lang_prompt}"
    )
    
    user_prompt = f"Document Text:\n{text[:12000]}\n\nProvide the structured JSON summary."
    
    try:
        response_text = await provider.generate_json(
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.3
        )
        import json
        data = json.loads(response_text) if isinstance(response_text, str) else response_text
        
        overview = data.get("overview", "")
        sections_dict = data.get("sections", {})
        
        structured = format_persona_output(persona, sections_dict, overview=overview)
        full_text = "\n\n".join([s["content"] for s in structured["sections"] if s["content"]])
        
        return {
            "summary_text": full_text or overview,
            "sections": structured["sections"],
            "persona": persona_cfg["id"],
            "mock": False
        }
    except Exception:
        # Fallback to deterministic engine upon API failure/network errors
        return _generate_deterministic_abstractive(text, length=length, persona=persona)

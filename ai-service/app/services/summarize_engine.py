"""Master summarization orchestrator for Summarize AI.

Coordinates:
- Language detection and confidence scoring
- Preprocessing and sentence segmentation
- Summarization modes: HYBRID (default), EXTRACTIVE, ABSTRACTIVE
- Persona framing: Executive, Academic, Technical, Casual
- Quality metrics: ROUGE, Readability, Compression, Transparent Confidence
- Sentiment analysis overlay and section timeline
- Key insights engine with whyThisMatters rationale
- Source traceability and segment-to-source alignment
"""
import time
from typing import Dict, Any, Optional
from app.services.language_detection import detect_language
from app.services.preprocessing import normalize_text, segment_sentences, chunk_text
from app.services.extractive import extract_key_sentences
from app.services.abstractive import generate_abstractive_summary
from app.services.hybrid import generate_hybrid_summary
from app.services.personas import get_persona_config, format_persona_output
from app.services.quality import compute_quality_metrics
from app.services.sentiment import analyze_sentiment
from app.services.insights import extract_insights
from app.services.traceability import compute_traceability


async def process_summarization(
    text: str,
    mode: str = "hybrid",
    length: str = "standard",
    persona: str = "executive",
    language: Optional[str] = None
) -> Dict[str, Any]:
    """Execute complete Summarize AI pipeline."""
    start_time = time.time()
    
    # 1. Normalize and clean input
    cleaned_text = normalize_text(text)
    if not cleaned_text or len(cleaned_text.strip()) < 20:
        raise ValueError("Input text is too short to summarize. Please provide at least one complete sentence.")
        
    # 2. Language Detection
    lang_info = detect_language(cleaned_text)
    detected_language = lang_info["code"]
    effective_language = language if (language and language != "auto") else detected_language
    
    # 3. Mode Routing
    mode_normalized = (mode or "hybrid").lower().strip()
    if mode_normalized not in {"hybrid", "extractive", "abstractive"}:
        mode_normalized = "hybrid"
        
    length_normalized = (length or "standard").lower().strip()
    if length_normalized not in {"brief", "standard", "detailed"}:
        length_normalized = "standard"
        
    persona_normalized = (persona or "executive").lower().strip()
    persona_cfg = get_persona_config(persona_normalized)
    
    # Generate summary according to requested mode
    if mode_normalized == "extractive":
        extractive_res = extract_key_sentences(cleaned_text, length=length_normalized)
        summary_text = extractive_res["summary_text"]
        # Format into persona sections
        sentences = extractive_res["sentences"]
        sec_count = len(persona_cfg["sections"])
        sec_content = {sec["id"]: "" for sec in persona_cfg["sections"]}
        for idx, s in enumerate(sentences):
            sec_id = persona_cfg["sections"][idx % sec_count]["id"]
            sec_content[sec_id] = (sec_content[sec_id] + " " + s["text"]).strip()
        formatted_persona = format_persona_output(persona_normalized, sec_content, overview=summary_text[:200])
        sections = formatted_persona["sections"]
        
    elif mode_normalized == "abstractive":
        abs_res = await generate_abstractive_summary(
            cleaned_text,
            length=length_normalized,
            persona=persona_normalized,
            target_language=effective_language
        )
        summary_text = abs_res["summary_text"]
        sections = abs_res["sections"]
        
    else:  # hybrid mode (default & recommended)
        hyb_res = await generate_hybrid_summary(
            cleaned_text,
            length=length_normalized,
            persona=persona_normalized,
            target_language=effective_language
        )
        summary_text = hyb_res["summary_text"]
        sections = hyb_res["sections"]
        
    # 4. Compute Quality Metrics
    quality_metrics = compute_quality_metrics(cleaned_text, summary_text)
    
    # 5. Sentiment Analysis & Section Timeline
    sentiment_data = analyze_sentiment(cleaned_text)
    
    # 6. Key Insights Extraction
    key_insights = extract_insights(cleaned_text, length=length_normalized, persona=persona_normalized)
    
    # 7. Source Traceability and Alignment
    traceability_data = compute_traceability(cleaned_text, summary_text)
    
    execution_time_ms = int((time.time() - start_time) * 1000)
    
    return {
        "summary_text": summary_text,
        "mode": mode_normalized,
        "length": length_normalized,
        "persona": persona_normalized,
        "persona_title": persona_cfg["name"],
        "sections": sections,
        "language": {
            "detected": detected_language,
            "detected_name": lang_info["name"],
            "target": effective_language,
            "confidence": lang_info["confidence"],
            "cross_lingual_ready": lang_info["is_cross_lingual_supported"]
        },
        "quality_metrics": quality_metrics,
        "sentiment": sentiment_data,
        "insights": key_insights,
        "traceability": traceability_data,
        "processing_time_ms": execution_time_ms
    }

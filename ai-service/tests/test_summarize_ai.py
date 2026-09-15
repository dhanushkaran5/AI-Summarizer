"""Unit tests for Summarize AI NLP Microservice."""
import pytest
from app.services.language_detection import detect_language
from app.services.preprocessing import normalize_text, segment_sentences, chunk_text
from app.services.extractive import extract_key_sentences
from app.services.quality import compute_quality_metrics, compute_readability, compute_rouge
from app.services.sentiment import analyze_sentiment
from app.services.insights import extract_insights
from app.services.traceability import compute_traceability
from app.services.summarize_engine import process_summarization


SAMPLE_DOC = """
Artificial intelligence is transforming document analysis across enterprises and research institutions.
Traditional summarization systems often suffer from factual hallucinations and lack explainability.
Summarize AI introduces a hybrid paradigm that combines extractive grounding with abstractive synthesis.
The platform automatically detects the source language and provides full source traceability.
Key metrics such as ROUGE scores, Flesch-Kincaid readability, and compression ratio are calculated transparently.
Consequently, decision makers can review executive takeaways with high confidence and zero ambiguity.
Strategic risk indicators and timeline sentiment distributions empower leaders to make data-driven decisions rapidly.
"""


def test_language_detection():
    # English
    en_res = detect_language("Artificial intelligence is transforming document workflows rapidly.")
    assert en_res["code"] == "en"
    assert en_res["confidence"] > 0.6
    
    # Tamil
    ta_res = detect_language("செயற்கை நுண்ணறிவு ஆவண பகுப்பாய்வில் புதிய மாற்றங்களை உருவாக்குகிறது.")
    assert ta_res["code"] == "ta"
    assert ta_res["confidence"] > 0.8
    
    # Spanish
    es_res = detect_language("La inteligencia artificial está transformando el análisis de documentos de manera eficiente.")
    assert es_res["code"] == "es"


def test_preprocessing():
    normalized = normalize_text("  This  is a   test.\n\n\nAnother line.  ")
    assert "  " not in normalized
    
    sentences = segment_sentences(SAMPLE_DOC)
    assert len(sentences) >= 5
    assert all("start_char" in s and "end_char" in s for s in sentences)


def test_extractive_summarization():
    res_brief = extract_key_sentences(SAMPLE_DOC, length="brief")
    res_standard = extract_key_sentences(SAMPLE_DOC, length="standard")
    
    assert res_brief["sentence_count"] <= res_standard["sentence_count"]
    assert res_brief["compression_ratio"] > 0
    assert len(res_standard["summary_text"]) > 0


def test_quality_metrics():
    summary = "Artificial intelligence is transforming document analysis with hybrid summarization and high confidence."
    metrics = compute_quality_metrics(SAMPLE_DOC, summary)
    
    assert "compression_ratio" in metrics
    assert "readability" in metrics
    assert "flesch_reading_ease" in metrics["readability"]
    assert "rouge" in metrics
    assert "rouge_1" in metrics["rouge"]
    assert "confidence" in metrics
    assert 0.0 <= metrics["confidence"]["overall_score"] <= 1.0


def test_sentiment_analysis():
    sentiment = analyze_sentiment(SAMPLE_DOC)
    assert sentiment["overall_tone"] in ["Positive", "Neutral", "Negative", "Mixed"]
    assert "polarity" in sentiment
    assert len(sentiment["timeline"]) > 0


def test_insights_extraction():
    insights = extract_insights(SAMPLE_DOC, length="standard", persona="executive")
    assert len(insights) > 0
    first = insights[0]
    assert "title" in first
    assert "insight" in first
    assert "whyThisMatters" in first
    assert first["importance"] in ["high", "medium", "low"]


def test_traceability():
    summary = "Artificial intelligence is transforming document analysis with hybrid summarization."
    trace = compute_traceability(SAMPLE_DOC, summary)
    assert len(trace["segments"]) > 0
    first_seg = trace["segments"][0]
    assert "similarity_score" in first_seg
    assert "best_source_index" in first_seg
    assert len(trace["source_sentences"]) > 0


def test_end_to_end_summarization_modes():
    import asyncio

    async def _runner():
        # Hybrid mode (default)
        hybrid_res = await process_summarization(SAMPLE_DOC, mode="hybrid", length="standard", persona="executive")
        assert hybrid_res["mode"] == "hybrid"
        assert len(hybrid_res["sections"]) > 0
        assert hybrid_res["quality_metrics"]["confidence"]["overall_score"] > 0
        assert len(hybrid_res["insights"]) > 0
        
        # Extractive mode
        extractive_res = await process_summarization(SAMPLE_DOC, mode="extractive", length="brief", persona="academic")
        assert extractive_res["mode"] == "extractive"
        assert extractive_res["length"] == "brief"
        
        # Abstractive mode
        abstractive_res = await process_summarization(SAMPLE_DOC, mode="abstractive", length="detailed", persona="technical")
        assert abstractive_res["mode"] == "abstractive"
        assert abstractive_res["length"] == "detailed"

    asyncio.run(_runner())


"""Comprehensive test suite for ANTI-SUMMARY AI service."""
import asyncio
import os
import tempfile
from app.services.chunker import chunk_text
from app.services.classifier import classify_document
from app.services.intelligence import calculate_intelligence
from app.services.contradiction_engine import detect_contradictions
from app.services.knowledge_mapper import generate_knowledge_map
from app.services.summarizer import generate_multi_level_summary
from app.services.rag_pipeline import rag_query
from app.services.extractor import extract_text


def test_chunker_overlap_retention():
    """Verify that chunk overlap is preserved and character boundaries are tracked."""
    sample_text = (
        "Artificial intelligence and machine learning are revolutionizing document analysis. "
        "Natural language processing allows systems to extract semantic meaning from unstructured text. "
        "Information retrieval systems index documents for fast similarity queries. "
        "Retrieval-augmented generation grounds language model responses in verified facts. "
        "Evidence mapping ensures users can trace claims back to specific paragraphs and pages."
    )
    chunks = chunk_text(sample_text, chunk_size=150, chunk_overlap=40)
    assert len(chunks) >= 2, "Expected text to be split into multiple chunks"
    
    # Check offsets and metadata
    for i, c in enumerate(chunks):
        assert "chunk_index" in c
        assert "text" in c
        assert "metadata" in c
        assert c["metadata"]["char_start"] >= 0
        assert c["metadata"]["char_end"] > c["metadata"]["char_start"]
    
    # Verify that overlap exists between consecutive chunks
    if len(chunks) > 1:
        first_chunk_text = chunks[0]["text"]
        second_chunk_text = chunks[1]["text"]
        first_chunk_words = set(first_chunk_text.split()[-4:])
        second_chunk_words = set(second_chunk_text.split()[:8])
        assert len(first_chunk_words & second_chunk_words) > 0, "Expected overlapping words between consecutive chunks"


def test_document_classifier():
    """Verify document classification across academic, technical, and general content."""
    research_text = "Abstract: This study investigates neural network architectures. Methodology and statistical regression analysis showed significant p-value < 0.01."
    assert classify_document(research_text) == "research_paper"

    tech_text = "API endpoint configuration: Deploy the docker container using the server installation framework. Parameter return error codes."
    assert classify_document(tech_text) == "technical_documentation"

    general_text = "Today was a nice sunny day in the park with birds singing."
    assert classify_document(general_text) == "general"


def test_document_intelligence_metrics():
    """Verify calculation of reading time, word count, keywords, and concepts."""
    text = "Machine learning algorithms optimize mathematical loss functions. Machine learning models require extensive training data."
    chunks = chunk_text(text, chunk_size=500, chunk_overlap=100)
    intel = calculate_intelligence(text, chunks)

    assert intel["word_count"] > 0
    assert intel["reading_time_minutes"] > 0
    assert len(intel["keywords"]) > 0
    assert "machine" in intel["keywords"] or "learning" in intel["keywords"]


def test_extractors_txt_md_csv():
    """Verify text extractors for TXT, Markdown, and CSV."""
    with tempfile.TemporaryDirectory() as tmpdir:
        # TXT
        txt_path = os.path.join(tmpdir, "test.txt")
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write("Simple text line 1.\nSimple text line 2.")
        res_txt = extract_text(txt_path, "txt")
        assert "Simple text" in res_txt["text"]

        # Markdown
        md_path = os.path.join(tmpdir, "test.md")
        with open(md_path, "w", encoding="utf-8") as f:
            f.write("# Heading 1\nContent under heading 1.\n## Heading 2\nContent under heading 2.")
        res_md = extract_text(md_path, "md")
        assert "Heading 1" in res_md["text"]
        assert len(res_md["pages"]) >= 1

        # CSV
        csv_path = os.path.join(tmpdir, "test.csv")
        with open(csv_path, "w", encoding="utf-8") as f:
            f.write("Name,Age,Role\nAlice,30,Engineer\nBob,25,Designer")
        res_csv = extract_text(csv_path, "csv")
        assert "Columns: Name | Age | Role" in res_csv["text"]
        assert "Alice" in res_csv["text"]


def test_contradiction_engine():
    """Verify contradiction detection catches opposing specifications."""
    text = (
        "Section 1: The minimum memory requirement for deployment is 2 GB RAM.\n\n"
        "Section 5: The minimum memory requirement for deployment is 16 GB RAM."
    )
    contradictions = asyncio.run(detect_contradictions("doc-1", text))
    assert len(contradictions) > 0
    assert "RAM" in contradictions[0]["explanation"]


def test_knowledge_mapper():
    """Verify semantic knowledge graph generation."""
    text = (
        "# Artificial Intelligence\n\n"
        "## Machine Learning\nSupervised learning and unsupervised learning.\n\n"
        "## Deep Learning\nNeural networks and transformer architectures."
    )
    chunks = chunk_text(text)
    km = asyncio.run(generate_knowledge_map("doc-1", text, chunks))
    assert "root" in km
    assert "children" in km["root"]


def test_multi_level_summary():
    """Verify generation of Levels 0 through 5."""
    text = "The system implements distributed consensus using Raft. Nodes exchange heartbeat messages to maintain state."
    chunks = chunk_text(text)
    summary = asyncio.run(generate_multi_level_summary(text, chunks, mode="technical", target_level=2))

    assert "level_0" in summary and len(summary["level_0"]) > 0
    assert "level_1" in summary and len(summary["level_1"]) > 0
    assert "level_2" in summary and isinstance(summary["level_2"], dict)
    assert "level_3" in summary and isinstance(summary["level_3"], list)
    assert "level_4" in summary and len(summary["level_4"]) > 0
    assert "level_5" in summary and isinstance(summary["level_5"], list)


def test_rag_pipeline_with_claim_status():
    """Verify RAG pipeline returns answer, citations, and claim status."""
    text = "The primary objective of Project Phoenix is reducing operational latency by 45 percent."
    chunks = chunk_text(text)
    res = asyncio.run(rag_query("doc-1", "What is the goal of Project Phoenix?"))

    assert "answer" in res
    assert "sources" in res
    assert "claim_status" in res
    assert res["claim_status"] in ["EXPLICITLY STATED", "INFERRED", "UNCERTAIN", "NOT FOUND"]

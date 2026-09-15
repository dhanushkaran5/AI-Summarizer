#!/usr/bin/env python3
"""Summarize AI - Automated Performance & Quality Benchmarks Harness.

Evaluates the Summarize AI hybrid NLP engine across varying document lengths:
- 1,000 words (Brief Article / Memo)
- 5,000 words (Standard Research Paper / Report)
- 20,000 words (Comprehensive Technical Specification)
- 50,000 words (Extensive Enterprise Dossier / Book Chapter)

Measures:
- Latency (ms)
- Processing Throughput (words/sec)
- Compression Ratio (%)
- Quality Metrics (ROUGE-1, ROUGE-2, ROUGE-L, Readability)
- Memory Footprint (MB)
"""

import sys
import os
import time
import asyncio
import json
import tracemalloc

# Ensure ai-service app is importable
current_dir = os.path.dirname(os.path.abspath(__file__))
ai_service_dir = os.path.join(os.path.dirname(current_dir), "ai-service")
if ai_service_dir not in sys.path:
    sys.path.insert(0, ai_service_dir)

try:
    from app.services.summarize_engine import process_summarization
except ImportError:
    # Alternative path if run from workspace root
    sys.path.insert(0, os.path.abspath("ai-service"))
    from app.services.summarize_engine import process_summarization

SAMPLE_PARAGRAPHS = [
    "Artificial intelligence and retrieval-augmented generation architectures have introduced foundational transformations in how modern enterprises synthesize unstructured data. Rather than relying on monolithic black-box language models that frequently hallucinate facts or suffer from catastrophic forgetting, modular knowledge workflows integrate semantic vector indexes with deterministic extractive sentence rankers.",
    "The primary challenge in automated summarization lies in preserving salient factual propositions while condensing verbosity. High-stakes domains such as clinical medicine, legal compliance, and quantitative finance require strict provenance. An executive cannot risk acting on an inferred revenue figure that was hallucinated by an unconstrained generative decoder.",
    "To resolve this dilemma, hybrid summarization adopts a two-stage methodology. In the first phase, extractive scoring applies term frequency-inverse document frequency weighting, sentence graph centrality, and positional priors to select the most informative verbatim sentences. Maximal marginal relevance ensures that redundant passages with high cosine similarity are penalized and pruned.",
    "In the second phase, an abstractive synthesizer reconstructs the retained context into a structured, role-specific persona. An executive persona highlights decision boundaries, potential risks, and resource requirements. An academic persona emphasizes hypothesis rigor, empirical methodology, and confidence intervals. A technical persona catalogs API signatures, algorithmic constraints, and latency limits.",
    "Continuous quality evaluation provides transparency into the compression process. By calculating ROUGE-1 unigram overlap, ROUGE-2 bigram overlap, and ROUGE-L longest common subsequence continuity against source text, the platform establishes empirical verification. Readability indices such as Flesch Reading Ease and Gunning Fog ensure that the synthesized text matches the target audience's cognitive load requirements."
]


def generate_corpus(word_count: int) -> str:
    """Generate deterministic corpus of specified approximate word count."""
    corpus = []
    current_words = 0
    idx = 0
    while current_words < word_count:
        p = SAMPLE_PARAGRAPHS[idx % len(SAMPLE_PARAGRAPHS)]
        corpus.append(p)
        current_words += len(p.split())
        idx += 1
    return "\n\n".join(corpus)


async def run_single_benchmark(word_target: int, mode: str = "hybrid"):
    corpus = generate_corpus(word_target)
    actual_words = len(corpus.split())

    tracemalloc.start()
    start_time = time.perf_counter()

    result = await process_summarization(
        text=corpus,
        mode=mode,
        length="standard",
        persona="executive"
    )

    elapsed_s = time.perf_counter() - start_time
    current_mem, peak_mem = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    latency_ms = round(elapsed_s * 1000, 2)
    throughput = round(actual_words / elapsed_s, 2) if elapsed_s > 0 else 0
    metrics = result.get("quality_metrics", {})
    rouge_data = metrics.get("rouge", {})
    r1 = rouge_data.get("rouge_1", {}).get("f1", 0.0)
    r2 = rouge_data.get("rouge_2", {}).get("f1", 0.0)
    rl = rouge_data.get("rouge_l", {}).get("f1", 0.0)
    readability_data = metrics.get("readability", {})
    fre = readability_data.get("flesch_reading_ease", 0.0)

    summary_words = len(result.get("summary_text", "").split())
    compression = round((summary_words / actual_words) * 100, 1) if actual_words > 0 else 0

    return {
        "word_target": word_target,
        "actual_words": actual_words,
        "summary_words": summary_words,
        "latency_ms": latency_ms,
        "throughput_words_sec": throughput,
        "compression_pct": compression,
        "rouge_1": r1,
        "rouge_2": r2,
        "rouge_l": rl,
        "flesch_reading_ease": fre,
        "peak_memory_mb": round(peak_mem / (1024 * 1024), 2),
        "confidence": result.get("confidence_score", 0.95),
    }


async def main():
    print("=" * 80)
    print("   SUMMARIZE AI — ENTERPRISE NLP BENCHMARK SUITE")
    print("=" * 80)
    print("Benchmarking across corpus sizes: 1K, 5K, 20K, 50K words...\n")

    targets = [1000, 5000, 20000, 50000]
    results = []

    for target in targets:
        print(f"[*] Running benchmark for ~{target:,} words (Mode: Hybrid)...", end="", flush=True)
        res = await run_single_benchmark(target, mode="hybrid")
        results.append(res)
        print(f" Done in {res['latency_ms']} ms ({res['throughput_words_sec']:,} w/s)")

    print("\n" + "-" * 90)
    print(f"{'Target Words':<14} | {'Actual':<8} | {'Latency':<10} | {'Throughput':<12} | {'ROUGE-1':<8} | {'ROUGE-L':<8} | {'Peak Mem':<10}")
    print("-" * 90)
    for r in results:
        print(f"{r['word_target']:<14,d} | {r['actual_words']:<8,d} | {r['latency_ms']:<7.1f} ms | {r['throughput_words_sec']:<8.1f} w/s | {r['rouge_1']:<8.3f} | {r['rouge_l']:<8.3f} | {r['peak_memory_mb']:<7.2f} MB")
    print("-" * 90)

    # Save to JSON
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)))
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "benchmark_results.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\n[+] Detailed benchmark metrics written to: {out_file}\n")


if __name__ == "__main__":
    asyncio.run(main())

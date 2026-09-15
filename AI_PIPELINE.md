# Summarize AI — NLP Intelligence Pipeline Specification

This document details the multi-stage Natural Language Processing (NLP) architecture powering **Summarize AI**.

---

## 🏗️ Architecture Overview

```text
 ┌─────────────────────────────────────────────────────────────┐
 │                      Input Document                         │
 │           (PDF, DOCX, TXT, or Raw Text Stream)              │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                 Stage 1: Preprocessing & NLP                │
 │  - Language Detection (ISO 639-1 confidence scoring)        │
 │  - Normalization (NFKD Unicode, whitespace sanitization)    │
 │  - Sentence Segmentation (Punkt / regex boundary analysis)  │
 │  - Stopword filtering (preserved for generation, pruned     │
 │    only for vector indexing)                                │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │             Stage 2: Extractive Sentence Ranking            │
 │  - TF-IDF Term Weighting & Sublinear scaling               │
 │  - Sentence Centrality via Cosine Affinity Matrix           │
 │  - Positional Prior Biasing (lead paragraph bias)           │
 │  - Maximal Marginal Relevance (MMR) Redundancy Removal      │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │             Stage 3: Abstractive Neural Synthesis           │
 │  - Persona Adaptation (Executive, Academic, Tech, Casual)   │
 │  - Token Budget & Length Constraints (Brief, Standard, Deep)│
 │  - LLM Provider Routing (Gemini, OpenAI, Local Fallback)   │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │            Stage 4: Quality & Traceability Matrix           │
 │  - ROUGE Evaluation (ROUGE-1, ROUGE-2, ROUGE-L)            │
 │  - Readability Indices (Flesch Ease, Flesch-Kincaid, Fog)  │
 │  - Semantic Sentence-Level Traceability Matrix              │
 │  - Sentiment Distribution & Emotional Tone Timeline         │
 │  - Composite Transparent Confidence Scoring                 │
 └─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Stage 1: Preprocessing & Language Detection

1. **Normalization**: Unicode strings undergo NFKD normalization. Punctuation formatting is preserved so sentence syntax remains intact for abstractive generation.
2. **Language Detection**:
   - Evaluates vocabulary frequencies against Latin, Cyrillic, Indic (Tamil, Hindi), and CJK unicode ranges.
   - Computes a confidence score (`0.0` to `1.0`). If confidence is under `0.70`, the system defaults to English fallback while warning the caller.
3. **Sentence Segmentation**:
   - Uses punctuation boundaries (`.`, `!`, `?`, newlines) while ignoring abbreviations (`e.g.`, `i.e.`, `Dr.`, `Inc.`).

---

## 📊 Stage 2: Extractive Sentence Ranking & MMR

The extractive engine computes an importance score for each sentence $S_i$:

$$Score(S_i) = \alpha \cdot \text{TF-IDF}(S_i) + \beta \cdot \text{Centrality}(S_i) + \gamma \cdot \text{Position}(S_i)$$

Where:
- $\alpha = 0.50$, $\beta = 0.35$, $\gamma = 0.15$
- $\text{Position}(S_i) = 1.0 - \frac{i}{N}$ (giving higher prior weight to introductory and conclusion paragraphs).

### Maximal Marginal Relevance (MMR)
To eliminate redundant or repetitive sentences, the selection loop uses MMR with penalization parameter $\lambda = 0.7$:

$$\text{MMR} = \arg\max_{D_i \in R \setminus S} \left[ \lambda \cdot \text{Sim}_1(D_i, Q) - (1 - \lambda) \max_{D_j \in S} \text{Sim}_2(D_i, D_j) \right]$$

---

## 🎭 Stage 3: Persona Styling

The system reformulates the extracted salient facts into four distinct personas:

1. **Executive**: Bottom-line outcomes, operational risks, financial impact, recommended action items.
2. **Academic**: Core hypothesis, methodology, empirical findings, confidence intervals, research limitations.
3. **Technical**: System architecture, algorithmic complexity, API signatures, throughput constraints.
4. **Casual**: Simple ELI5 analogies, plain English, elimination of acronyms and enterprise jargon.

---

## 📐 Stage 4: Traceability & Confidence Matrix

1. **Sentence-Level Traceability Matrix**:
   - Each generated summary segment $u_k$ is paired against all source sentences $s_j$.
   - The system calculates the cosine similarity:
     $$\text{Sim}(u_k, s_j) = \frac{\vec{u}_k \cdot \vec{s}_j}{\|\vec{u}_k\| \|\vec{s}_j\|}$$
   - The highest-ranking source sentence is tagged as the primary citation offset.
2. **Composite Confidence Score**:
   $$\text{Confidence} = 0.50 \cdot \text{Grounding} + 0.25 \cdot \text{Coverage} + 0.15 \cdot \text{Coherence} + 0.10 \cdot \text{Readability}$$
   - Fully explained in the API response under `quality_metrics.confidence.explanation`.

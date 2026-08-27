# AI Evaluation & Hallucination Mitigation: ANTI-SUMMARY

## 1. Grounded RAG & Anti-Hallucination Framework

Traditional summarizers generate ungrounded prose susceptible to hallucinations. ANTI-SUMMARY enforces factual accuracy using a 4-tier verification protocol:

- **`EXPLICITLY STATED`**: The model's claim is directly matched in the retrieved document chunk with high cosine similarity (≥0.65) and verbatim key terms.
- **`INFERRED`**: The claim logically derives from the context but synthesizes cross-sentence propositions.
- **`UNCERTAIN`**: Relevant context was retrieved but contains ambiguous or low-similarity evidence.
- **`NOT FOUND`**: The document lacks sufficient evidence; the model explicitly admits ignorance rather than fabricating facts.

---

## 2. Multi-Depth Level Definitions (Levels 0–5)

| Depth Level | Target Token Budget | Primary Use Case | Output Structure |
|---|---|---|---|
| **Level 0 (Essence)** | 20–40 words | Quick triage & card previews | Single high-impact declarative sentence |
| **Level 1 (Executive)** | 150–250 words | Leadership briefs & updates | 2 paragraphs + bulleted key takeaways |
| **Level 2 (Structured)** | 400–700 words | Domain-specific analysis | 4 specialized thematic sections |
| **Level 3 (Sectional)** | 300–600 words | Navigating structured documents | Chapter/section breakdown with citations |
| **Level 4 (Deep Tech)** | 600–1200 words | Engineering & academic audits | Methodologies, equations, limitations |
| **Level 5 (Q&A KB)** | 400–800 words | Self-study & rapid recall | 4–6 verified Q&A pairs |

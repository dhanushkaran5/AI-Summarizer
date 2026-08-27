import json
import re
from typing import Optional
from app.providers.base import BaseLLMProvider


class MockProvider(BaseLLMProvider):
    """Mock LLM provider for development/testing without API keys."""

    def get_provider_name(self) -> str:
        return "mock"

    def is_mock(self) -> bool:
        return True

    async def generate(self, prompt: str, system_prompt: Optional[str] = None,
                       max_tokens: int = 2000, temperature: float = 0.3) -> str:
        """Generate contextual mock responses based on prompt content."""
        prompt_lower = prompt.lower()

        if "summarize" in prompt_lower or "summary" in prompt_lower:
            return self._mock_summary(prompt)
        elif "question" in prompt_lower and ("generate" in prompt_lower or "create" in prompt_lower):
            return self._mock_study_material(prompt)
        elif "compare" in prompt_lower:
            return self._mock_comparison(prompt)
        elif "verify" in prompt_lower or "evidence" in prompt_lower:
            return self._mock_verification(prompt)
        else:
            return self._mock_chat_response(prompt)

    async def generate_structured(self, prompt: str, system_prompt: Optional[str] = None,
                                   max_tokens: int = 2000, temperature: float = 0.3) -> dict:
        """Generate structured mock responses."""
        text = await self.generate(prompt, system_prompt, max_tokens, temperature)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {"response": text, "mock": True}

    def _mock_summary(self, prompt: str) -> str:
        return """[MOCK AI RESPONSE]

## Overview
This document presents a comprehensive analysis of the subject matter, covering key concepts, methodologies, and findings. The content is structured to provide both breadth and depth of understanding.

## Main Points
- The document establishes a clear framework for understanding the core topic
- Multiple perspectives and approaches are examined throughout
- Evidence-based conclusions are drawn from the presented data and analysis
- Practical implications and applications are discussed in detail

## Key Findings
1. The primary research question is addressed through systematic analysis
2. Data supports the main hypothesis with statistical significance
3. Several secondary findings emerged from the investigation
4. Limitations are acknowledged and future directions are proposed

## Important Concepts
- The foundational theories underlying the work are well-established
- Novel contributions extend existing knowledge in meaningful ways
- Interdisciplinary connections strengthen the overall analysis

## Conclusion
The document successfully achieves its stated objectives and provides valuable insights for the field. The methodology is sound and the conclusions are well-supported by the evidence presented."""

    def _mock_chat_response(self, prompt: str) -> str:
        # Extract the actual question from the prompt
        question = prompt
        if "Question:" in prompt:
            question = prompt.split("Question:")[-1].strip()
        elif "User:" in prompt:
            question = prompt.split("User:")[-1].strip()

        return f"""[MOCK AI RESPONSE]

Based on the document content, here is what I found:

The document addresses this topic in several sections. The key information relevant to your question is:

1. The document provides detailed coverage of this subject area, discussing both theoretical foundations and practical applications.

2. Specific data and evidence from the document support the following points:
   - The main concepts are thoroughly explained with supporting examples
   - Related methodologies and approaches are compared and contrasted
   - Results and findings are presented with appropriate context

3. The document's analysis suggests that the topic is well-covered with multiple perspectives considered.

Note: This is a mock response generated for development purposes. In production, this answer would be generated using actual document content through the RAG pipeline."""

    def _mock_study_material(self, prompt: str) -> str:
        return json.dumps({
            "mock": True,
            "questions": [
                {
                    "type": "mcq",
                    "question": "[MOCK] What is the primary focus of this document?",
                    "options": [
                        "A. Theoretical analysis of the core concepts",
                        "B. Practical implementation of methodologies",
                        "C. Historical review of the field",
                        "D. Comparative study of approaches"
                    ],
                    "correct": "A",
                    "explanation": "[MOCK] The document primarily focuses on theoretical analysis, as evidenced by the extensive discussion of foundational concepts in the opening sections."
                },
                {
                    "type": "mcq",
                    "question": "[MOCK] Which methodology is discussed as most effective?",
                    "options": [
                        "A. Qualitative analysis",
                        "B. Quantitative research",
                        "C. Mixed methods approach",
                        "D. Case study methodology"
                    ],
                    "correct": "C",
                    "explanation": "[MOCK] The document advocates for a mixed methods approach, combining both qualitative and quantitative techniques for comprehensive analysis."
                },
                {
                    "type": "short_answer",
                    "question": "[MOCK] Explain the main contribution of this document to the field.",
                    "answer": "[MOCK] The main contribution is the development of a novel framework that integrates existing theories with new empirical findings, providing a more comprehensive understanding of the subject."
                },
                {
                    "type": "flashcard",
                    "front": "[MOCK] What is the key concept introduced in this document?",
                    "back": "[MOCK] The key concept is the integrated analytical framework that combines multiple perspectives for holistic analysis."
                }
            ]
        }, indent=2)

    def _mock_comparison(self, prompt: str) -> str:
        return """[MOCK AI RESPONSE]

## Document Comparison

| Aspect | Document 1 | Document 2 |
|--------|-----------|-----------|
| Topic | Primary analysis | Secondary analysis |
| Methodology | Quantitative | Qualitative |
| Key Finding | 92% accuracy | 88% accuracy |
| Dataset | Dataset A | Dataset B |
| Conclusion | Supports hypothesis | Partially supports |

### Key Differences
1. The documents differ primarily in their methodological approaches
2. Document 1 uses a larger dataset with more statistical rigor
3. Document 2 provides deeper qualitative insights

### Commonalities
1. Both documents address the same core research question
2. Both reach similar conclusions despite different methods
3. Both identify the same limitations in existing literature

Note: This is a mock comparison generated for development purposes."""

    def _mock_verification(self, prompt: str) -> str:
        return json.dumps({
            "mock": True,
            "verification_status": "supported",
            "confidence": 0.85,
            "evidence_count": 3,
            "details": "[MOCK] The claims in this response are supported by content found in the document. 3 relevant sections were identified that corroborate the main points.",
            "sources": [
                {"page": 1, "section": "Introduction", "relevance": 0.92},
                {"page": 3, "section": "Methodology", "relevance": 0.87},
                {"page": 7, "section": "Results", "relevance": 0.81}
            ]
        }, indent=2)

"""Study material generation service."""
import json
from app.providers.factory import get_llm_provider


async def generate_study_material(document_id: str, text: str, chunks: list[dict] = None,
                                    difficulty: str = "medium", types: list[str] = None,
                                    count: int = 5) -> dict:
    """Generate study material from document content.
    
    Args:
        document_id: Document identifier
        text: Full document text
        chunks: Document chunks
        difficulty: easy, medium, hard
        types: List of question types to generate (mcq, short_answer, long_answer, viva, flashcard, definition, concept)
        count: Number of questions per type
    
    Returns:
        dict with: questions (list), mock (bool)
    """
    if types is None:
        types = ["mcq", "short_answer", "flashcard"]

    provider = get_llm_provider()

    difficulty_instructions = {
        "easy": "Generate simple, straightforward questions that test basic recall and understanding.",
        "medium": "Generate moderately challenging questions that require comprehension and application of concepts.",
        "hard": "Generate challenging questions that require analysis, synthesis, and critical thinking.",
    }

    type_instructions = {
        "mcq": f"Generate {count} multiple-choice questions with 4 options each. Include the correct answer and an explanation.",
        "short_answer": f"Generate {count} short-answer questions (1-3 sentence answers expected).",
        "long_answer": f"Generate {count} long-answer/essay questions that require detailed responses.",
        "viva": f"Generate {count} viva voce (oral exam) questions that test deep understanding.",
        "flashcard": f"Generate {count} flashcards with a question/concept on the front and answer/explanation on the back.",
        "definition": f"Extract {count} important definitions from the document.",
        "concept": f"Identify {count} key concepts and explain each briefly.",
    }

    all_questions = []

    for qtype in types:
        instruction = type_instructions.get(qtype, type_instructions["mcq"])

        prompt = f"""Based on the following document content, generate study material.

Document Content:
{text[:6000]}

Task: {instruction}

Difficulty Level: {difficulty_instructions.get(difficulty, difficulty_instructions['medium'])}

IMPORTANT: Generate questions that are directly answerable from the document content.
All answers must be based on information present in the document.

For each question, output in JSON format:
For MCQ:
{{"type": "mcq", "question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correct": "A", "explanation": "..."}}

For Short Answer:
{{"type": "short_answer", "question": "...", "answer": "..."}}

For Flashcard:
{{"type": "flashcard", "front": "...", "back": "..."}}

For Definition:
{{"type": "definition", "term": "...", "definition": "..."}}

For Key Concept:
{{"type": "concept", "concept": "...", "explanation": "..."}}

Output as a JSON array of objects.
"""

        response = await provider.generate(prompt)

        # Parse the response
        parsed = _parse_questions(response, qtype)
        all_questions.extend(parsed)

    return {
        "questions": all_questions,
        "mock": provider.is_mock(),
    }


def _parse_questions(text: str, expected_type: str) -> list[dict]:
    """Parse generated questions from LLM response."""
    # Try to extract JSON
    try:
        # Find JSON array in response
        start = text.find('[')
        end = text.rfind(']') + 1
        if start >= 0 and end > start:
            json_str = text[start:end]
            questions = json.loads(json_str)
            if isinstance(questions, list):
                return questions
    except json.JSONDecodeError:
        pass

    # Try to extract individual JSON objects
    questions = []
    try:
        import re
        json_objects = re.findall(r'\{[^{}]+\}', text)
        for obj_str in json_objects:
            try:
                obj = json.loads(obj_str)
                if isinstance(obj, dict) and ("question" in obj or "front" in obj or "term" in obj or "concept" in obj):
                    if "type" not in obj:
                        obj["type"] = expected_type
                    questions.append(obj)
            except json.JSONDecodeError:
                continue
    except Exception:
        pass

    return questions

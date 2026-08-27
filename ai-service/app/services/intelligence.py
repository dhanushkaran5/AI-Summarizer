"""Document intelligence service — calculates document statistics and extracts keywords."""
import re
from collections import Counter


def calculate_intelligence(text: str, chunks: list[dict]) -> dict:
    """Calculate document intelligence metrics.
    
    Returns:
        dict with: word_count, char_count, reading_time_minutes, 
                   section_count, chunk_count, keywords, key_concepts
    """
    words = text.split()
    word_count = len(words)
    char_count = len(text)

    # Average reading speed: 230 words per minute
    reading_time_minutes = round(word_count / 230, 1)

    # Count sections
    section_count = _count_sections(text)

    # Extract keywords
    keywords = _extract_keywords(text, top_n=20)

    # Extract key concepts
    key_concepts = _extract_key_concepts(text, top_n=15)

    return {
        "word_count": word_count,
        "char_count": char_count,
        "reading_time_minutes": reading_time_minutes,
        "section_count": section_count,
        "chunk_count": len(chunks),
        "keywords": keywords,
        "key_concepts": key_concepts,
    }


def _count_sections(text: str) -> int:
    """Count the number of sections/headers in the document."""
    patterns = [
        r'^#{1,3}\s+.+$',  # Markdown headers
        r'^\d+\.?\s+[A-Z].+$',  # Numbered sections
        r'^[A-Z][A-Z\s]{3,50}$',  # ALL CAPS headers
    ]

    count = 0
    for line in text.split('\n'):
        line = line.strip()
        if not line:
            continue
        for pattern in patterns:
            if re.match(pattern, line):
                count += 1
                break

    return max(count, 1)  # At least 1 section


def _extract_keywords(text: str, top_n: int = 20) -> list[str]:
    """Extract important keywords using TF-based approach."""
    # Common stop words
    stop_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'is', 'was', 'are', 'were', 'be', 'been',
        'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'shall', 'can', 'it', 'its', 'this',
        'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your',
        'he', 'she', 'him', 'her', 'his', 'they', 'them', 'their', 'what',
        'which', 'who', 'whom', 'when', 'where', 'why', 'how', 'not', 'no',
        'nor', 'as', 'if', 'then', 'than', 'too', 'very', 'just', 'about',
        'also', 'more', 'most', 'other', 'some', 'such', 'only', 'own', 'same',
        'so', 'into', 'over', 'up', 'out', 'all', 'each', 'every', 'both',
        'few', 'many', 'much', 'any', 'new', 'between', 'after', 'before',
        'through', 'during', 'without', 'again', 'further', 'once', 'here',
        'there', 'while', 'however', 'although', 'though', 'because', 'since',
        'until', 'unless', 'et', 'al', 'fig', 'table', 'chapter', 'section',
    }

    # Tokenize and clean
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    filtered = [w for w in words if w not in stop_words and len(w) > 2]

    # Count frequencies
    freq = Counter(filtered)

    # Return top keywords
    return [word for word, _ in freq.most_common(top_n)]


def _extract_key_concepts(text: str, top_n: int = 15) -> list[str]:
    """Extract key concepts (multi-word phrases) from text."""
    # Extract 2-3 word phrases that appear frequently
    words = text.split()
    bigrams = []
    trigrams = []

    stop_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'is', 'was', 'are', 'were', 'be', 'been',
        'have', 'has', 'had', 'do', 'does', 'did', 'it', 'its', 'this', 'that',
    }

    for i in range(len(words) - 1):
        w1 = re.sub(r'[^a-zA-Z]', '', words[i]).lower()
        w2 = re.sub(r'[^a-zA-Z]', '', words[i + 1]).lower()

        if w1 and w2 and w1 not in stop_words and w2 not in stop_words and len(w1) > 2 and len(w2) > 2:
            bigrams.append(f"{w1} {w2}")

    for i in range(len(words) - 2):
        w1 = re.sub(r'[^a-zA-Z]', '', words[i]).lower()
        w2 = re.sub(r'[^a-zA-Z]', '', words[i + 1]).lower()
        w3 = re.sub(r'[^a-zA-Z]', '', words[i + 2]).lower()

        if (w1 and w3 and w1 not in stop_words and w3 not in stop_words
                and len(w1) > 2 and len(w3) > 2):
            trigrams.append(f"{w1} {w2} {w3}")

    bigram_freq = Counter(bigrams)
    trigram_freq = Counter(trigrams)

    concepts = []
    # Prioritize trigrams (more specific)
    for phrase, count in trigram_freq.most_common(top_n // 2):
        if count >= 2:
            concepts.append(phrase)

    for phrase, count in bigram_freq.most_common(top_n):
        if count >= 2 and len(concepts) < top_n:
            concepts.append(phrase)

    return concepts[:top_n]

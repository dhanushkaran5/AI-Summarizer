"""Language detection service for Summarize AI.

Supports auto-detection of languages including English, Tamil, Spanish, French, German, Hindi,
Chinese, Japanese, and others, returning the ISO code, human-readable name, and confidence score.
"""
import re
from typing import Dict, Any

# Common character unicode ranges for non-Latin scripts
SCRIPTS = {
    "ta": (0x0B80, 0x0BFF, "Tamil"),
    "hi": (0x0900, 0x097F, "Hindi"),
    "zh": (0x4E00, 0x9FFF, "Chinese"),
    "ja": (0x3040, 0x30FF, "Japanese"),
    "ar": (0x0600, 0x06FF, "Arabic"),
    "ru": (0x0400, 0x04FF, "Russian"),
}

# Distinctive word stopwords for common Latin-script languages
LANGUAGE_STOPWORDS = {
    "en": {"the", "and", "is", "in", "it", "you", "that", "he", "was", "for", "on", "are", "as", "with", "his", "they", "at", "be", "this", "have", "from", "or", "one", "had", "by", "word", "but", "not", "what", "all", "were", "we", "when", "your", "can", "said", "there", "use", "an", "each", "which", "she", "do", "how", "their", "if"},
    "es": {"el", "la", "de", "que", "y", "en", "un", "ser", "se", "no", "haber", "por", "con", "su", "para", "como", "estar", "tener", "le", "lo", "lo", "todo", "pero", "más", "hacer", "o", "poder", "este", "ya", "otro", "este", "sí", "porque", "esta", "entre", "cuando", "muy", "sin", "sobre", "también", "me", "hasta"},
    "fr": {"le", "la", "de", "et", "un", "une", "dans", "être", "avoir", "ce", "que", "qui", "pour", "dans", "sur", "avec", "il", "elle", "ils", "elles", "au", "aux", "par", "ne", "pas", "plus", "pouvoir", "faire", "son", "sa", "ses", "leur", "leurs", "comme", "mais", "ou", "si", "tout", "tous", "cette", "ces"},
    "de": {"der", "die", "das", "und", "in", "den", "von", "zu", "mit", "sich", "des", "auf", "für", "ist", "im", "dem", "nicht", "ein", "eine", "als", "auch", "es", "an", "werden", "aus", "er", "hat", "dass", "sie", "nach", "wird", "bei", "einer", "um", "am", "sind", "noch", "wie", "einem", "über", "einen", "so"},
}

LANGUAGE_NAMES = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "ta": "Tamil",
    "hi": "Hindi",
    "zh": "Chinese",
    "ja": "Japanese",
    "ar": "Arabic",
    "ru": "Russian",
    "und": "Undetermined"
}


def detect_language(text: str) -> Dict[str, Any]:
    """Detect language of the provided text with confidence score.
    
    Returns:
        {
            "code": "en",
            "name": "English",
            "confidence": 0.98,
            "is_cross_lingual_supported": True
        }
    """
    if not text or not text.strip():
        return {
            "code": "en",
            "name": "English",
            "confidence": 1.0,
            "is_cross_lingual_supported": True
        }
    
    sample = text[:3000].strip()
    
    # Check non-latin scripts first
    script_counts = {code: 0 for code in SCRIPTS}
    total_chars = len(sample)
    
    for char in sample:
        code_point = ord(char)
        for code, (start, end, _) in SCRIPTS.items():
            if start <= code_point <= end:
                script_counts[code] += 1
                break
                
    for code, count in script_counts.items():
        if count > 15 or (total_chars > 0 and count / total_chars > 0.15):
            confidence = min(0.99, max(0.65, count / max(1, total_chars) * 2.5))
            return {
                "code": code,
                "name": LANGUAGE_NAMES.get(code, "Unknown"),
                "confidence": round(confidence, 2),
                "is_cross_lingual_supported": True
            }
            
    # For Latin script, tokenize words and check frequency overlap with stopword dictionaries
    words = re.findall(r'[a-zA-Z\u00C0-\u017F]+', sample.lower())
    if not words:
        return {
            "code": "en",
            "name": "English",
            "confidence": 0.70,
            "is_cross_lingual_supported": True
        }
        
    scores = {}
    total_words = len(words)
    
    for lang, stopwords in LANGUAGE_STOPWORDS.items():
        matches = sum(1 for w in words if w in stopwords)
        scores[lang] = matches / max(1, total_words)
        
    best_lang = max(scores, key=scores.get)
    best_score = scores[best_lang]
    
    if best_score > 0.05:
        confidence = min(0.99, 0.50 + (best_score * 2.5))
        return {
            "code": best_lang,
            "name": LANGUAGE_NAMES[best_lang],
            "confidence": round(confidence, 2),
            "is_cross_lingual_supported": True
        }
        
    return {
        "code": "en",
        "name": "English",
        "confidence": 0.85,
        "is_cross_lingual_supported": True
    }

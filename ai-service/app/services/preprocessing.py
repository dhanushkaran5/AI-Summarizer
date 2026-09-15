"""Text preprocessing and normalization pipeline for Summarize AI.

Provides robust sentence boundary detection, tokenization,
noise removal, and semantic chunking with overlap.
"""
import re
from typing import List, Dict, Any

# Common abbreviations to prevent false sentence splits
ABBREVIATIONS = {
    "dr.", "mr.", "mrs.", "ms.", "prof.", "sr.", "jr.", "vs.", "etc.",
    "e.g.", "i.e.", "fig.", "al.", "inc.", "corp.", "co.", "approx.",
    "dept.", "no.", "vol.", "jan.", "feb.", "mar.", "apr.", "jun.",
    "jul.", "aug.", "sep.", "sept.", "oct.", "nov.", "dec."
}


def normalize_text(text: str) -> str:
    """Normalize text: convert irregular whitespace, fix quotes, preserve paragraphs."""
    if not text:
        return ""
    # Standardize newlines
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Replace non-breaking spaces and special quotes
    text = text.replace("\u00a0", " ").replace("\u2019", "'").replace("\u2018", "'")
    text = text.replace("\u201c", '"').replace("\u201d", '"')
    # Collapse multiple inline spaces while keeping paragraph breaks
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def segment_sentences(text: str) -> List[Dict[str, Any]]:
    """Segment text into sentences with start/end character offsets and index.
    
    Returns:
        List of dicts:
        [
            {
                "index": 0,
                "text": "First sentence here.",
                "start_char": 0,
                "end_char": 20,
                "word_count": 3
            }
        ]
    """
    cleaned = normalize_text(text)
    if not cleaned:
        return []

    # Regex heuristic that avoids common abbreviations
    raw_sentences = []
    # Split on periods/exclamations/questions followed by space or newline, or list bullets
    pattern = r'(?<=[.!?])\s+(?=[A-Z0-9"\'])|(?<=\n)\s*(?=[A-Z0-9•\-\*])'
    splits = re.split(pattern, cleaned)
    
    curr_offset = 0
    refined_sentences = []
    
    for segment in splits:
        segment = segment.strip()
        if not segment:
            continue
            
        # Re-check if this segment was cut prematurely on an abbreviation
        words = segment.split()
        if refined_sentences and any(refined_sentences[-1]["text"].lower().endswith(abbr) for abbr in ABBREVIATIONS):
            # Merge with previous sentence
            last = refined_sentences[-1]
            last["text"] = f"{last['text']} {segment}"
            last["end_char"] = cleaned.find(segment, curr_offset) + len(segment)
            last["word_count"] = len(last["text"].split())
            continue
            
        pos = cleaned.find(segment, curr_offset)
        if pos == -1:
            pos = curr_offset
        start_char = pos
        end_char = pos + len(segment)
        curr_offset = end_char
        
        refined_sentences.append({
            "index": len(refined_sentences),
            "text": segment,
            "start_char": start_char,
            "end_char": end_char,
            "word_count": len(segment.split())
        })
        
    return refined_sentences


def chunk_text(text: str, max_chunk_words: int = 500, overlap_words: int = 50) -> List[Dict[str, Any]]:
    """Chunk long text into ordered semantic chunks with overlap.
    
    Ensures long inputs are never silently truncated.
    """
    sentences = segment_sentences(text)
    if not sentences:
        return []
        
    chunks = []
    current_chunk_sentences = []
    current_word_count = 0
    chunk_index = 0
    
    for sent in sentences:
        sent_words = sent["word_count"]
        if current_word_count + sent_words > max_chunk_words and current_chunk_sentences:
            chunk_text_str = " ".join([s["text"] for s in current_chunk_sentences])
            chunks.append({
                "chunk_index": chunk_index,
                "text": chunk_text_str,
                "sentences": [s["index"] for s in current_chunk_sentences],
                "start_char": current_chunk_sentences[0]["start_char"],
                "end_char": current_chunk_sentences[-1]["end_char"],
                "word_count": current_word_count
            })
            chunk_index += 1
            
            # Create overlap
            overlap_accum = 0
            overlap_sentences = []
            for s in reversed(current_chunk_sentences):
                if overlap_accum + s["word_count"] <= overlap_words:
                    overlap_sentences.insert(0, s)
                    overlap_accum += s["word_count"]
                else:
                    break
            current_chunk_sentences = list(overlap_sentences)
            current_word_count = sum(s["word_count"] for s in current_chunk_sentences)
            
        current_chunk_sentences.append(sent)
        current_word_count += sent_words
        
    if current_chunk_sentences:
        chunk_text_str = " ".join([s["text"] for s in current_chunk_sentences])
        chunks.append({
            "chunk_index": chunk_index,
            "text": chunk_text_str,
            "sentences": [s["index"] for s in current_chunk_sentences],
            "start_char": current_chunk_sentences[0]["start_char"],
            "end_char": current_chunk_sentences[-1]["end_char"],
            "word_count": current_word_count
        })
        
    return chunks

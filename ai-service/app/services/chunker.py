"""Text chunking service with page/section metadata preservation and robust overlap."""
import re
from typing import Optional


def chunk_text(text: str, pages: list[dict] = None, chunk_size: int = 1000,
               chunk_overlap: int = 200) -> list[dict]:
    """Split text into overlapping chunks with structure and location metadata.
    
    Args:
        text: Full document text
        pages: List of {page_number, text} dicts for page tracking
        chunk_size: Maximum characters per chunk
        chunk_overlap: Number of overlapping characters between chunks
    
    Returns:
        List of chunk dicts with: chunk_index, text, page_number, section, metadata
    """
    if not text or not text.strip():
        return []

    # Clean text
    text = _clean_text(text)

    # Build page mapping for source tracking
    page_map = _build_page_map(pages) if pages else {}

    # Split into chunks using recursive strategy with strict overlap preservation
    raw_chunks_info = _recursive_split_with_offsets(text, chunk_size, chunk_overlap)

    # Enrich chunks with metadata
    chunks = []

    for i, (chunk_text_content, start_offset, end_offset) in enumerate(raw_chunks_info):
        # Find which page this chunk belongs to
        page_number = _find_page_number(chunk_text_content, pages)

        # Detect section header
        section = _detect_section(chunk_text_content)

        chunks.append({
            "chunk_index": i,
            "text": chunk_text_content,
            "page_number": page_number,
            "section": section,
            "metadata": {
                "char_start": start_offset,
                "char_end": end_offset,
                "word_count": len(chunk_text_content.split()),
                "approx_token_count": max(1, len(chunk_text_content.split()) * 4 // 3),
            },
        })

    return chunks


def _clean_text(text: str) -> str:
    """Clean and normalize text while preserving sentence structure."""
    # Normalize carriage returns
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    # Remove excessive newlines (> 2 -> 2)
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Strip leading/trailing whitespace
    return text.strip()


def _recursive_split_with_offsets(text: str, chunk_size: int, chunk_overlap: int) -> list[tuple[str, int, int]]:
    """Recursively split text into chunks preserving exact character offsets and overlap."""
    if len(text) <= chunk_size:
        return [(text.strip(), 0, len(text))] if text.strip() else []

    # Boundary separators in priority order: paragraph > sentence > phrase > word
    separators = ["\n\n", "\n", ". ", "! ", "? ", "; ", ", ", " "]

    chunks = []
    current_pos = 0
    text_len = len(text)

    while current_pos < text_len:
        end_pos = min(current_pos + chunk_size, text_len)

        if end_pos >= text_len:
            chunk_content = text[current_pos:].strip()
            if chunk_content:
                chunks.append((chunk_content, current_pos, text_len))
            break

        # Look for natural separator backwards from end_pos
        best_split = end_pos
        for sep in separators:
            last_sep = text[current_pos:end_pos].rfind(sep)
            if last_sep > int(chunk_size * 0.3):  # Avoid splitting too prematurely
                best_split = current_pos + last_sep + len(sep)
                break

        chunk_content = text[current_pos:best_split].strip()
        if chunk_content:
            chunks.append((chunk_content, current_pos, best_split))

        # Advance with overlap guarantee
        next_pos = best_split - chunk_overlap
        if next_pos <= current_pos:
            # Ensure forward progress
            next_pos = current_pos + max(1, chunk_size - chunk_overlap)
        
        current_pos = next_pos

    return chunks


def _build_page_map(pages: list[dict]) -> dict:
    """Build a mapping from text content to page numbers."""
    page_map = {}
    for page in pages:
        key = page["text"][:100] if len(page["text"]) > 100 else page["text"]
        page_map[key] = page.get("page_number", 1)
    return page_map


def _find_page_number(chunk_text: str, pages: list[dict] = None) -> Optional[int]:
    """Find which page a chunk belongs to based on word overlap."""
    if not pages:
        return 1

    best_match = 1
    best_overlap = -1

    chunk_words = set(chunk_text.lower().split())

    for page in pages:
        page_words = set(page["text"].lower().split())
        overlap = len(chunk_words & page_words)
        if overlap > best_overlap:
            best_overlap = overlap
            best_match = page.get("page_number", 1)

    return best_match


def _detect_section(text: str) -> Optional[str]:
    """Detect section header from chunk text."""
    patterns = [
        r'^(?:#{1,4})\s+(.+?)$',               # Markdown headers (# Header)
        r'^(?:\d+\.?\s+)([A-Z][^.\n]{2,60})$', # Numbered sections (1. Introduction)
        r'^([A-Z][A-Z\s]{3,60})$',             # ALL CAPS headers
        r'^(?:Abstract|Introduction|Executive Summary|Methodology|Methods|Results|Discussion|Conclusion|References|Background|Overview|Architecture|Implementation|Evaluation)\b.*$',
    ]

    lines = text.split('\n')
    for line in lines[:4]:
        line = line.strip()
        if not line:
            continue
        for pattern in patterns:
            match = re.match(pattern, line, re.IGNORECASE)
            if match:
                clean_section = line.lstrip('#').strip()
                return clean_section[:80]

    return None

"""Semantic Knowledge Map Service — builds hierarchical concept trees with evidence links."""
import json
import re
from typing import Optional
from app.providers.factory import get_llm_provider


async def generate_knowledge_map(document_id: str, text: str, chunks: list[dict] = None) -> dict:
    """Extract hierarchical concept tree and entity relationships linked to document evidence.
    
    Returns:
        dict with:
            root: main topic
            nodes: list of concept nodes with id, label, category, description, page, section, children
    """
    provider = get_llm_provider()

    if provider.is_mock() or len(text.strip()) < 100:
        return _deterministic_knowledge_map(text, chunks)

    prompt = f"""You are a Knowledge Graph Architect. 
Analyze the following document and construct a hierarchical semantic concept map with evidence links.

Document Content:
{text[:8000]}

Generate a structured JSON tree representing the core hierarchy of concepts, methodologies, components, and evidence.
Format:
{{
  "title": "Main Document Topic",
  "root": {{
    "id": "root",
    "name": "Central Theme",
    "category": "core",
    "children": [
      {{
        "id": "c1",
        "name": "Sub-theme 1",
        "category": "concept",
        "section": "Section Name",
        "page": 1,
        "description": "Brief description",
        "children": [
          {{
            "id": "c1_1",
            "name": "Specific Component / Finding",
            "category": "evidence",
            "section": "...",
            "page": 1,
            "description": "..."
          }}
        ]
      }}
    ]
  }}
}}
"""
    system_prompt = "You are a knowledge graph generator. Return valid JSON only."
    response = await provider.generate(prompt, system_prompt=system_prompt)

    try:
        cleaned = response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        parsed = json.loads(cleaned.strip())
        if "root" in parsed:
            return parsed
    except Exception:
        pass

    return _deterministic_knowledge_map(text, chunks)


def _deterministic_knowledge_map(text: str, chunks: list[dict] = None) -> dict:
    """Build a deterministic concept graph from headers, key phrases, and chunks."""
    from app.services.intelligence import calculate_intelligence
    intel = calculate_intelligence(text, chunks or [])
    keywords = intel.get("keywords", [])[:8]
    concepts = intel.get("key_concepts", [])[:6]

    # Extract detected sections
    sections = []
    if chunks:
        for c in chunks:
            sec = c.get("section")
            if sec and sec not in [s["name"] for s in sections]:
                sections.append({
                    "name": sec,
                    "page": c.get("page_number", 1),
                    "chunk_id": c.get("chunk_index", 0),
                })

    root_title = concepts[0].title() if concepts else "Document Knowledge Map"

    children = []
    for i, sec in enumerate(sections[:5]):
        sec_children = []
        # Assign related concepts
        if i < len(concepts):
            sec_children.append({
                "id": f"concept_{i}",
                "name": concepts[i].title(),
                "category": "concept",
                "page": sec.get("page", 1),
                "section": sec["name"],
                "description": f"Key concept identified within {sec['name']}.",
            })
        
        children.append({
            "id": f"sec_{i}",
            "name": sec["name"],
            "category": "section",
            "page": sec.get("page", 1),
            "section": sec["name"],
            "description": f"Structural section of the document located on Page {sec.get('page', 1)}.",
            "children": sec_children,
        })

    # Fallback if no sections were extracted
    if not children:
        for j, kw in enumerate(keywords[:4]):
            children.append({
                "id": f"kw_{j}",
                "name": kw.capitalize(),
                "category": "keyword",
                "page": 1,
                "section": "General",
                "description": f"Key domain entity frequently referenced in document.",
                "children": [],
            })

    return {
        "title": root_title,
        "root": {
            "id": "root",
            "name": root_title,
            "category": "core",
            "children": children,
        }
    }

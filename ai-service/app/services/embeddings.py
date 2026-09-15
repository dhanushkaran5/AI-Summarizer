"""Embeddings and vector representation service for Summarize AI.

Provides TF-IDF vectorization, cosine similarity computation,
document centroid calculation, and semantic distance matrices.
"""
import math
from typing import List, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class TextVectorizer:
    """TF-IDF and n-gram vectorizer with similarity computation."""
    
    def __init__(self, max_features: int = 5000, ngram_range: Tuple[int, int] = (1, 2)):
        self.vectorizer = TfidfVectorizer(
            max_features=max_features,
            ngram_range=ngram_range,
            stop_words="english",
            strip_accents="unicode"
        )
        self.is_fitted = False
        
    def fit_transform(self, texts: List[str]):
        """Fit on a corpus and transform texts into sparse TF-IDF matrix."""
        if not texts or all(not t.strip() for t in texts):
            return np.zeros((len(texts), 1))
        try:
            matrix = self.vectorizer.fit_transform(texts)
            self.is_fitted = True
            return matrix
        except ValueError:
            # Fallback if vocabulary is empty (e.g. all stopwords)
            self.vectorizer = TfidfVectorizer(stop_words=None)
            matrix = self.vectorizer.fit_transform(texts)
            self.is_fitted = True
            return matrix

    def transform(self, texts: List[str]):
        """Transform texts using fitted vocabulary."""
        if not self.is_fitted:
            return self.fit_transform(texts)
        try:
            return self.vectorizer.transform(texts)
        except Exception:
            return self.fit_transform(texts)


def compute_cosine_similarity(vec_a, vec_b) -> float:
    """Compute cosine similarity between two vectors or matrices."""
    sim = cosine_similarity(vec_a, vec_b)
    if hasattr(sim, "item"):
        return float(sim.item())
    return float(sim[0][0])


def compute_similarity_matrix(vectors) -> np.ndarray:
    """Compute pairwise cosine similarity matrix."""
    return cosine_similarity(vectors, vectors)


def compute_centroid(vectors) -> np.ndarray:
    """Compute mean centroid vector of a set of vectors."""
    if hasattr(vectors, "toarray"):
        arr = vectors.toarray()
    else:
        arr = np.asarray(vectors)
    return np.mean(arr, axis=0, keepdims=True)

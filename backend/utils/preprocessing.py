"""
Text preprocessing utilities for fake news detection.
Handles: lowercase, punctuation removal, stopwords, lemmatization.
"""

import re
import nltk
import spacy
from nltk.corpus import stopwords
from typing import List

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    # Fallback keeps the app runnable even if the small model is unavailable.
    nlp = spacy.blank("en")

try:
    STOP_WORDS = set(stopwords.words('english'))
except LookupError:
    # Avoid network downloads during import; fall back to a minimal built-in list.
    STOP_WORDS = {
        "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
        "in", "is", "it", "of", "on", "or", "that", "the", "this", "to",
        "was", "were", "will", "with"
    }


def clean_text(text: str) -> str:
    """
    Clean and preprocess text:
    1. Convert to lowercase
    2. Remove URLs
    3. Remove punctuation and special characters
    4. Remove extra whitespace
    5. Lemmatize using spaCy
    6. Remove stopwords

    Args:
        text: Raw input text

    Returns:
        Cleaned text string
    """
    if not isinstance(text, str):
        return ""

    # Lowercase
    text = text.lower()

    # Remove URLs
    text = re.sub(r'https?://\S+|www\.\S+', '', text)

    # Remove punctuation and non-alphabetic characters (keep spaces)
    text = re.sub(r'[^a-z\s]', ' ', text)

    # Remove extra whitespace
    text = ' '.join(text.split())

    # Lemmatize and remove stopwords using spaCy
    doc = nlp(text)
    tokens = []
    for token in doc:
        if token.is_space:
            continue
        lemma = token.lemma_.strip() if token.lemma_ else ""
        normalized = lemma or token.text
        if normalized and normalized not in STOP_WORDS:
            tokens.append(normalized)

    return ' '.join(tokens)


def preprocess_for_training(texts: List[str]) -> List[str]:
    """
    Apply cleaning to a list of texts.

    Args:
        texts: List of raw text strings

    Returns:
        List of cleaned text strings
    """
    return [clean_text(text) for text in texts]


if __name__ == "__main__":
    # Test the preprocessing
    sample = "URGENT: Scientists discover lemon water cures cancer! Share now!!! https://example.com"
    print("Original:", sample)
    print("Cleaned:", clean_text(sample))

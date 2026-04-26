"""
Pattern matching service.
Compares input text against a database of known fake messages.
Uses Jaccard similarity for simplicity.
"""

import json
import os
from typing import List, Dict
from backend.utils.logger import get_logger
from backend.utils.preprocessing import clean_text

logger = get_logger(__name__)


class PatternMatcher:
    """Match input against known fake message patterns."""

    def __init__(self, known_fakes_path: str = None, threshold: float = None):
        """
        Initialize pattern matcher.

        Args:
            known_fakes_path: Path to JSON file with known fake messages
            threshold: Similarity threshold (0-1) to flag as match
        """
        self.known_fakes_path = known_fakes_path or os.path.join(
            os.path.dirname(__file__), '..', '..', 'data', 'known_fakes.json'
        )
        self.threshold = threshold or float(os.getenv('PATTERN_SIMILARITY_THRESHOLD', '0.7'))
        self.known_fakes = []  # List of {id, text, tokens, category}
        self.load_known_fakes()

    def load_known_fakes(self):
        """Load known fake messages from JSON and precompute token sets."""
        try:
            with open(self.known_fakes_path, 'r') as f:
                data = json.load(f)

            # Preprocess: clean text and compute token sets
            self.known_fakes = []
            for item in data:
                text = item.get('text', '')
                cleaned = clean_text(text)
                tokens = set(cleaned.split()) if cleaned else set()
                self.known_fakes.append({
                    'id': item.get('id'),
                    'original_text': text,
                    'tokens': tokens,
                    'category': item.get('category', 'unknown')
                })

            logger.info(f"✅ Loaded {len(self.known_fakes)} known fake messages")
        except Exception as e:
            logger.error(f"❌ Failed to load known fakes: {e}")
            self.known_fakes = []

    def jaccard_similarity(self, tokens1: set, tokens2: set) -> float:
        """
        Compute Jaccard similarity between two token sets.

        Jaccard = |intersection| / |union|
        """
        if not tokens1 or not tokens2:
            return 0.0
        intersection = tokens1.intersection(tokens2)
        union = tokens1.union(tokens2)
        return len(intersection) / len(union) if union else 0.0

    def find_best_match(self, text: str) -> Dict:
        """
        Find the best matching known fake message.

        Args:
            text: Input text to check

        Returns:
            Dictionary with 'match_id', 'match_text', 'similarity', 'category', 'matched'
        """
        # Preprocess input
        cleaned = clean_text(text)
        input_tokens = set(cleaned.split()) if cleaned else set()

        if not input_tokens:
            return {
                'match_id': None,
                'match_text': None,
                'similarity': 0.0,
                'category': None,
                'matched': False
            }

        # Compare with all known fakes
        best_match = None
        best_similarity = 0.0

        for known in self.known_fakes:
            similarity = self.jaccard_similarity(input_tokens, known['tokens'])
            if similarity > best_similarity:
                best_similarity = similarity
                best_match = known

        # Check if above threshold
        matched = best_similarity >= self.threshold

        logger.debug(f"Pattern matching: best_similarity={best_similarity:.3f}, matched={matched}")

        return {
            'match_id': best_match['id'] if best_match else None,
            'match_text': best_match['original_text'] if best_match else None,
            'similarity': best_similarity,
            'category': best_match['category'] if best_match else None,
            'matched': matched
        }

    def get_match_score(self, text: str) -> float:
        """
        Get pattern match score (0-1).
        Returns similarity of best match if above threshold, else 0.
        """
        result = self.find_best_match(text)
        return result['similarity'] if result['matched'] else 0.0


# Global instance
pattern_matcher = None


def get_pattern_matcher() -> PatternMatcher:
    """Get or create the global pattern matcher instance."""
    global pattern_matcher
    if pattern_matcher is None:
        pattern_matcher = PatternMatcher()
    return pattern_matcher

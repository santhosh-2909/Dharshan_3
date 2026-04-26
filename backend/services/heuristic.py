"""
Heuristic rule engine for fake news detection.
Checks for suspicious patterns, keywords, formatting issues.
"""

import json
import os
import re
from typing import Dict, Tuple, List
from backend.utils.logger import get_logger

logger = get_logger(__name__)


class HeuristicEngine:
    """Rule-based heuristic detector."""

    def __init__(self, config_path: str = None):
        """
        Initialize heuristic engine.

        Args:
            config_path: Path to heuristics.json config file
        """
        self.config_path = config_path or os.path.join(
            os.path.dirname(__file__), '..', '..', 'data', 'heuristics.json'
        )
        self.keywords = []
        self.emotional_words = []
        self.min_caps_length = 5
        self.max_punctuation = 2
        self.banned_domains = []
        self.load_config()

    def load_config(self):
        """Load heuristic configuration from JSON file."""
        try:
            with open(self.config_path, 'r') as f:
                config = json.load(f)

            self.keywords = config.get('keywords', [])
            self.emotional_words = config.get('emotional_words', [])
            self.min_caps_length = config.get('min_caps_length', 5)
            self.max_punctuation = config.get('max_punctuation', 2)
            self.banned_domains = config.get('banned_domains', [])

            logger.info(f"✅ Loaded heuristics: {len(self.keywords)} keywords, {len(self.emotional_words)} emotional words")
        except Exception as e:
            logger.error(f"❌ Failed to load heuristic config: {e}")
            # Use defaults
            self.keywords = ['urgent', 'forward', 'viral', 'breaking', 'exclusive']
            self.emotional_words = ['shocking', 'incredible', 'amazing']
            self.min_caps_length = 5
            self.max_punctuation = 2

    def check_keywords(self, text: str) -> Tuple[bool, List[str]]:
        """
        Check if text contains any suspicious keywords.

        Returns:
            (triggered, list_of_matched_keywords)
        """
        text_lower = text.lower()
        matched = []
        for kw in self.keywords:
            if kw.lower() in text_lower:
                matched.append(kw)
        return len(matched) > 0, matched

    def check_all_caps(self, text: str) -> bool:
        """
        Check for all-caps sentences that suggest urgency/excitement.
        A sentence with consecutive uppercase letters >= min_caps_length.
        """
        # Split into sentences (simple)
        sentences = re.split(r'[.!?]+', text)
        for sentence in sentences:
            # Find sequences of uppercase letters
            caps_sequences = re.findall(r'[A-Z]{5,}', sentence)
            if caps_sequences:
                return True
        return False

    def check_excessive_punctuation(self, text: str) -> bool:
        """Check for repeated punctuation marks (e.g., !!! or ???)."""
        # Count consecutive exclamation or question marks
        if re.search(r'!{3,}', text) or re.search(r'\?{3,}', text):
            return True
        return False

    def check_emotional_words(self, text: str) -> Tuple[bool, List[str]]:
        """
        Check for emotional language.

        Returns:
            (triggered, matched_words)
        """
        text_lower = text.lower()
        matched = []
        for ew in self.emotional_words:
            if ew.lower() in text_lower:
                matched.append(ew)
        return len(matched) > 0, matched

    def check_source_absence(self, text: str) -> bool:
        """
        Check if message lacks any verifiable source.
        No URL or domain reference.
        """
        url_pattern = r'https?://[^\s]+|www\.[^\s]+|[a-z0-9.-]+\.[a-z]{2,}'
        has_url = bool(re.search(url_pattern, text, re.IGNORECASE))
        return not has_url

    def check_banned_domains(self, text: str) -> bool:
        """Check if text contains links to known suspicious domains."""
        for domain in self.banned_domains:
            if domain.lower() in text.lower():
                return True
        return False

    def evaluate(self, text: str) -> Dict:
        """
        Apply all heuristic checks to the text.

        Returns:
            Dictionary with:
            - triggered: bool (any check passed)
            - score: heuristic score (0 or 1 for MVP)
            - reasons: list of specific reasons why it triggered
        """
        reasons = []

        # Keyword check
        kw_triggered, kw_matched = self.check_keywords(text)
        if kw_triggered:
            reasons.append(f"Suspicious keywords: {', '.join(kw_matched)}")

        caps_triggered = self.check_all_caps(text)
        punctuation_triggered = self.check_excessive_punctuation(text)

        # All-caps
        if caps_triggered:
            reasons.append("Contains all-caps text (urgency/excitement)")

        # Excessive punctuation
        if punctuation_triggered:
            reasons.append("Excessive punctuation marks")

        # Emotional words
        emo_triggered, emo_matched = self.check_emotional_words(text)
        if emo_triggered:
            reasons.append(f"Emotional language: {', '.join(emo_matched)}")

        # Source absence alone is too noisy for ordinary messages.
        # Only count it when the message already has claim-like or manipulative signals.
        suspicious_context = kw_triggered or emo_triggered or caps_triggered or punctuation_triggered
        if suspicious_context and self.check_source_absence(text):
            reasons.append("No verifiable source (no URL or citation)")

        # Banned domains
        if self.check_banned_domains(text):
            reasons.append("Contains link to known suspicious domain")

        triggered = len(reasons) > 0

        logger.debug(f"Heuristic evaluation: triggered={triggered}, reasons={reasons}")

        return {
            'triggered': triggered,
            'score': 1.0 if triggered else 0.0,
            'reasons': reasons
        }


# Global instance
heuristic_engine = None


def get_heuristic_engine() -> HeuristicEngine:
    """Get or create the global heuristic engine instance."""
    global heuristic_engine
    if heuristic_engine is None:
        heuristic_engine = HeuristicEngine()
    return heuristic_engine

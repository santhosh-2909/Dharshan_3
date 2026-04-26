"""
Explanation generator.
Creates user-friendly explanations for prediction results.
"""

from typing import List, Dict
from backend.utils.logger import get_logger

logger = get_logger(__name__)


class ExplanationGenerator:
    """Generate clear explanations for misinformation verification results."""

    def __init__(self):
        """Initialize explanation templates."""
        self.templates = {
            'ml_fake': "VeritasGuard flagged this claim as likely false (model confidence: {confidence:.0%}).",
            'ml_real': "VeritasGuard found this claim more likely to be reliable (model confidence: {confidence:.0%}).",
            'heuristic': "Fast screening found patterns often seen in misleading forwards: {reasons}.",
            'no_source': "No trustworthy source, citation, or reporting trail was found in the message.",
            'pattern_match': "Retrieved claim context suggests a close match to known misinformation: '{match_text}'.",
            'pattern_match_no_text': "Retrieved claim context suggests this is similar to previously debunked misinformation.",
            'all_clear': "No strong misinformation signals were detected, but it is still best to verify with trusted reporting."
        }

    def generate_explanation(
        self,
        ml_label: str,
        ml_confidence: float,
        heuristic_triggered: bool,
        heuristic_reasons: List[str],
        pattern_matched: bool,
        pattern_similarity: float,
        pattern_match_text: str = None
    ) -> List[str]:
        """
        Generate a list of explanation strings.

        Args:
            ml_label: 'FAKE' or 'REAL'
            ml_confidence: Model confidence (0-1)
            heuristic_triggered: Whether heuristic rules triggered
            heuristic_reasons: List of heuristic trigger reasons
            pattern_matched: Whether pattern match found
            pattern_similarity: Similarity score (0-1)
            pattern_match_text: Text of the matched known fake

        Returns:
            List of explanation strings
        """
        explanations = []

        # 1. ML prediction
        if ml_label == 'FAKE':
            explanations.append(self.templates['ml_fake'].format(confidence=ml_confidence))
        else:
            explanations.append(self.templates['ml_real'].format(confidence=ml_confidence))

        # 2. Heuristic reasons (if any)
        if heuristic_triggered and heuristic_reasons:
            reasons_str = '; '.join(heuristic_reasons)
            explanations.append(self.templates['heuristic'].format(reasons=reasons_str))

        # 3. Source check (if no source and model also thinks fake)
        if ml_label == 'FAKE':
            explanations.append(self.templates['no_source'])

        # 4. Pattern match
        if pattern_matched:
            if pattern_match_text:
                short_text = pattern_match_text[:100] + ('...' if len(pattern_match_text) > 100 else '')
                explanations.append(self.templates['pattern_match'].format(match_text=short_text))
            else:
                explanations.append(self.templates['pattern_match_no_text'])

        # 5. If it's likely real, add positive message
        if ml_label == 'REAL' and not heuristic_triggered and not pattern_matched:
            explanations.append(self.templates['all_clear'])

        logger.debug(f"📝 Generated explanation: {explanations}")
        return explanations

    def generate_simple_explanation(self, risk_level: str, reasons: List[str]) -> str:
        """
        Generate a single sentence summary.

        Args:
            risk_level: LOW, MEDIUM, or HIGH
            reasons: List of contributing factors

        Returns:
            Concise explanation string
        """
        if risk_level == 'HIGH':
            prefix = "⚠️ High risk: This claim shows strong signs of misinformation."
        elif risk_level == 'MEDIUM':
            prefix = "⚠️ Medium risk: This claim needs additional verification."
        else:
            prefix = "✅ Low risk: No major red flags detected, but continue to verify important claims."

        if reasons:
            reason_summary = '; '.join(reasons[:2])  # Top 2 reasons
            return f"{prefix} Reasons: {reason_summary}."
        else:
            return f"{prefix} {self.templates['all_clear']}"


# Global instance
explanation_gen = None


def get_explanation_generator() -> ExplanationGenerator:
    """Get or create the global explanation generator instance."""
    global explanation_gen
    if explanation_gen is None:
        explanation_gen = ExplanationGenerator()
    return explanation_gen

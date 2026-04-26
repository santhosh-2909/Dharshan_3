"""
Risk scoring service.
Aggregates ML probability, heuristic flag, and pattern match into final risk score.
"""

import os
from typing import Dict
from backend.utils.logger import get_logger

logger = get_logger(__name__)


class RiskScorer:
    """Compute final risk score from multiple signals."""

    def __init__(self):
        """Initialize with default weights from environment."""
        self.weight_ml = float(os.getenv('RISK_WEIGHT_ML', '0.6'))
        self.weight_heuristic = float(os.getenv('RISK_WEIGHT_HEURISTIC', '0.25'))
        self.weight_pattern = float(os.getenv('RISK_WEIGHT_PATTERN', '0.15'))

        # Normalize weights to sum to 1.0
        total = self.weight_ml + self.weight_heuristic + self.weight_pattern
        if total > 0:
            self.weight_ml /= total
            self.weight_heuristic /= total
            self.weight_pattern /= total

        logger.info(f"✅ RiskScorer initialized with weights: ML={self.weight_ml:.2f}, "
                    f"Heuristic={self.weight_heuristic:.2f}, Pattern={self.weight_pattern:.2f}")

    def compute_risk(self, ml_probability: float, heuristic_triggered: bool, pattern_score: float) -> Dict:
        """
        Compute final risk score and level.

        Args:
            ml_probability: ML model's estimated probability of being fake (0-1)
            heuristic_triggered: Whether heuristic rules triggered (0 or 1)
            pattern_score: Pattern matching similarity score (0-1)

        Returns:
            Dictionary with 'score' (0-1) and 'level' ('LOW', 'MEDIUM', 'HIGH')
        """
        # Convert heuristic boolean to score
        heuristic_score = 1.0 if heuristic_triggered else 0.0

        # Weighted sum
        risk_score = (
            self.weight_ml * ml_probability +
            self.weight_heuristic * heuristic_score +
            self.weight_pattern * pattern_score
        )

        # Clamp to [0, 1]
        risk_score = max(0.0, min(1.0, risk_score))

        # Determine risk level
        if risk_score < 0.4:
            risk_level = 'LOW'
        elif risk_score < 0.7:
            risk_level = 'MEDIUM'
        else:
            risk_level = 'HIGH'

        logger.info(f"📊 Risk computed: score={risk_score:.3f}, level={risk_level}")

        return {
            'score': round(risk_score, 4),
            'level': risk_level
        }

    def get_weights(self) -> Dict[str, float]:
        """Return current weight configuration."""
        return {
            'ml': round(self.weight_ml, 2),
            'heuristic': round(self.weight_heuristic, 2),
            'pattern': round(self.weight_pattern, 2)
        }


# Global instance
risk_scorer = None


def get_risk_scorer() -> RiskScorer:
    """Get or create the global risk scorer instance."""
    global risk_scorer
    if risk_scorer is None:
        risk_scorer = RiskScorer()
    return risk_scorer

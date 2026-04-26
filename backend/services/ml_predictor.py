"""
Machine Learning predictor service.
Wraps the Logistic Regression model with TF-IDF.
"""

import os
from typing import Dict
from backend.utils.logger import get_logger

logger = get_logger(__name__)

model_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'model'))

try:
    from model.predict import load_model, predict as model_predict
    MODEL_AVAILABLE = True
except ImportError as e:
    logger.warning(f"⚠️  Could not import model: {e}")
    MODEL_AVAILABLE = False


class MLPredictor:
    """Service for making ML predictions."""

    def __init__(self):
        self.model_loaded = False
        self.load_error = None

    def initialize(self):
        """Load the ML model at startup."""
        global MODEL_AVAILABLE
        if not MODEL_AVAILABLE:
            logger.error("❌ Model module not available")
            self.load_error = "Model dependencies not installed or model not trained"
            return False

        try:
            load_model()
            self.model_loaded = True
            logger.info("✅ ML Model loaded successfully")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to load ML model: {e}")
            self.load_error = str(e)
            return False

    def predict(self, text: str) -> Dict:
        """
        Make ML prediction on input text.

        Args:
            text: Input message

        Returns:
            Dictionary with 'probability', 'label', 'confidence'
        """
        if not self.model_loaded:
            logger.warning("⚠️  Model not loaded, returning fallback prediction")
            return {
                'probability': 0.5,
                'label': 'REAL',
                'confidence': 0.5,
                'error': 'Model not available'
            }

        try:
            result = model_predict(text)
            logger.debug(f"🔮 ML prediction: probability={result['probability']:.3f}, label={result['label']}")
            return result
        except Exception as e:
            logger.error(f"❌ ML prediction error: {e}")
            return {
                'probability': 0.5,
                'label': 'REAL',
                'confidence': 0.5,
                'error': str(e)
            }


# Global instance
ml_predictor = MLPredictor()


def get_ml_predictor() -> MLPredictor:
    """Get the global ML predictor instance."""
    return ml_predictor

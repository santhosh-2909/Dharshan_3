"""
Pydantic models for API request/response schemas.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class AnalyzeRequest(BaseModel):
    """Request model for /analyze endpoint."""
    text: str = Field(..., min_length=1, max_length=5000, description="Claim or forwarded message text to verify")

    class Config:
        json_schema_extra = {
            "example": {
                "text": "Breaking: A new government order says every bank account will be frozen tomorrow. Forward immediately."
            }
        }


class FeedbackRequest(BaseModel):
    """Request model for /feedback endpoint."""
    text: str = Field(..., description="Original claim or forwarded message text")
    predicted: str = Field(..., description="System prediction: FAKE or REAL")
    correct: str = Field(..., description="User-confirmed label: FAKE or REAL")

    class Config:
        json_schema_extra = {
            "example": {
                "text": "URGENT: Forward this to 10 people!",
                "predicted": "FAKE",
                "correct": "FAKE"
            }
        }


class GoogleLoginRequest(BaseModel):
    """Request model for Google sign-in."""
    id_token: str = Field(..., min_length=20, description="Google ID token from the client")


class HealthResponse(BaseModel):
    """Response model for /health endpoint."""
    status: str = "ok"
    timestamp: Optional[str] = None


class PredictionDetail(BaseModel):
    """Detailed prediction breakdown."""
    ml_probability: float = Field(..., ge=0.0, le=1.0)
    heuristic_triggered: bool
    pattern_match_score: float = Field(..., ge=0.0, le=1.0)
    verdict_source: str = Field(..., description="Primary engine behind the verdict")
    retrieval_tier: str = Field(..., description="How close the claim appears to known misinformation")


class AnalyzeResponse(BaseModel):
    """Response model for /analyze endpoint."""
    risk: float = Field(..., ge=0.0, le=1.0, description="Final misinformation risk score (0-1)")
    label: str = Field(..., description="Risk band: LOW, MEDIUM, or HIGH")
    explanation: List[str] = Field(..., description="Plain-language truth-sandwich style reasons")
    details: PredictionDetail = Field(..., description="Breakdown of contributing signals")
    message_id: Optional[str] = Field(None, description="Database ID of stored message")
    session_id: Optional[str] = Field(None, description="Browser analysis session identifier")

    class Config:
        json_schema_extra = {
            "example": {
                "risk": 0.85,
                "label": "HIGH",
                "explanation": [
                    "VeritasGuard flagged this claim as likely false (model confidence: 87%).",
                    "Fast screening found urgency-heavy language that often appears in forwarded misinformation.",
                    "No trustworthy source or citation was found in the message."
                ],
                "details": {
                    "ml_probability": 0.87,
                    "heuristic_triggered": True,
                    "pattern_match_score": 0.0,
                    "verdict_source": "ml+heuristics",
                    "retrieval_tier": "no_direct_match"
                },
                "message_id": "64a1b2c3d4e5f67890123456",
                "session_id": "sess_demo_12345"
            }
        }


class FeedbackResponse(BaseModel):
    """Response model for /feedback endpoint."""
    success: bool
    message: str
    feedback_id: Optional[str] = None
    session_id: Optional[str] = None


class AuthConfigResponse(BaseModel):
    """Frontend auth configuration."""
    google_enabled: bool
    google_client_id: Optional[str] = None


class UserProfile(BaseModel):
    """Authenticated user profile."""
    user_id: str
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None
    provider: str = "google"
    verified_email: bool = False


class AuthUserResponse(BaseModel):
    """Response model for auth session endpoints."""
    authenticated: bool
    user: Optional[UserProfile] = None
    session_id: Optional[str] = None
    message: Optional[str] = None


class ErrorResponse(BaseModel):
    """Error response model."""
    error: str
    detail: Optional[str] = None

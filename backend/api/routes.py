"""
API Routes definitions.
Handles claim analysis, feedback, and health endpoints.
"""

import base64
import hashlib
import hmac
import json
import os
import time
from datetime import datetime
from typing import Optional
from uuid import uuid4
from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import ValidationError

from .models import (
    AnalyzeRequest, FeedbackRequest, HealthResponse,
    AnalyzeResponse, FeedbackResponse, ErrorResponse,
    GoogleLoginRequest, AuthConfigResponse, AuthUserResponse, UserProfile
)
from backend.services import database, ml_predictor, heuristic, pattern_matcher, risk_scorer, explanation
from backend.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()
SESSION_COOKIE_NAME = "veritasguard_session"
AUTH_COOKIE_NAME = "veritasguard_user_session"
AUTH_PROFILE_COOKIE_NAME = "veritasguard_user_profile"


def ensure_session(response: Response, request: Request) -> str:
    """Reuse or create a browser session id for analysis flows."""
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    if session_id:
        return session_id

    session_id = f"sess_{uuid4().hex[:16]}"
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_id,
        max_age=60 * 60 * 24 * 30,
        httponly=False,
        samesite="lax"
    )
    return session_id


def ensure_auth_session(response: Response, request: Request) -> str:
    """Reuse or create an auth session id."""
    session_id = request.cookies.get(AUTH_COOKIE_NAME)
    if session_id:
        return session_id

    session_id = f"auth_{uuid4().hex[:16]}"
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=session_id,
        max_age=60 * 60 * 24 * 30,
        httponly=True,
        samesite="lax"
    )
    return session_id


def get_auth_secret() -> str:
    """Secret used to sign lightweight auth profile cookies."""
    return os.getenv('AUTH_SESSION_SECRET', 'veritasguard-dev-auth-secret')


def encode_auth_profile(profile: dict) -> str:
    """Encode and sign a small auth profile for cookie storage."""
    payload = json.dumps(profile, separators=(',', ':'), sort_keys=True).encode('utf-8')
    payload_b64 = base64.urlsafe_b64encode(payload).decode('utf-8')
    signature = hmac.new(
        get_auth_secret().encode('utf-8'),
        payload_b64.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return f"{payload_b64}.{signature}"


def decode_auth_profile(cookie_value: str) -> Optional[dict]:
    """Validate and decode a signed auth profile cookie."""
    if not cookie_value or '.' not in cookie_value:
        return None

    payload_b64, signature = cookie_value.rsplit('.', 1)
    expected = hmac.new(
        get_auth_secret().encode('utf-8'),
        payload_b64.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(signature, expected):
        return None

    try:
        payload = base64.urlsafe_b64decode(payload_b64.encode('utf-8'))
        return json.loads(payload.decode('utf-8'))
    except Exception:
        return None


def set_auth_profile_cookie(response: Response, profile: dict) -> None:
    """Persist a small signed auth profile cookie for stateless auth fallback."""
    response.set_cookie(
        key=AUTH_PROFILE_COOKIE_NAME,
        value=encode_auth_profile(profile),
        max_age=60 * 60 * 24 * 30,
        httponly=True,
        samesite="lax"
    )


def serialize_user(user: dict) -> UserProfile:
    """Convert a DB user document into response model."""
    return UserProfile(
        user_id=str(user.get('_id') or user.get('provider_user_id') or ''),
        email=user.get('email', ''),
        name=user.get('name'),
        picture=user.get('picture'),
        provider=user.get('provider', 'google'),
        verified_email=bool(user.get('verified_email', False))
    )


def require_authenticated_user(request: Request) -> dict:
    """Mock authentication for development - returns a guest user."""
    auth_session_id = request.cookies.get(AUTH_COOKIE_NAME)
    if auth_session_id:
        user = database.get_database().get_user_by_session(auth_session_id)
        if user: return user
        
        auth_profile = decode_auth_profile(request.cookies.get(AUTH_PROFILE_COOKIE_NAME))
        if auth_profile: return auth_profile

    # Default to a mock guest user if no session is present
    return {
        'provider': 'mock',
        'provider_user_id': 'guest_123',
        'email': 'guest@example.com',
        'name': 'Guest User',
        'picture': None,
        'verified_email': True
    }


@router.get("/auth/config", response_model=AuthConfigResponse)
async def get_auth_config():
    """Return client-side auth configuration."""
    client_id = os.getenv('GOOGLE_OAUTH_CLIENT_ID')
    return AuthConfigResponse(
        google_enabled=bool(client_id),
        google_client_id=client_id
    )


@router.post("/auth/google/login", response_model=AuthUserResponse)
async def google_login(request: GoogleLoginRequest, response: Response, http_request: Request):
    """Verify a Google ID token and create a signed-in app session."""
    client_id = os.getenv('GOOGLE_OAUTH_CLIENT_ID')
    if not client_id:
        raise HTTPException(status_code=503, detail="Google sign-in is not configured")

    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token as google_id_token

        token_info = google_id_token.verify_oauth2_token(
            request.id_token,
            google_requests.Request(),
            client_id
        )

        if token_info.get('iss') not in {"accounts.google.com", "https://accounts.google.com"}:
            raise HTTPException(status_code=401, detail="Invalid Google token issuer")

        auth_session_id = ensure_auth_session(response, http_request)
        user_record = {
            'provider': 'google',
            'provider_user_id': token_info.get('sub'),
            'email': token_info.get('email'),
            'name': token_info.get('name'),
            'picture': token_info.get('picture'),
            'verified_email': token_info.get('email_verified', False),
            'session_id': auth_session_id
        }

        db = database.get_database()
        user_id = db.upsert_user_account(user_record)
        db.save_auth_session({
            'session_id': auth_session_id,
            'user_id': user_id,
            'email': token_info.get('email'),
            'provider': 'google'
        })
        set_auth_profile_cookie(response, {
            'provider': 'google',
            'provider_user_id': token_info.get('sub'),
            'email': token_info.get('email'),
            'name': token_info.get('name'),
            'picture': token_info.get('picture'),
            'verified_email': bool(token_info.get('email_verified', False))
        })

        user = UserProfile(
            user_id=user_id or token_info.get('sub', ''),
            email=token_info.get('email', ''),
            name=token_info.get('name'),
            picture=token_info.get('picture'),
            provider='google',
            verified_email=bool(token_info.get('email_verified', False))
        )

        return AuthUserResponse(
            authenticated=True,
            user=user,
            session_id=auth_session_id,
            message="Google sign-in successful"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Google login failed: {e}", exc_info=True)
        raise HTTPException(status_code=401, detail="Google sign-in failed")


@router.get("/auth/me", response_model=AuthUserResponse)
async def get_current_user(request: Request):
    """Return the currently signed-in user, if any."""
    auth_session_id = request.cookies.get(AUTH_COOKIE_NAME)
    if not auth_session_id:
        return AuthUserResponse(authenticated=False, message="Not signed in")

    user = database.get_database().get_user_by_session(auth_session_id)
    if user:
        return AuthUserResponse(
            authenticated=True,
            user=serialize_user(user),
            session_id=auth_session_id
        )

    auth_profile = decode_auth_profile(request.cookies.get(AUTH_PROFILE_COOKIE_NAME))
    if auth_profile:
        return AuthUserResponse(
            authenticated=True,
            user=UserProfile(
                user_id=str(auth_profile.get('provider_user_id', '')),
                email=auth_profile.get('email', ''),
                name=auth_profile.get('name'),
                picture=auth_profile.get('picture'),
                provider=auth_profile.get('provider', 'google'),
                verified_email=bool(auth_profile.get('verified_email', False))
            ),
            session_id=auth_session_id
        )

    return AuthUserResponse(authenticated=False, session_id=auth_session_id, message="Session not found")


@router.post("/auth/logout", response_model=AuthUserResponse)
async def logout(response: Response, request: Request):
    """Clear the current auth session."""
    auth_session_id = request.cookies.get(AUTH_COOKIE_NAME)
    if auth_session_id:
        database.get_database().deactivate_auth_session(auth_session_id)

    response.delete_cookie(AUTH_COOKIE_NAME)
    response.delete_cookie(AUTH_PROFILE_COOKIE_NAME)
    return AuthUserResponse(authenticated=False, message="Signed out")


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.
    Returns OK if the service is running.
    """
    return HealthResponse(
        status="ok",
        timestamp=datetime.utcnow().isoformat()
    )


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_message(request: AnalyzeRequest, response: Response, http_request: Request):
    """
    Analyze a claim for misinformation risk.

    Process:
    1. ML prediction
    2. Heuristic screening
    3. Pattern matching
    4. Risk aggregation
    5. Explanation generation
    6. Store outcome and feedback hooks
    """
    start_time = time.time()
    text = request.text.strip()
    session_id = ensure_session(response, http_request)

    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    logger.info(f"🔍 Verifying claim: {text[:100]}...")

    try:
        # 1. ML Prediction
        ml_result = ml_predictor.get_ml_predictor().predict(text)
        ml_prob = ml_result.get('probability', 0.5)
        ml_label = ml_result.get('label', 'REAL')
        ml_confidence = ml_result.get('confidence', 0.5)

        # 2. Heuristic Check
        heuristic_result = heuristic.get_heuristic_engine().evaluate(text)
        heuristic_triggered = heuristic_result['triggered']
        heuristic_reasons = heuristic_result['reasons']

        # 3. Pattern Matching
        pattern_result = pattern_matcher.get_pattern_matcher().find_best_match(text)
        pattern_score = pattern_result['similarity'] if pattern_result['matched'] else 0.0
        pattern_matched = pattern_result['matched']
        pattern_match_text = pattern_result.get('match_text')

        if pattern_matched and pattern_score >= 0.85:
            retrieval_tier = 'high_confidence_match'
            verdict_source = 'retrieval'
        elif pattern_matched:
            retrieval_tier = 'related_claim_match'
            verdict_source = 'retrieval+ml'
        elif heuristic_triggered:
            retrieval_tier = 'no_direct_match'
            verdict_source = 'ml+heuristics'
        else:
            retrieval_tier = 'no_direct_match'
            verdict_source = 'ml'

        # 4. Risk Aggregation
        risk_result = risk_scorer.get_risk_scorer().compute_risk(
            ml_probability=ml_prob,
            heuristic_triggered=heuristic_triggered,
            pattern_score=pattern_score
        )
        risk_score = risk_result['score']
        risk_level = risk_result['level']

        # 5. Explanation Generation
        explanation_list = explanation.get_explanation_generator().generate_explanation(
            ml_label=ml_label,
            ml_confidence=ml_confidence,
            heuristic_triggered=heuristic_triggered,
            heuristic_reasons=heuristic_reasons,
            pattern_matched=pattern_matched,
            pattern_similarity=pattern_score,
            pattern_match_text=pattern_match_text
        )

        # 6. Save to Database
        message_data = {
            'text': text,
            'session_id': session_id,
            'timestamp': datetime.utcnow(),
            'prediction': {
                'ml_probability': ml_prob,
                'ml_label': ml_label,
                'confidence': ml_confidence
            },
            'heuristic_triggered': heuristic_triggered,
            'heuristic_reasons': heuristic_reasons,
            'pattern_match': {
                'matched': pattern_matched,
                'score': pattern_score,
                'match_text': pattern_match_text
            },
            'risk_score': risk_score,
            'risk_level': risk_level,
            'explanation': explanation_list,
            'processing_time_sec': time.time() - start_time,
            'verdict_source': verdict_source,
            'retrieval_tier': retrieval_tier
        }

        message_id = database.get_database().save_message(message_data)

        # Prepare response
        response = AnalyzeResponse(
            risk=risk_score,
            label=risk_level,
            explanation=explanation_list,
            details={
                'ml_probability': round(ml_prob, 4),
                'heuristic_triggered': heuristic_triggered,
                'pattern_match_score': round(pattern_score, 4),
                'verdict_source': verdict_source,
                'retrieval_tier': retrieval_tier
            },
            message_id=message_id,
            session_id=session_id
        )

        elapsed = time.time() - start_time
        logger.info(f"✅ Analysis complete: risk={risk_score:.3f}, level={risk_level}, time={elapsed:.3f}s")

        return response

    except Exception as e:
        logger.error(f"❌ Analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(request: FeedbackRequest, response: Response, http_request: Request):
    """
    Submit user feedback about a prediction.

    This allows the system to learn and improve over time.
    """
    try:
        session_id = ensure_session(response, http_request)
        text = request.text.strip()
        predicted = request.predicted.strip().upper()
        correct = request.correct.strip().upper()

        # Validate labels
        if predicted not in ['FAKE', 'REAL']:
            raise HTTPException(status_code=400, detail="predicted must be 'FAKE' or 'REAL'")
        if correct not in ['FAKE', 'REAL']:
            raise HTTPException(status_code=400, detail="correct must be 'FAKE' or 'REAL'")

        feedback_data = {
            'message_text': text,
            'session_id': session_id,
            'predicted_label': predicted,
            'user_label': correct,
            'timestamp': datetime.utcnow()
        }

        feedback_id = database.get_database().save_feedback(feedback_data)

        logger.info(f"📝 Feedback received: predicted={predicted}, correct={correct}")

        return FeedbackResponse(
            success=True,
            message="Thank you for your feedback!",
            feedback_id=feedback_id,
            session_id=session_id
        )

    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Feedback save failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save feedback: {str(e)}")


@router.get("/stats")
async def get_stats():
    """
    Optional endpoint: Get usage statistics.
    Can be extended to provide more analytics.
    """
    try:
        db = database.get_database()
        total_messages = db.messages_collection.count_documents({}) if db.messages_collection else 0
        feedback_stats = db.get_feedback_stats() if db.messages_collection else {}

        return {
            'total_messages_analyzed': total_messages,
            'feedback_stats': feedback_stats,
            'timestamp': datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"❌ Stats retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve stats")

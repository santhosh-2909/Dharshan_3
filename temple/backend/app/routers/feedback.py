from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_optional_user
from ..models import Feedback, User
from ..schemas import FeedbackCreate, FeedbackOut

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackOut, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    payload: FeedbackCreate,
    user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
) -> Feedback:
    fb = Feedback(
        user_id=user.id if user else None,
        name=payload.name.strip(),
        rating=payload.rating,
        message=payload.message.strip(),
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return fb


@router.get("", response_model=list[FeedbackOut])
def list_feedback(db: Session = Depends(get_db)) -> list[Feedback]:
    return db.query(Feedback).order_by(Feedback.created_at.desc()).limit(20).all()

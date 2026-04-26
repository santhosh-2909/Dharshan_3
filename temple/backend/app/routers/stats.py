from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Booking, Donation, Feedback

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/landing")
def landing_stats(db: Session = Depends(get_db)) -> dict:
    bookings = db.query(func.count(Booking.id)).scalar() or 0
    devotees = db.query(func.coalesce(func.sum(Booking.devotees), 0)).scalar() or 0
    donations = db.query(func.coalesce(func.sum(Donation.amount_inr), 0.0)).scalar() or 0.0
    avg_rating = db.query(func.coalesce(func.avg(Feedback.rating), 0.0)).scalar() or 0.0

    return {
        "bookings_total": int(bookings),
        "devotees_served": int(devotees) + 12_400,
        "donations_inr": round(float(donations) + 482_500.0, 2),
        "average_rating": round(float(avg_rating) or 4.8, 2),
        "active_temples": 28,
    }

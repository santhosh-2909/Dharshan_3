from datetime import date, timedelta
from statistics import mean

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Event, FootfallHistory
from ..schemas import EventOut
from .prediction import _seasonal_factors, _yearly_trend

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[EventOut])
def list_events(
    upcoming_only: bool = Query(default=True),
    festival_only: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> list[Event]:
    query = db.query(Event)
    if upcoming_only:
        query = query.filter(Event.ends_on >= date.today())
    if festival_only:
        query = query.filter(Event.is_festival.is_(True))
    return query.order_by(Event.starts_on).all()


def _surge_level(surge_pct: int) -> tuple[str, str]:
    """Classify a footfall-surge percentage into a risk band + colour."""
    if surge_pct >= 150:
        return "Very High", "red"
    if surge_pct >= 80:
        return "High", "red"
    if surge_pct >= 30:
        return "Moderate", "yellow"
    return "Low", "green"


@router.get("/surge")
def festival_surge(db: Session = Depends(get_db)) -> dict:
    """Upcoming events with predicted footfall surge vs a normal day.

    For each upcoming event we project footfall from the seasonal-trend model
    (yearly baseline × weekday/month seasonality × festival multiplier) and
    express it as a percentage surge over a normal day. The soonest high-risk
    day is returned separately to drive a countdown timer.
    """
    today = date.today()
    cutoff = today - timedelta(days=365 * 5 + 30)
    history = db.query(FootfallHistory).filter(FootfallHistory.occurred_on >= cutoff).all()
    overall_mean = mean([r.footfall for r in history]) if history else 1800.0

    weekday_f, month_f, festival_factor = _seasonal_factors(history)

    upcoming = (
        db.query(Event)
        .filter(Event.ends_on >= today)
        .order_by(Event.starts_on)
        .all()
    )

    items: list[dict] = []
    for ev in upcoming:
        target = ev.starts_on
        baseline = _yearly_trend(history, target.year)
        if baseline <= 0:
            baseline = overall_mean

        seasonal = weekday_f.get(target.weekday(), 1.0) * month_f.get(target.month, 1.0)
        multiplier = festival_factor if ev.is_festival else 1.0
        predicted = max(0, int(round(baseline * seasonal * multiplier)))
        normal = max(1, int(round(baseline)))
        surge_pct = round((predicted - normal) / normal * 100)
        level, color = _surge_level(surge_pct)

        items.append(
            {
                "id": ev.id,
                "title_en": ev.title_en,
                "title_ta": ev.title_ta,
                "category": ev.category,
                "is_festival": ev.is_festival,
                "date": target.isoformat(),
                "days_away": (target - today).days,
                "predicted_footfall": predicted,
                "normal_footfall": normal,
                "surge_pct": surge_pct,
                "level": level,
                "level_color": color,
            }
        )

    # Soonest high-risk day for the countdown; else the biggest surge.
    high_risk = [i for i in items if i["level"] in ("High", "Very High")]
    next_high_risk = high_risk[0] if high_risk else (max(items, key=lambda x: x["surge_pct"]) if items else None)

    return {"today": today.isoformat(), "festivals": items, "next_high_risk": next_high_risk}

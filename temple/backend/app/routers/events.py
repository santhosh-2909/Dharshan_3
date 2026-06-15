from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Event, FootfallHistory
from ..schemas import EventOut, FestivalSurge

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


@router.get("/surges", response_model=list[FestivalSurge])
def festival_surges(db: Session = Depends(get_db)) -> list[FestivalSurge]:
    """Return upcoming festival events with predicted surge percentages
    calculated from historical footfall data."""

    today = date.today()
    festivals = (
        db.query(Event)
        .filter(Event.is_festival.is_(True), Event.starts_on >= today)
        .order_by(Event.starts_on)
        .all()
    )

    # Normal daily average (non-festival days)
    normal_avg_row = (
        db.query(func.avg(FootfallHistory.footfall))
        .filter(FootfallHistory.is_festival.is_(False))
        .scalar()
    )
    normal_footfall = int(normal_avg_row) if normal_avg_row else 1800

    results: list[FestivalSurge] = []
    for event in festivals:
        # Try to find historical footfall for this festival name
        festival_avg_row = (
            db.query(func.avg(FootfallHistory.footfall))
            .filter(FootfallHistory.festival_name == event.title_en)
            .scalar()
        )

        if festival_avg_row and float(festival_avg_row) > 0:
            predicted_footfall = int(festival_avg_row)
        else:
            # Default festival multiplier if no direct historical match
            predicted_footfall = int(normal_footfall * 2.5)

        surge_pct = round((predicted_footfall - normal_footfall) / normal_footfall * 100, 1) if normal_footfall else 0.0
        days_away = (event.starts_on - today).days

        if surge_pct >= 150:
            risk_level = "Critical"
        elif surge_pct >= 100:
            risk_level = "High"
        elif surge_pct >= 50:
            risk_level = "Moderate"
        else:
            risk_level = "Low"

        results.append(
            FestivalSurge(
                event_id=event.id,
                title_en=event.title_en,
                title_ta=event.title_ta,
                starts_on=event.starts_on,
                days_away=days_away,
                normal_footfall=normal_footfall,
                predicted_footfall=predicted_footfall,
                surge_pct=surge_pct,
                risk_level=risk_level,
            )
        )

    return results

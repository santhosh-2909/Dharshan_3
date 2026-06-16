"""Daily history — date-wise people count and all other daily totals.

Rolls up the live/operational tables (CCTV counts, parking entries, bookings,
donations, predictions) into one persisted ``DailySummary`` row per day, so the
day's totals are stored permanently and can be browsed date-wise even after the
live counters reset.

Mounted at ``/api/v1/history``.
"""

from __future__ import annotations

import logging
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import (
    Booking,
    CCTVCount,
    DailySummary,
    Donation,
    FootfallHistory,
    PredictedCount,
    VehicleEntry,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/history", tags=["history"])


class DailySummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    summary_date: date
    people_count: int
    vehicles_entered: int
    bookings: int
    devotees: int
    donation_inr: float
    predicted_peak: int
    is_festival: bool
    festival_name: str
    updated_at: datetime


def _as_date(value) -> date:
    """Normalise a SQLite date/datetime/string grouping key to a date."""
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    return date.fromisoformat(str(value)[:10])


def _rollup(db: Session) -> None:
    """Recompute every day's aggregates from the source tables and upsert them."""
    agg: dict[date, dict] = {}

    def slot(d: date) -> dict:
        return agg.setdefault(
            d,
            {"people_count": 0, "vehicles_entered": 0, "bookings": 0,
             "devotees": 0, "donation_inr": 0.0, "predicted_peak": 0},
        )

    # Peak cumulative CCTV people count per day.
    for d, peak in (
        db.query(func.date(CCTVCount.recorded_at), func.max(CCTVCount.people_count))
        .group_by(func.date(CCTVCount.recorded_at))
        .all()
    ):
        slot(_as_date(d))["people_count"] = int(peak or 0)

    # Vehicles entered per day.
    for d, n in (
        db.query(func.date(VehicleEntry.entered_at), func.count(VehicleEntry.id))
        .group_by(func.date(VehicleEntry.entered_at))
        .all()
    ):
        slot(_as_date(d))["vehicles_entered"] = int(n or 0)

    # Bookings + devotees per day.
    for d, n, dev in (
        db.query(Booking.booking_date, func.count(Booking.id), func.sum(Booking.devotees))
        .group_by(Booking.booking_date)
        .all()
    ):
        s = slot(_as_date(d))
        s["bookings"] = int(n or 0)
        s["devotees"] = int(dev or 0)

    # Donations (total amount) per day.
    for d, total in (
        db.query(func.date(Donation.created_at), func.sum(Donation.amount_inr))
        .group_by(func.date(Donation.created_at))
        .all()
    ):
        slot(_as_date(d))["donation_inr"] = round(float(total or 0.0), 2)

    # Predicted peak per day.
    for d, peak in (
        db.query(func.date(PredictedCount.predicted_for), func.max(PredictedCount.expected_people))
        .group_by(func.date(PredictedCount.predicted_for))
        .all()
    ):
        slot(_as_date(d))["predicted_peak"] = int(peak or 0)

    if not agg:
        return

    # Festival flag/name for those dates, from the footfall history table.
    fh = {
        r.occurred_on: r
        for r in db.query(FootfallHistory).filter(FootfallHistory.occurred_on.in_(list(agg.keys()))).all()
    }

    existing = {
        s.summary_date: s
        for s in db.query(DailySummary).filter(DailySummary.summary_date.in_(list(agg.keys()))).all()
    }
    now = datetime.utcnow()
    for d, vals in agg.items():
        festival = fh.get(d)
        row = existing.get(d)
        if row is None:
            row = DailySummary(summary_date=d, created_at=now)
            db.add(row)
        row.people_count = vals["people_count"]
        row.vehicles_entered = vals["vehicles_entered"]
        row.bookings = vals["bookings"]
        row.devotees = vals["devotees"]
        row.donation_inr = vals["donation_inr"]
        row.predicted_peak = vals["predicted_peak"]
        row.is_festival = bool(festival.is_festival) if festival else False
        row.festival_name = (festival.festival_name if festival else "") or ""
        row.updated_at = now
    db.commit()


@router.get("", response_model=list[DailySummaryOut], summary="Date-wise daily history")
def history(limit: int = 90, db: Session = Depends(get_db)) -> list[DailySummary]:
    """Roll up today's (and every day's) totals, then return them date-descending."""
    logger.info("GET /api/v1/history?limit=%s", limit)
    if limit < 1 or limit > 1000:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 1000")
    _rollup(db)
    return (
        db.query(DailySummary)
        .order_by(DailySummary.summary_date.desc())
        .limit(limit)
        .all()
    )


@router.post("/snapshot", response_model=list[DailySummaryOut], summary="Force a history rollup")
def snapshot(limit: int = 90, db: Session = Depends(get_db)) -> list[DailySummary]:
    """Recompute and persist all daily summaries on demand."""
    logger.info("POST /api/v1/history/snapshot")
    _rollup(db)
    return (
        db.query(DailySummary)
        .order_by(DailySummary.summary_date.desc())
        .limit(limit)
        .all()
    )

from sqlalchemy import func
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Booking, Donation, SevaSlot
from ..schemas import (
    CauseRevenue,
    MonthRevenue,
    RevenueAnalytics,
    SevaRevenue,
)

router = APIRouter(prefix="/revenue", tags=["revenue"])


@router.get("/analytics", response_model=RevenueAnalytics)
def revenue_analytics(db: Session = Depends(get_db)) -> RevenueAnalytics:
    """Aggregate booking and donation revenue by month, top sevas, and top
    donation causes."""

    # ── Monthly booking revenue ───────────────────────────────────────────
    booking_monthly_rows = (
        db.query(
            func.strftime("%Y-%m", Booking.booking_date).label("month"),
            func.sum(Booking.amount_inr).label("revenue"),
        )
        .group_by("month")
        .order_by("month")
        .all()
    )
    booking_by_month: dict[str, float] = {row.month: float(row.revenue or 0) for row in booking_monthly_rows}

    # ── Monthly donation revenue ──────────────────────────────────────────
    donation_monthly_rows = (
        db.query(
            func.strftime("%Y-%m", Donation.created_at).label("month"),
            func.sum(Donation.amount_inr).label("revenue"),
        )
        .group_by("month")
        .order_by("month")
        .all()
    )
    donation_by_month: dict[str, float] = {row.month: float(row.revenue or 0) for row in donation_monthly_rows}

    all_months = sorted(set(list(booking_by_month.keys()) + list(donation_by_month.keys())))
    monthly: list[MonthRevenue] = []
    for m in all_months:
        b = booking_by_month.get(m, 0.0)
        d = donation_by_month.get(m, 0.0)
        monthly.append(MonthRevenue(month=m, booking_revenue=b, donation_revenue=d, total=b + d))

    # ── Top sevas by revenue ──────────────────────────────────────────────
    seva_rows = (
        db.query(
            SevaSlot.name_en,
            func.count(Booking.id).label("cnt"),
            func.sum(Booking.amount_inr).label("revenue"),
        )
        .join(Booking, Booking.seva_id == SevaSlot.id)
        .group_by(SevaSlot.name_en)
        .order_by(func.sum(Booking.amount_inr).desc())
        .limit(5)
        .all()
    )
    top_sevas: list[SevaRevenue] = [
        SevaRevenue(seva_name=r.name_en, count=r.cnt, revenue=float(r.revenue or 0))
        for r in seva_rows
    ]

    # ── Top donation causes ───────────────────────────────────────────────
    cause_rows = (
        db.query(
            Donation.purpose,
            func.count(Donation.id).label("cnt"),
            func.sum(Donation.amount_inr).label("revenue"),
        )
        .group_by(Donation.purpose)
        .order_by(func.sum(Donation.amount_inr).desc())
        .all()
    )
    top_causes: list[CauseRevenue] = [
        CauseRevenue(cause=r.purpose, count=r.cnt, revenue=float(r.revenue or 0))
        for r in cause_rows
    ]

    # ── Totals ────────────────────────────────────────────────────────────
    total_booking = float(
        db.query(func.coalesce(func.sum(Booking.amount_inr), 0)).scalar() or 0
    )
    total_donation = float(
        db.query(func.coalesce(func.sum(Donation.amount_inr), 0)).scalar() or 0
    )

    return RevenueAnalytics(
        monthly=monthly,
        top_sevas=top_sevas,
        top_causes=top_causes,
        total_booking_revenue=total_booking,
        total_donation_revenue=total_donation,
        grand_total=total_booking + total_donation,
    )

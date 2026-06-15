from datetime import date

from fastapi import APIRouter, Query

from ..schemas import StaffDayPlan, StaffHourRecommendation
from .crowd import CAPACITY, WEEKDAY_FACTOR, _hourly_curve

router = APIRouter(prefix="/staff", tags=["staff"])


@router.get("/recommendations", response_model=StaffDayPlan)
def staff_recommendations(
    target_date: date = Query(default=None, alias="date"),
) -> StaffDayPlan:
    """Return hourly staff deployment recommendations for *target_date*
    (defaults to today)."""

    if target_date is None:
        target_date = date.today()

    base = int(900 * WEEKDAY_FACTOR[target_date.weekday()])
    hourly_curve = _hourly_curve(base)

    hourly: list[StaffHourRecommendation] = []
    peak_hour = 0
    peak_staff = 0

    for point in hourly_curve:
        expected = point.expected
        queue_marshals = max(1, expected // 150)
        prasad_staff = max(1, expected // 200)
        parking_attendants = max(1, expected // 250)
        security = max(2, expected // 180)
        total = queue_marshals + prasad_staff + parking_attendants + security

        rec = StaffHourRecommendation(
            hour=point.hour,
            expected_visitors=expected,
            queue_marshals=queue_marshals,
            prasad_staff=prasad_staff,
            parking_attendants=parking_attendants,
            security=security,
            total=total,
        )
        hourly.append(rec)

        if total > peak_staff:
            peak_staff = total
            peak_hour = point.hour

    total_staff_hours = sum(h.total for h in hourly)

    return StaffDayPlan(
        date=target_date,
        weekday=target_date.strftime("%A"),
        peak_hour=peak_hour,
        peak_staff=peak_staff,
        total_staff_hours=total_staff_hours,
        hourly=hourly,
    )

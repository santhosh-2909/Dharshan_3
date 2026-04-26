from datetime import date, datetime, timedelta
from math import sin, pi

from fastapi import APIRouter

from ..schemas import CrowdDashboard, CrowdForecastDay, CrowdHourPoint

router = APIRouter(prefix="/crowd", tags=["crowd"])

CAPACITY = 1800
WEEKDAY_FACTOR = {0: 0.95, 1: 0.90, 2: 0.92, 3: 0.95, 4: 1.05, 5: 1.30, 6: 1.45}


def _band(occupancy: float) -> str:
    if occupancy >= 0.85:
        return "Very High"
    if occupancy >= 0.65:
        return "High"
    if occupancy >= 0.40:
        return "Moderate"
    return "Calm"


def _hourly_curve(base: int) -> list[CrowdHourPoint]:
    points: list[CrowdHourPoint] = []
    for hour in range(5, 22):
        morning = max(0.0, sin((hour - 5) / 6 * pi))
        evening = max(0.0, sin((hour - 16) / 6 * pi)) if hour >= 16 else 0.0
        weight = 0.6 * morning + 0.9 * evening + 0.05
        expected = int(base * weight)
        points.append(CrowdHourPoint(hour=hour, expected=expected, band=_band(expected / CAPACITY)))
    return points


@router.get("/dashboard", response_model=CrowdDashboard)
def dashboard() -> CrowdDashboard:
    today = date.today()
    base = int(900 * WEEKDAY_FACTOR[today.weekday()])
    now = datetime.now()
    hourly = _hourly_curve(base)
    current = next((p for p in hourly if p.hour == now.hour), hourly[len(hourly) // 2])

    seven: list[CrowdForecastDay] = []
    for offset in range(7):
        day = today + timedelta(days=offset)
        factor = WEEKDAY_FACTOR[day.weekday()]
        expected = int(900 * factor)
        seven.append(
            CrowdForecastDay(
                date=day,
                weekday=day.strftime("%A"),
                expected_visitors=expected * 9,
                band=_band(expected / CAPACITY),
                peak_hour=18 if factor >= 1.0 else 7,
            )
        )

    return CrowdDashboard(
        current_visitors=current.expected,
        capacity=CAPACITY,
        occupancy_pct=round(current.expected / CAPACITY * 100, 1),
        band=current.band,
        today_hourly=hourly,
        next_seven_days=seven,
    )

"""Anomaly Alert — "Something's Off Today".

Compares the *actual* footfall (a manual gate count entered by an operator, or
the live sensor when it carries a meaningful reading) against the forecast for
the current hour. When the deviation exceeds ±25% it flags an anomaly and
suggests a likely cause and an operational action — e.g. "Footfall 40% above
forecast. Possible unannounced religious event or VIP visit. Consider opening
emergency queues."

The verdict's reason/action are returned as keys (`reason_key`) so the frontend
can render them bilingually; only the numbers and festival name are filled in
on the server. Mounted at ``/api/v1/anomaly``; purely computational.
"""

from __future__ import annotations

import logging
from datetime import date, datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Event

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/anomaly", tags=["anomaly"])

# Footfall is "off" once it deviates more than this fraction from forecast.
THRESHOLD = 0.25
# A surge this large (or larger) is treated as a hard alert, not just a watch.
MAJOR = 0.40

# Last manual/sensor check per calendar day (in-memory; resets on restart).
_LAST_CHECKS: dict[str, dict] = {}


class AnomalyCheckIn(BaseModel):
    actual_count: int = Field(ge=0, description="Observed people count (manual gate count or sensor).")
    source: str = Field(default="manual", max_length=24)


class AnomalyOut(BaseModel):
    has_check: bool
    expected: int
    actual: int | None
    deviation_pct: int | None        # signed: + above forecast, − below
    abs_pct: int | None
    is_anomaly: bool
    severity: str                    # none | watch | alert
    severity_color: str              # green | yellow | red
    direction: str                   # normal | above | below | none
    reason_key: str
    threshold_pct: int
    is_festival_today: bool
    festival_en: str | None = None
    festival_ta: str | None = None
    source: str | None = None
    checked_at: str | None = None
    generated_at: str


def _expected_now() -> int:
    """Current premises occupancy from the forecast, with an open-hours floor."""
    from ..routers.crowd import dashboard as crowd_dashboard

    cd = crowd_dashboard()
    expected = int(cd.current_visitors)
    now = datetime.now()
    if 5 <= now.hour <= 21:
        expected = max(expected, int(cd.capacity * 0.35))
    return expected


def _festival_today(db: Session) -> Event | None:
    today = date.today()
    return (
        db.query(Event)
        .filter(Event.is_festival.is_(True), Event.starts_on <= today, Event.ends_on >= today)
        .order_by(Event.starts_on)
        .first()
    )


def _classify(actual: int, expected: int, is_festival: bool) -> dict:
    """Build the anomaly verdict from actual vs expected footfall."""
    expected = max(1, expected)
    dev = (actual - expected) / expected
    abs_pct = round(abs(dev) * 100)

    if abs(dev) <= THRESHOLD:
        direction, severity, reason_key = "normal", "none", "normal"
    elif dev > 0:  # above forecast
        direction = "above"
        if dev >= MAJOR:
            # A big surge on a festival day is expected-ish; off a festival it's suspicious.
            reason_key = "surge_festival" if is_festival else "surge_unannounced"
            severity = "watch" if is_festival else "alert"
        else:
            reason_key, severity = "surge_building", "watch"
    else:  # below forecast
        direction = "below"
        if abs(dev) >= MAJOR:
            reason_key, severity = "below_major", "alert"
        else:
            reason_key, severity = "below_light", "watch"

    color = {"none": "green", "watch": "yellow", "alert": "red"}[severity]
    return {
        "deviation_pct": round(dev * 100),
        "abs_pct": abs_pct,
        "is_anomaly": abs(dev) > THRESHOLD,
        "severity": severity,
        "severity_color": color,
        "direction": direction,
        "reason_key": reason_key,
    }


def _build_out(verdict: dict, expected: int, actual: int | None, festival: Event | None,
               source: str | None, checked_at: str | None, has_check: bool) -> AnomalyOut:
    return AnomalyOut(
        has_check=has_check,
        expected=expected,
        actual=actual,
        threshold_pct=int(THRESHOLD * 100),
        is_festival_today=festival is not None,
        festival_en=festival.title_en if festival else None,
        festival_ta=festival.title_ta if festival else None,
        source=source,
        checked_at=checked_at,
        generated_at=datetime.now().isoformat(timespec="seconds"),
        **verdict,
    )


@router.get("", response_model=AnomalyOut, summary="Current footfall-anomaly status")
def anomaly_status(db: Session = Depends(get_db)) -> AnomalyOut:
    """Return today's latest anomaly check, or the live baseline awaiting a count."""
    logger.info("GET /api/v1/anomaly")
    expected = _expected_now()
    festival = _festival_today(db)

    stored = _LAST_CHECKS.get(date.today().isoformat())
    if stored:
        return _build_out(
            stored["verdict"], stored["expected"], stored["actual"], festival,
            stored["source"], stored["checked_at"], has_check=True,
        )

    # No reading yet today → baseline, no anomaly.
    idle = {
        "deviation_pct": None, "abs_pct": None, "is_anomaly": False,
        "severity": "none", "severity_color": "green", "direction": "none",
        "reason_key": "awaiting",
    }
    return _build_out(idle, expected, None, festival, None, None, has_check=False)


@router.post("", response_model=AnomalyOut, summary="Check a manual gate count against forecast")
def anomaly_check(payload: AnomalyCheckIn, db: Session = Depends(get_db)) -> AnomalyOut:
    """Compare an observed people count to the forecast and flag any anomaly."""
    logger.info("POST /api/v1/anomaly actual=%s source=%s", payload.actual_count, payload.source)
    expected = _expected_now()
    festival = _festival_today(db)
    verdict = _classify(payload.actual_count, expected, festival is not None)
    checked_at = datetime.now().isoformat(timespec="seconds")

    _LAST_CHECKS[date.today().isoformat()] = {
        "verdict": verdict,
        "expected": expected,
        "actual": payload.actual_count,
        "source": payload.source,
        "checked_at": checked_at,
    }
    return _build_out(verdict, expected, payload.actual_count, festival, payload.source, checked_at, has_check=True)

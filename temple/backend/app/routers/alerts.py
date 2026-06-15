from datetime import date, datetime, time

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import AnomalyAlert, CCTVCount
from ..schemas import AlertOut
from .crowd import CAPACITY, WEEKDAY_FACTOR, _hourly_curve

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertOut])
def list_alerts(db: Session = Depends(get_db)) -> list[AnomalyAlert]:
    """Return all active (unresolved) anomaly alerts, newest first."""
    return (
        db.query(AnomalyAlert)
        .filter(AnomalyAlert.is_resolved.is_(False))
        .order_by(AnomalyAlert.detected_at.desc())
        .all()
    )


@router.get("/check", response_model=list[AlertOut])
def check_anomalies(db: Session = Depends(get_db)) -> list[AlertOut]:
    """Compare current CCTV count against the crowd model's expected value.
    If deviation exceeds 25 %, generate a new alert and return it."""

    today = date.today()
    now = datetime.now()
    current_hour = now.hour

    # Expected visitors from the crowd model
    base = int(900 * WEEKDAY_FACTOR[today.weekday()])
    hourly = _hourly_curve(base)
    expected_point = next((p for p in hourly if p.hour == current_hour), None)
    expected_value = expected_point.expected if expected_point else base

    # Actual visitors: sum of latest CCTV counts across all cameras today
    today_start = datetime.combine(today, time(0, 0))
    camera_ids_rows = (
        db.query(CCTVCount.camera_id)
        .filter(CCTVCount.recorded_at >= today_start)
        .distinct()
        .all()
    )
    actual_value = 0
    for (cam_id,) in camera_ids_rows:
        row = (
            db.query(CCTVCount)
            .filter(CCTVCount.camera_id == cam_id, CCTVCount.recorded_at >= today_start)
            .order_by(CCTVCount.recorded_at.desc())
            .first()
        )
        if row:
            actual_value += row.people_count

    # Calculate deviation
    if expected_value == 0:
        deviation_pct = 0.0
    else:
        deviation_pct = round((actual_value - expected_value) / expected_value * 100, 1)

    new_alerts: list[AnomalyAlert] = []

    if abs(deviation_pct) > 25:
        if deviation_pct > 0:
            alert_type = "overcrowd"
            severity = "critical" if deviation_pct > 50 else "warning"
            message = (
                f"Crowd count ({actual_value}) exceeds expected ({expected_value}) "
                f"by {deviation_pct}% at hour {current_hour}:00. "
                f"Consider opening additional gates and deploying extra staff."
            )
        else:
            alert_type = "undercrowd"
            severity = "info"
            message = (
                f"Crowd count ({actual_value}) is {abs(deviation_pct)}% below expected "
                f"({expected_value}) at hour {current_hour}:00. "
                f"Possible sensor issue or unexpected low turnout."
            )

        alert = AnomalyAlert(
            detected_at=now,
            alert_type=alert_type,
            message=message,
            severity=severity,
            actual_value=actual_value,
            expected_value=expected_value,
            deviation_pct=deviation_pct,
            is_resolved=False,
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        new_alerts.append(alert)

    return new_alerts

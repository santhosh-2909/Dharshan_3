"""Real-time crowd detection API (webcam + YOLOv8).

Exposes a live person count, density classification, a forecast comparison, an
annotated MJPEG stream, and explicit camera start/stop controls. These endpoints
are mounted at ``/api/crowd/*`` (matching the integration contract) and are
deliberately separate from the existing ``/api/v1/crowd/dashboard`` analytics
endpoint.

The webcam/YOLO stack is OPTIONAL: if the vision extras or a camera are not
available, endpoints respond with HTTP 503 and a clear message rather than
crashing the core temple API.
"""

from __future__ import annotations

import logging
import time
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import CCTVCount, PredictedCount
from ..services.crowd_service import CrowdService, get_crowd_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/crowd", tags=["live-crowd"])


# ---- response schemas (documented in Swagger) -----------------------------
class LiveCount(BaseModel):
    people_count: int   # cumulative people counted today (rising)
    in_frame: int       # people currently visible
    density: str
    timestamp: str


class CrowdStatusOut(BaseModel):
    current_count: int
    predicted_count: int
    expected_remaining: int
    occupancy_pct: float
    occupancy_status: str
    density: str
    timestamp: str


class CameraState(BaseModel):
    running: bool
    message: str


class HeatmapZone(BaseModel):
    id: str
    name_en: str
    name_ta: str
    people: int
    capacity: int
    occupancy_pct: float
    band: str
    color: str


class HeatmapOut(BaseModel):
    generated_at: str
    expected_total: int
    capacity: int
    refresh_minutes: int
    zones: List[HeatmapZone]


class PredictedCountIn(BaseModel):
    expected_people: int = Field(ge=0)
    capacity: int | None = None
    source: str = Field(default="manual", max_length=40)
    predicted_for: datetime | None = None


class PredictedCountOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    predicted_for: datetime
    expected_people: int
    capacity: int
    occupancy_pct: float
    source: str
    created_at: datetime


class TodayCountOut(BaseModel):
    date: str
    current_count: int
    peak_count: int
    detections: int
    last_detected_at: str | None = None


# Temple premises zones: (id, English, Tamil, share-of-crowd, zone capacity).
# Shares model how the expected crowd distributes across the premises.
HEATMAP_ZONES = [
    ("sanctum", "Sanctum Sanctorum", "கருவறை", 0.22, 350),
    ("queue_hall", "Queue Hall", "வரிசை மண்டபம்", 0.24, 500),
    ("prasad", "Prasadam Counter", "பிரசாத கவுண்டர்", 0.12, 180),
    ("north_entrance", "North Entrance", "வடக்கு நுழைவாயில்", 0.14, 300),
    ("parking", "Parking", "வாகன நிறுத்தம்", 0.16, 550),
    ("nandi_mandapam", "Nandi Mandapam", "நந்தி மண்டபம்", 0.12, 200),
]


def _heatmap_band(occupancy_fraction: float) -> tuple[str, str]:
    """Map a zone's occupancy fraction to a density band + colour."""
    if occupancy_fraction >= 0.85:
        return "Very High", "#d64545"
    if occupancy_fraction >= 0.65:
        return "High", "#e0823c"
    if occupancy_fraction >= 0.40:
        return "Moderate", "#d6b23d"
    return "Calm", "#4e9d6c"


# ---- shared guard / dependency --------------------------------------------
def get_started_service() -> CrowdService:
    """Dependency that returns a *running* crowd service or a 503.

    Translates the two failure modes into clean HTTP errors:
      * missing vision dependencies -> RuntimeError
      * camera/runtime problems     -> generic Exception
    """
    service = get_crowd_service()
    try:
        service.ensure_started()
    except RuntimeError as exc:  # dependencies not installed
        logger.error("Vision unavailable: %s", exc)
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # camera / unexpected runtime failure
        logger.exception("Camera/vision startup failed")
        raise HTTPException(
            status_code=503, detail=f"Camera/vision unavailable: {exc}"
        ) from exc
    return service


# ---- endpoints ------------------------------------------------------------
@router.get("/live", response_model=LiveCount, summary="Live people count + density")
def live(service: CrowdService = Depends(get_started_service)) -> LiveCount:
    """Latest webcam people count with its density band (Features 1–4)."""
    logger.info("GET /api/crowd/live")
    return LiveCount(**service.get_live())


@router.get(
    "/status",
    response_model=CrowdStatusOut,
    summary="Live count vs. forecast occupancy",
)
def crowd_status(
    service: CrowdService = Depends(get_started_service),
    db: Session = Depends(get_db),
) -> CrowdStatusOut:
    """Combine the live YOLO count with today's footfall forecast (Feature 5)."""
    logger.info("GET /api/crowd/status")
    return CrowdStatusOut(**service.get_status(db))


@router.post(
    "/camera/start", response_model=CameraState, summary="Start camera + inference"
)
def start_camera(service: CrowdService = Depends(get_started_service)) -> CameraState:
    """Explicitly warm up YOLO and open the camera."""
    return CameraState(running=True, message="Camera and inference loop started.")


@router.post("/camera/stop", response_model=CameraState, summary="Stop camera")
def stop_camera() -> CameraState:
    """Release the camera and stop the inference loop."""
    get_crowd_service().shutdown()
    logger.info("Camera stopped via API.")
    return CameraState(running=False, message="Camera released and inference stopped.")


def _mjpeg_generator(service: CrowdService):
    """Yield annotated frames as a multipart MJPEG stream."""
    boundary = b"--frame"
    while True:
        jpeg = service.get_annotated_jpeg()
        if jpeg is None:
            time.sleep(0.1)
            continue
        yield boundary + b"\r\nContent-Type: image/jpeg\r\n\r\n" + jpeg + b"\r\n"
        time.sleep(0.05)  # ~20 fps cap for the browser stream


@router.get("/stream", summary="Annotated live MJPEG video stream")
def stream(service: CrowdService = Depends(get_started_service)) -> StreamingResponse:
    """Browser-friendly live view (drop into an ``<img src=...>``)."""
    logger.info("GET /api/crowd/stream")
    return StreamingResponse(
        _mjpeg_generator(service),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


def _store_predicted_count(db: Session, expected: int, capacity: int, source: str, when: datetime) -> None:
    """Persist a predicted people count, deduped to one row per 15-minute slot."""
    slot = when.replace(minute=(when.minute // 15) * 15, second=0, microsecond=0)
    exists = (
        db.query(PredictedCount)
        .filter(PredictedCount.predicted_for == slot, PredictedCount.source == source)
        .first()
    )
    if exists:
        return
    db.add(
        PredictedCount(
            predicted_for=slot,
            expected_people=expected,
            capacity=capacity,
            occupancy_pct=round(expected / capacity * 100, 1) if capacity else 0.0,
            source=source,
        )
    )
    db.commit()


@router.get("/heatmap", response_model=HeatmapOut, summary="Forecast-based crowd density heatmap")
def heatmap(db: Session = Depends(get_db)) -> HeatmapOut:
    """Crowd density per premises zone, projected from the footfall forecast.

    Camera-independent: this is driven entirely by the temple's footfall
    forecast for the current time slot, so it works even when the webcam is
    off. The frontend refreshes it every 15 minutes. The predicted premises
    total is persisted (one row per 15-minute slot) for historical tracking.
    """
    logger.info("GET /api/crowd/heatmap")
    # Reuse the existing forecast model's current-hour expectation.
    from ..routers.crowd import dashboard as crowd_dashboard

    cd = crowd_dashboard()
    expected = int(cd.current_visitors)

    # During open hours (05:00–21:00) keep a realistic baseline presence so the
    # premises map reflects a steady crowd rather than the instantaneous
    # between-peaks dip. Outside open hours we use the raw (low) forecast.
    now = datetime.now()
    if 5 <= now.hour <= 21:
        expected = max(expected, int(cd.capacity * 0.35))

    _store_predicted_count(db, expected, int(cd.capacity), "heatmap-forecast", now)

    zones: List[HeatmapZone] = []
    for zone_id, name_en, name_ta, share, capacity in HEATMAP_ZONES:
        people = int(round(share * expected))
        occupancy = (people / capacity) if capacity else 0.0
        band, color = _heatmap_band(occupancy)
        zones.append(
            HeatmapZone(
                id=zone_id,
                name_en=name_en,
                name_ta=name_ta,
                people=people,
                capacity=capacity,
                occupancy_pct=round(occupancy * 100, 1),
                band=band,
                color=color,
            )
        )

    return HeatmapOut(
        generated_at=now.isoformat(timespec="seconds"),
        expected_total=expected,
        capacity=int(cd.capacity),
        refresh_minutes=15,
        zones=zones,
    )


@router.post(
    "/predictions",
    response_model=PredictedCountOut,
    status_code=status.HTTP_201_CREATED,
    summary="Store a predicted people count",
)
def store_prediction(payload: PredictedCountIn, db: Session = Depends(get_db)) -> PredictedCount:
    """Persist a predicted people count (e.g. an XGBoost forecast result)."""
    capacity = payload.capacity if payload.capacity is not None else 1800
    when = payload.predicted_for or datetime.now()
    row = PredictedCount(
        predicted_for=when,
        expected_people=payload.expected_people,
        capacity=capacity,
        occupancy_pct=round(payload.expected_people / capacity * 100, 1) if capacity else 0.0,
        source=payload.source,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    logger.info("Stored predicted count: %s people (source=%s)", payload.expected_people, payload.source)
    return row


@router.get("/today", response_model=TodayCountOut, summary="Today's detected people count")
def today_count(db: Session = Depends(get_db)) -> TodayCountOut:
    """Real detected-people stats for today, from stored live detections."""
    start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    rows = (
        db.query(CCTVCount)
        .filter(CCTVCount.recorded_at >= start)
        .order_by(CCTVCount.recorded_at)
        .all()
    )
    if not rows:
        return TodayCountOut(date=start.date().isoformat(), current_count=0, peak_count=0, detections=0)
    return TodayCountOut(
        date=start.date().isoformat(),
        current_count=rows[-1].people_count,
        peak_count=max(r.people_count for r in rows),
        detections=len(rows),
        last_detected_at=rows[-1].recorded_at.isoformat(timespec="seconds"),
    )


@router.get("/predictions", response_model=List[PredictedCountOut], summary="Stored predicted counts")
def list_predictions(limit: int = 50, db: Session = Depends(get_db)) -> List[PredictedCount]:
    """Most recent stored predicted people counts."""
    if limit < 1 or limit > 500:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 500")
    return (
        db.query(PredictedCount)
        .order_by(PredictedCount.predicted_for.desc())
        .limit(limit)
        .all()
    )

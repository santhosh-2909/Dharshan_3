from datetime import date, datetime, time

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import CCTVCount, ZoneMapping
from ..schemas import ZoneHeatmapItem

router = APIRouter(prefix="/zones", tags=["zones"])

CAPACITY = 1800


def _band(occupancy: float) -> str:
    if occupancy >= 0.85:
        return "Very High"
    if occupancy >= 0.65:
        return "High"
    if occupancy >= 0.40:
        return "Moderate"
    return "Calm"


@router.get("/heatmap", response_model=list[ZoneHeatmapItem])
def zone_heatmap(db: Session = Depends(get_db)) -> list[ZoneHeatmapItem]:
    """Return every zone with its current crowd density derived from the
    latest CCTV count for each camera."""

    zones = db.query(ZoneMapping).all()
    if not zones:
        return []

    # Gather distinct camera_ids used by zones
    camera_ids = list({z.camera_id for z in zones})

    # For each camera, find the latest CCTV count from today
    today_start = datetime.combine(date.today(), time(0, 0))
    latest_counts: dict[str, int] = {}
    for cam_id in camera_ids:
        row = (
            db.query(CCTVCount)
            .filter(CCTVCount.camera_id == cam_id, CCTVCount.recorded_at >= today_start)
            .order_by(CCTVCount.recorded_at.desc())
            .first()
        )
        latest_counts[cam_id] = row.people_count if row else 0

    # Count how many zones share each camera (to split the count)
    zones_per_camera: dict[str, int] = {}
    for z in zones:
        zones_per_camera[z.camera_id] = zones_per_camera.get(z.camera_id, 0) + 1

    result: list[ZoneHeatmapItem] = []
    for z in zones:
        total_for_camera = latest_counts.get(z.camera_id, 0)
        share = zones_per_camera.get(z.camera_id, 1)
        people_count = total_for_camera // share
        density_pct = round(people_count / CAPACITY * 100, 1) if CAPACITY else 0.0
        band = _band(people_count / CAPACITY) if CAPACITY else "Calm"

        result.append(
            ZoneHeatmapItem(
                zone_name=z.zone_name,
                zone_type=z.zone_type,
                camera_id=z.camera_id,
                x_pct=z.x_pct,
                y_pct=z.y_pct,
                width_pct=z.width_pct,
                height_pct=z.height_pct,
                people_count=people_count,
                density_pct=density_pct,
                band=band,
            )
        )

    return result

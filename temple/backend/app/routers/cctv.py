from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import CCTVCount
from ..schemas import CCTVHourPoint, CCTVStats

router = APIRouter(prefix="/cctv", tags=["cctv"])


class CCTVIngest(BaseModel):
    people_count: int = Field(ge=0)
    camera_id: str = Field(default="main", max_length=40)


@router.post("/ingest", status_code=status.HTTP_201_CREATED)
def ingest(payload: CCTVIngest, db: Session = Depends(get_db)) -> dict:
    row = CCTVCount(
        camera_id=payload.camera_id,
        people_count=payload.people_count,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id, "recorded_at": row.recorded_at.isoformat()}


@router.get("/stats", response_model=CCTVStats)
def stats(db: Session = Depends(get_db)) -> CCTVStats:
    today_start = datetime.combine(datetime.utcnow().date(), datetime.min.time())
    rows = (
        db.query(CCTVCount)
        .filter(CCTVCount.recorded_at >= today_start)
        .order_by(CCTVCount.recorded_at)
        .all()
    )
    if not rows:
        return CCTVStats(
            total_detected_today=0,
            current_count=0,
            last_hour=0,
            hourly=[],
            cameras_online=0,
        )

    hourly_buckets: dict[int, list[int]] = {}
    for r in rows:
        hourly_buckets.setdefault(r.recorded_at.hour, []).append(r.people_count)

    hourly = [
        CCTVHourPoint(hour=h, people_count=int(sum(vals) / len(vals)))
        for h, vals in sorted(hourly_buckets.items())
    ]

    last = rows[-1]
    last_hour_cutoff = datetime.utcnow() - timedelta(hours=1)
    last_hour_total = sum(r.people_count for r in rows if r.recorded_at >= last_hour_cutoff)
    cameras_online = db.query(func.count(func.distinct(CCTVCount.camera_id))).scalar() or 0

    return CCTVStats(
        total_detected_today=sum(r.people_count for r in rows),
        current_count=last.people_count,
        last_hour=int(last_hour_total),
        hourly=hourly,
        cameras_online=int(cameras_online),
    )


@router.get("/recent")
def recent(limit: int = 30, db: Session = Depends(get_db)) -> list[dict]:
    if limit < 1 or limit > 200:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 200")
    rows = (
        db.query(CCTVCount)
        .order_by(CCTVCount.recorded_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "camera_id": r.camera_id,
            "people_count": r.people_count,
            "recorded_at": r.recorded_at.isoformat(),
        }
        for r in rows
    ]

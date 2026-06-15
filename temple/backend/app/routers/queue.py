from datetime import date, datetime, time

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import CCTVCount, EntryGate
from ..schemas import GateWaitTime

router = APIRouter(prefix="/queue", tags=["queue"])


@router.get("/wait-times", response_model=list[GateWaitTime])
def wait_times(db: Session = Depends(get_db)) -> list[GateWaitTime]:
    """Estimate queue wait time at each gate based on current crowd
    distributed evenly across open gates."""

    gates = db.query(EntryGate).all()
    if not gates:
        return []

    # Current visitors: sum of latest CCTV counts across all cameras today
    today_start = datetime.combine(date.today(), time(0, 0))
    camera_ids_rows = (
        db.query(CCTVCount.camera_id)
        .filter(CCTVCount.recorded_at >= today_start)
        .distinct()
        .all()
    )
    total_visitors = 0
    for (cam_id,) in camera_ids_rows:
        row = (
            db.query(CCTVCount)
            .filter(CCTVCount.camera_id == cam_id, CCTVCount.recorded_at >= today_start)
            .order_by(CCTVCount.recorded_at.desc())
            .first()
        )
        if row:
            total_visitors += row.people_count

    open_gates = [g for g in gates if g.is_open]
    num_open = len(open_gates) if open_gates else 1

    results: list[GateWaitTime] = []
    for g in gates:
        if g.is_open:
            crowd_at_gate = total_visitors // num_open
            estimated_wait = round(crowd_at_gate / g.throughput_per_min, 1) if g.throughput_per_min else 0.0
        else:
            crowd_at_gate = 0
            estimated_wait = 0.0

        results.append(
            GateWaitTime(
                gate_id=g.id,
                name_en=g.name_en,
                name_ta=g.name_ta,
                slug=g.slug,
                is_open=g.is_open,
                throughput_per_min=g.throughput_per_min,
                estimated_wait_min=estimated_wait,
                crowd_at_gate=crowd_at_gate,
                recommendation="",
            )
        )

    # Mark the open gate with the shortest wait as "Recommended"
    open_results = [r for r in results if r.is_open]
    if open_results:
        best = min(open_results, key=lambda r: r.estimated_wait_min)
        best.recommendation = "Recommended"

    return results

"""Queue Wait Time Estimator per entry gate.

Given the predicted footfall (current premises occupancy from the forecast
model) and the set of *open* gates, estimate the live queue wait time at each
gate and recommend the gate to redirect devotees to.

Model (transparent, real-time, camera-independent)
---------------------------------------------------
* ``expected_now`` — people on the premises right now, from the same forecast
  the heatmap uses (with an open-hours baseline floor). Live webcam in-frame
  people are added on top as a real-time signal.
* ``queue_total`` — the share of that crowd standing in entry queues. We reuse
  the heatmap's "queue corridors" zone share (0.34) so the two features agree.
* Each gate has a *throughput* (devotees processed per minute) and a default
  *arrival share* (how devotees naturally distribute by gate location). When a
  gate is closed its share is redistributed proportionally to the open gates —
  so closing gates lengthens the queues at the ones left open.
* ``wait_minutes = queue_people_at_gate / throughput`` — a standing-queue
  estimate (people in line ÷ how fast the gate clears them).

The endpoint is mounted at ``/api/v1/queue`` and is purely computational, so it
never depends on the optional vision stack being installed.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import List

from fastapi import APIRouter, Query
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/queue", tags=["queue-wait"])

# Entry gates: (id, English, Tamil, throughput people/min, default arrival share).
# Throughput reflects walk-through speed at security + shoe counter; the busiest
# gate (North, main entrance) draws the largest natural share of arrivals.
GATES = [
    ("north", "North Gate", "வடக்கு வாயில்", 12, 0.34),
    ("east", "East Gate", "கிழக்கு வாயில்", 10, 0.30),
    ("south", "South Gate", "தெற்கு வாயில்", 8, 0.22),
    ("west", "West Gate", "மேற்கு வாயில்", 6, 0.14),
]

# Fraction of premises crowd standing in entry queues (matches the heatmap's
# "queue corridors" zone share so both features tell the same story).
QUEUE_SHARE_OF_PREMISES = 0.34


class GateWait(BaseModel):
    id: str
    name_en: str
    name_ta: str
    is_open: bool
    throughput_per_min: int
    queue_people: int
    wait_minutes: int
    status: str
    status_color: str


class QueueEstimateOut(BaseModel):
    generated_at: str
    expected_now: int
    live_in_frame: int
    queue_total: int
    open_gate_count: int
    total_throughput_per_min: int
    gates: List[GateWait]
    recommended_gate_id: str | None = None
    recommended_gate_en: str | None = None
    recommended_gate_ta: str | None = None
    recommended_wait: int | None = None


def _wait_band(wait_minutes: int) -> tuple[str, str]:
    """Classify a per-gate wait time into a status band + colour."""
    if wait_minutes <= 8:
        return "Low", "green"
    if wait_minutes <= 20:
        return "Moderate", "yellow"
    return "High", "red"


def _expected_now() -> int:
    """Current premises occupancy from the forecast, with an open-hours floor."""
    from ..routers.crowd import dashboard as crowd_dashboard

    cd = crowd_dashboard()
    expected = int(cd.current_visitors)
    now = datetime.now()
    if 5 <= now.hour <= 21:  # keep a realistic steady presence during open hours
        expected = max(expected, int(cd.capacity * 0.35))
    return expected


def _live_in_frame() -> int:
    """Best-effort live webcam in-frame count; 0 when the camera is off/absent."""
    try:
        from ..services.crowd_service import get_crowd_service

        return int(get_crowd_service().get_live().get("in_frame", 0))
    except Exception:  # vision extras missing / camera not running
        return 0


@router.get("", response_model=QueueEstimateOut, summary="Live queue wait time per entry gate")
def queue_estimate(
    open: str | None = Query(
        default=None,
        description="Comma-separated open gate ids (e.g. 'north,east'). Defaults to all open.",
    ),
) -> QueueEstimateOut:
    """Estimate real-time queue wait time per gate and recommend a redirect gate."""
    logger.info("GET /api/v1/queue?open=%s", open)

    valid_ids = {g[0] for g in GATES}
    if open is not None:
        requested = {s.strip().lower() for s in open.split(",") if s.strip()}
        open_ids = {gid for gid in requested if gid in valid_ids}
    else:
        open_ids = set(valid_ids)
    if not open_ids:  # never leave the temple with zero open gates
        open_ids = set(valid_ids)

    in_frame = _live_in_frame()
    expected_now = _expected_now()
    queue_total = int(round(expected_now * QUEUE_SHARE_OF_PREMISES)) + in_frame

    # Redistribute closed gates' arrival shares across the open gates.
    open_share_sum = sum(share for gid, *_rest, share in GATES if gid in open_ids) or 1.0

    gates: List[GateWait] = []
    for gid, name_en, name_ta, throughput, share in GATES:
        is_open = gid in open_ids
        if is_open:
            norm_share = share / open_share_sum
            queue_people = int(round(queue_total * norm_share))
            wait_minutes = int(round(queue_people / throughput)) if throughput else 0
            status, color = _wait_band(wait_minutes)
        else:
            queue_people = 0
            wait_minutes = 0
            status, color = "Closed", "stone"
        gates.append(
            GateWait(
                id=gid,
                name_en=name_en,
                name_ta=name_ta,
                is_open=is_open,
                throughput_per_min=throughput,
                queue_people=queue_people,
                wait_minutes=wait_minutes,
                status=status,
                status_color=color,
            )
        )

    open_gates = [g for g in gates if g.is_open]
    best = min(open_gates, key=lambda g: g.wait_minutes) if open_gates else None

    return QueueEstimateOut(
        generated_at=datetime.now().isoformat(timespec="seconds"),
        expected_now=expected_now,
        live_in_frame=in_frame,
        queue_total=queue_total,
        open_gate_count=len(open_gates),
        total_throughput_per_min=sum(g.throughput_per_min for g in open_gates),
        gates=gates,
        recommended_gate_id=best.id if best else None,
        recommended_gate_en=best.name_en if best else None,
        recommended_gate_ta=best.name_ta if best else None,
        recommended_wait=best.wait_minutes if best else None,
    )

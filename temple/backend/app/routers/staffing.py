"""Staff Deployment Recommender.

From the footfall forecast for the next N hours (default 6), recommend exact
staffing per role and location, merged into shift blocks — e.g. "Deploy 4 queue
marshals at North Gate from 9 AM to 11 AM, reduce to 2 after noon".

Model
-----
For each upcoming hour we read the expected premises occupancy ``E`` from the
same forecast the crowd dashboard / heatmap use, then size each role from
simple, transparent ratios (1 marshal per ~40 people queued, 1 guard per ~150
on premises, etc.). Adjacent hours with the same headcount for a given
role+location are merged into a single block, which is what produces the
natural "from X to Y" shift schedule. The frontend exports it as a PDF.

Mounted at ``/api/v1/staffing``; purely computational (no vision deps).
"""

from __future__ import annotations

import logging
import math
from dataclasses import dataclass
from datetime import datetime
from typing import Callable, List

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from .crowd import CAPACITY, _band as crowd_band, dashboard as crowd_dashboard

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/staffing", tags=["staffing"])

# Gate arrival shares (match the queue-wait estimator so the two features agree).
GATE_SHARES = [
    ("north", "North Gate", "வடக்கு வாயில்", 0.34),
    ("east", "East Gate", "கிழக்கு வாயில்", 0.30),
    ("south", "South Gate", "தெற்கு வாயில்", 0.22),
    ("west", "West Gate", "மேற்கு வாயில்", 0.14),
]

QUEUE_SHARE = 0.34   # crowd standing in entry queues (heatmap "queue corridors")
PRASAD_SHARE = 0.16  # crowd at prasad counters (heatmap "prasad" zone)
PARKING_SHARE = 0.20  # crowd in/around parking (heatmap "parking" zone)


@dataclass
class StaffAssignment:
    role_id: str
    role_en: str
    role_ta: str
    location_id: str
    location_en: str
    location_ta: str
    fn: Callable[[float], int]


def _marshal_fn(share: float) -> Callable[[float], int]:
    # 1 queue marshal per ~40 devotees queued at this gate (min 1 when open).
    return lambda e: max(1, math.ceil(e * QUEUE_SHARE * share / 40)) if e > 0 else 0


def _build_assignments() -> List[StaffAssignment]:
    items: List[StaffAssignment] = []
    for gid, en, ta, share in GATE_SHARES:
        items.append(
            StaffAssignment(
                role_id="marshal",
                role_en="Queue Marshals",
                role_ta="வரிசை மேற்பார்வையாளர்கள்",
                location_id=gid,
                location_en=en,
                location_ta=ta,
                fn=_marshal_fn(share),
            )
        )
    items.append(
        StaffAssignment(
            role_id="security", role_en="Security Guards", role_ta="பாதுகாப்பு காவலர்கள்",
            location_id="premises", location_en="Temple Premises", location_ta="கோயில் வளாகம்",
            fn=lambda e: max(4, math.ceil(e / 150)) if e > 0 else 1,
        )
    )
    items.append(
        StaffAssignment(
            role_id="prasad", role_en="Prasad Counter Staff", role_ta="பிரசாத கவுண்டர் ஊழியர்கள்",
            location_id="prasad", location_en="Prasad Counters", location_ta="பிரசாத கவுண்டர்கள்",
            fn=lambda e: max(2, math.ceil(e * PRASAD_SHARE / 50)) if e > 0 else 0,
        )
    )
    items.append(
        StaffAssignment(
            role_id="parking", role_en="Parking Attendants", role_ta="வாகன நிறுத்த உதவியாளர்கள்",
            location_id="parking", location_en="Parking", location_ta="வாகன நிறுத்தம்",
            # ~5 devotees per vehicle, 1 attendant per ~25 vehicles.
            fn=lambda e: max(2, math.ceil(e * PARKING_SHARE / 5 / 25)) if e > 0 else 1,
        )
    )
    items.append(
        StaffAssignment(
            role_id="help", role_en="Help / Info Desk", role_ta="உதவி / தகவல் மையம்",
            location_id="entrance", location_en="Main Entrance", location_ta="முதன்மை நுழைவு",
            fn=lambda e: (3 if e > 800 else 2) if e > 0 else 1,
        )
    )
    items.append(
        StaffAssignment(
            role_id="medical", role_en="Medical / First Aid", role_ta="மருத்துவம் / முதலுதவி",
            location_id="medical", location_en="Medical Post", location_ta="மருத்துவ நிலையம்",
            fn=lambda e: 2 if e > 1000 else 1,
        )
    )
    return items


ASSIGNMENTS = _build_assignments()


class ShiftBlock(BaseModel):
    role_id: str
    role_en: str
    role_ta: str
    location_id: str
    location_en: str
    location_ta: str
    start_hour: int
    end_hour: int
    start_label: str
    end_label: str
    count: int
    expected_peak: int
    band: str


class HourlyPoint(BaseModel):
    hour: int
    label: str
    expected: int
    band: str
    total_staff: int


class StaffingOut(BaseModel):
    generated_at: str
    horizon_hours: int
    current_total_staff: int
    peak_total_staff: int
    peak_hour_label: str
    blocks: List[ShiftBlock]
    hourly: List[HourlyPoint]


def _hour_label(hour: int) -> str:
    """12-hour clock label for an hour-of-day (0–24), e.g. 9 -> '9 AM'."""
    h = hour % 24
    suffix = "AM" if h < 12 else "PM"
    h12 = h % 12 or 12
    return f"{h12} {suffix}"


def _expected_by_hour() -> dict[int, int]:
    cd = crowd_dashboard()
    return {p.hour: int(p.expected) for p in cd.today_hourly}


@router.get("", response_model=StaffingOut, summary="Recommended staff deployment for the next N hours")
def staffing(hours: int = Query(default=6, ge=1, le=12)) -> StaffingOut:
    """Recommend exact staffing per role/location for the next ``hours`` hours."""
    logger.info("GET /api/v1/staffing?hours=%s", hours)
    if not 1 <= hours <= 12:
        raise HTTPException(status_code=400, detail="hours must be between 1 and 12")

    now = datetime.now()
    expected_map = _expected_by_hour()
    horizon = [(now.hour + i) % 24 for i in range(hours)]
    # Outside open hours (05:00–21:00) the temple is shut → expected 0.
    expected = [expected_map.get(h, 0) for h in horizon]

    # Per-hour staff totals + the hourly summary.
    hourly: List[HourlyPoint] = []
    per_hour_total: List[int] = []
    for h, e in zip(horizon, expected):
        total = sum(a.fn(e) for a in ASSIGNMENTS)
        per_hour_total.append(total)
        hourly.append(
            HourlyPoint(
                hour=h,
                label=_hour_label(h),
                expected=e,
                band=crowd_band(e / CAPACITY) if e > 0 else "Closed",
                total_staff=total,
            )
        )

    # Merge adjacent equal-headcount hours per assignment into shift blocks.
    blocks: List[ShiftBlock] = []
    for a in ASSIGNMENTS:
        counts = [a.fn(e) for e in expected]
        i = 0
        n = len(counts)
        while i < n:
            c = counts[i]
            j = i
            while j + 1 < n and counts[j + 1] == c:
                j += 1
            if c > 0:  # skip stretches needing nobody
                peak_e = max(expected[i : j + 1])
                blocks.append(
                    ShiftBlock(
                        role_id=a.role_id,
                        role_en=a.role_en,
                        role_ta=a.role_ta,
                        location_id=a.location_id,
                        location_en=a.location_en,
                        location_ta=a.location_ta,
                        start_hour=horizon[i],
                        end_hour=(horizon[j] + 1) % 24,
                        start_label=_hour_label(horizon[i]),
                        end_label=_hour_label(horizon[j] + 1),
                        count=c,
                        expected_peak=peak_e,
                        band=crowd_band(peak_e / CAPACITY) if peak_e > 0 else "Closed",
                    )
                )
            i = j + 1

    peak_idx = max(range(len(per_hour_total)), key=lambda k: per_hour_total[k]) if per_hour_total else 0
    return StaffingOut(
        generated_at=now.isoformat(timespec="seconds"),
        horizon_hours=hours,
        current_total_staff=per_hour_total[0] if per_hour_total else 0,
        peak_total_staff=max(per_hour_total) if per_hour_total else 0,
        peak_hour_label=_hour_label(horizon[peak_idx]) if horizon else "",
        blocks=blocks,
        hourly=hourly,
    )

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Booking, CCTVCount, ParkingLot, VehicleEntry
from ..schemas import FinalReport

router = APIRouter(prefix="/final-report", tags=["final-report"])

PEOPLE_PER_VEHICLE = {"bike": 1.5, "car": 3.5, "bus": 25.0, "auto": 2.0}


@router.get("", response_model=FinalReport)
def final_report(db: Session = Depends(get_db)) -> FinalReport:
    by_type_rows = (
        db.query(VehicleEntry.vehicle_type, func.count(VehicleEntry.id))
        .filter(VehicleEntry.exited_at.is_(None))
        .group_by(VehicleEntry.vehicle_type)
        .all()
    )
    parking_people = int(round(sum(int(n) * PEOPLE_PER_VEHICLE.get(vt, 0.0) for vt, n in by_type_rows)))

    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    cctv_rows = db.query(CCTVCount).filter(CCTVCount.recorded_at >= today_start).all()
    cctv_people = sum(r.people_count for r in cctv_rows) if cctv_rows else 0

    booking_devotees = (
        db.query(func.coalesce(func.sum(Booking.devotees), 0))
        .filter(Booking.booking_date == today, Booking.status != "cancelled")
        .scalar()
        or 0
    )

    overall = parking_people + int(cctv_people) + int(booking_devotees)

    hour_buckets: dict[int, int] = {}
    for r in cctv_rows:
        hour_buckets[r.recorded_at.hour] = hour_buckets.get(r.recorded_at.hour, 0) + r.people_count
    if hour_buckets:
        peak_hour = max(hour_buckets, key=hour_buckets.get)
        peak_total = hour_buckets[peak_hour]
    else:
        peak_hour, peak_total = 18, 0

    capacity = (
        db.query(
            func.coalesce(
                func.sum(
                    ParkingLot.capacity_car
                    + ParkingLot.capacity_bike
                    + ParkingLot.capacity_bus
                    + ParkingLot.capacity_auto
                ),
                0,
            )
        ).scalar()
        or 0
    )

    summary: list[str] = []
    summary.append(
        f"Combined crowd estimate is approximately {overall:,} people across parking, CCTV detection and confirmed bookings."
    )
    if hour_buckets:
        summary.append(f"Peak hour today is {peak_hour:02d}:00 with {peak_total:,} detected.")
    if capacity:
        currently_parked = sum(int(n) for _, n in by_type_rows)
        summary.append(
            f"Parking is at {round(currently_parked / capacity * 100, 1)}% capacity ({currently_parked} of {capacity})."
        )
    if booking_devotees:
        summary.append(f"{int(booking_devotees)} devotees are confirmed via booking for today.")

    return FinalReport(
        parking_people=parking_people,
        cctv_people=int(cctv_people),
        booking_devotees=int(booking_devotees),
        overall_total_crowd=overall,
        peak_hour=peak_hour,
        peak_hour_total=peak_total,
        summary=summary,
    )

from datetime import datetime
from secrets import token_hex

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user, get_optional_user
from ..models import ParkingLot, User, VehicleEntry
from ..schemas import (
    ParkingCounts,
    ParkingLotOut,
    ParkingLotStatus,
    ParkingStats,
    VEHICLE_TYPES,
    VehicleEntryCreate,
    VehicleEntryOut,
)

PEOPLE_PER_VEHICLE = {"bike": 1.5, "car": 3.5, "bus": 25.0, "auto": 2.0}

router = APIRouter(prefix="/parking", tags=["parking"])


def _capacity_for(lot: ParkingLot, vt: str) -> int:
    return getattr(lot, f"capacity_{vt}")


def _occupied_counts(db: Session, lot_id: int) -> dict[str, int]:
    rows = (
        db.query(VehicleEntry.vehicle_type, func.count(VehicleEntry.id))
        .filter(VehicleEntry.lot_id == lot_id, VehicleEntry.exited_at.is_(None))
        .group_by(VehicleEntry.vehicle_type)
        .all()
    )
    return {vt: 0 for vt in VEHICLE_TYPES} | {row[0]: int(row[1]) for row in rows}


def _build_status(db: Session, lot: ParkingLot) -> ParkingLotStatus:
    occ = _occupied_counts(db, lot.id)
    occupied = ParkingCounts(**{vt: occ.get(vt, 0) for vt in VEHICLE_TYPES})
    available = ParkingCounts(
        **{vt: max(0, _capacity_for(lot, vt) - occ.get(vt, 0)) for vt in VEHICLE_TYPES}
    )
    total_cap = sum(_capacity_for(lot, vt) for vt in VEHICLE_TYPES)
    total_occ = sum(occ.values())
    return ParkingLotStatus(
        lot=ParkingLotOut.model_validate(lot),
        occupied=occupied,
        available=available,
        total_capacity=total_cap,
        total_occupied=total_occ,
        total_available=max(0, total_cap - total_occ),
        occupancy_pct=round((total_occ / total_cap) * 100.0, 1) if total_cap else 0.0,
    )


@router.get("/stats", response_model=ParkingStats)
def overall_stats(db: Session = Depends(get_db)) -> ParkingStats:
    entered = db.query(func.count(VehicleEntry.id)).scalar() or 0

    by_type_rows = (
        db.query(VehicleEntry.vehicle_type, func.count(VehicleEntry.id))
        .filter(VehicleEntry.exited_at.is_(None))
        .group_by(VehicleEntry.vehicle_type)
        .all()
    )
    by_type = {vt: 0 for vt in VEHICLE_TYPES}
    for vt, n in by_type_rows:
        by_type[vt] = int(n)

    cap_rows = db.query(
        func.coalesce(func.sum(ParkingLot.capacity_car), 0),
        func.coalesce(func.sum(ParkingLot.capacity_bike), 0),
        func.coalesce(func.sum(ParkingLot.capacity_bus), 0),
        func.coalesce(func.sum(ParkingLot.capacity_auto), 0),
    ).first()
    by_type_capacity = {
        "car": int(cap_rows[0]),
        "bike": int(cap_rows[1]),
        "bus": int(cap_rows[2]),
        "auto": int(cap_rows[3]),
    }
    total_capacity = sum(by_type_capacity.values())

    currently_parked = sum(by_type.values())
    estimated_people = int(round(sum(by_type[vt] * PEOPLE_PER_VEHICLE[vt] for vt in VEHICLE_TYPES)))

    occupancy = (currently_parked / total_capacity * 100.0) if total_capacity else 0.0
    if occupancy < 70:
        s, color = "Comfortable", "green"
    elif occupancy < 90:
        s, color = "Filling up", "yellow"
    else:
        s, color = "Almost full", "red"

    return ParkingStats(
        vehicles_entered=int(entered),
        currently_parked=currently_parked,
        by_type=by_type,
        by_type_capacity=by_type_capacity,
        total_capacity=total_capacity,
        available_slots=max(0, total_capacity - currently_parked),
        estimated_people=estimated_people,
        occupancy_pct=round(occupancy, 1),
        status=s,
        status_color=color,
    )


@router.get("/lots", response_model=list[ParkingLotStatus])
def list_lots(db: Session = Depends(get_db)) -> list[ParkingLotStatus]:
    return [_build_status(db, lot) for lot in db.query(ParkingLot).order_by(ParkingLot.name_en).all()]


@router.get("/lots/{slug}", response_model=ParkingLotStatus)
def get_lot(slug: str, db: Session = Depends(get_db)) -> ParkingLotStatus:
    lot = db.query(ParkingLot).filter(ParkingLot.slug == slug).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found")
    return _build_status(db, lot)


@router.post("/entry", response_model=VehicleEntryOut, status_code=status.HTTP_201_CREATED)
def register_entry(
    payload: VehicleEntryCreate,
    user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
) -> VehicleEntry:
    lot = db.get(ParkingLot, payload.lot_id)
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found")

    plate = payload.vehicle_number.strip().upper().replace(" ", "")

    already = (
        db.query(VehicleEntry)
        .filter(
            VehicleEntry.vehicle_number == plate,
            VehicleEntry.exited_at.is_(None),
        )
        .first()
    )
    if already:
        raise HTTPException(status_code=409, detail="Vehicle is already inside the temple premises")

    occ = _occupied_counts(db, lot.id)
    cap = _capacity_for(lot, payload.vehicle_type)
    if occ.get(payload.vehicle_type, 0) + 1 > cap:
        raise HTTPException(status_code=409, detail=f"This lot is full for {payload.vehicle_type}")

    entry = VehicleEntry(
        lot_id=lot.id,
        user_id=user.id if user else None,
        vehicle_number=plate,
        vehicle_type=payload.vehicle_type,
        owner_name=payload.owner_name.strip(),
        contact=payload.contact.strip(),
        reference=f"AAL-V-{token_hex(4).upper()}",
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.post("/exit/{entry_id}", response_model=VehicleEntryOut)
def register_exit(entry_id: int, db: Session = Depends(get_db)) -> VehicleEntry:
    entry = db.get(VehicleEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    if entry.exited_at is not None:
        raise HTTPException(status_code=409, detail="Vehicle has already exited")
    entry.exited_at = datetime.utcnow()
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/active", response_model=list[VehicleEntryOut])
def active_vehicles(
    lot_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[VehicleEntry]:
    q = db.query(VehicleEntry).filter(VehicleEntry.exited_at.is_(None))
    if lot_id is not None:
        q = q.filter(VehicleEntry.lot_id == lot_id)
    return q.order_by(VehicleEntry.entered_at.desc()).limit(60).all()


@router.get("/me", response_model=list[VehicleEntryOut])
def my_vehicles(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[VehicleEntry]:
    return (
        db.query(VehicleEntry)
        .filter(VehicleEntry.user_id == user.id)
        .order_by(VehicleEntry.entered_at.desc())
        .limit(40)
        .all()
    )

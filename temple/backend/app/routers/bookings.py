from datetime import date as date_type
from secrets import token_hex

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Booking, SevaSlot, User
from ..schemas import (
    BookingCreate,
    BookingDailyPoint,
    BookingOut,
    BookingSlotStats,
    BookingStats,
    CheckoutIntent,
    SevaSlotOut,
)

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.get("/stats", response_model=BookingStats)
def booking_stats(db: Session = Depends(get_db)) -> BookingStats:
    total = db.query(func.count(Booking.id)).scalar() or 0
    devotees = db.query(func.coalesce(func.sum(Booking.devotees), 0)).scalar() or 0

    rows = (
        db.query(SevaSlot.starts_at, func.count(Booking.id))
        .join(Booking, Booking.seva_id == SevaSlot.id)
        .filter(Booking.status != "cancelled")
        .group_by(SevaSlot.id)
        .all()
    )
    morning = afternoon = evening = 0
    for starts_at, count in rows:
        h = starts_at.hour
        if h < 12:
            morning += int(count)
        elif h < 16:
            afternoon += int(count)
        else:
            evening += int(count)

    daily_rows = (
        db.query(Booking.booking_date, func.count(Booking.id))
        .group_by(Booking.booking_date)
        .order_by(Booking.booking_date.desc())
        .limit(14)
        .all()
    )
    by_day = [
        BookingDailyPoint(date=str(d), count=int(c))
        for d, c in sorted(daily_rows, key=lambda r: r[0])
    ]

    return BookingStats(
        total_bookings=int(total),
        total_devotees=int(devotees),
        by_slot=BookingSlotStats(morning=morning, afternoon=afternoon, evening=evening),
        by_day=by_day,
    )


@router.get("/sevas", response_model=list[SevaSlotOut])
def list_sevas(db: Session = Depends(get_db)) -> list[SevaSlot]:
    return db.query(SevaSlot).order_by(SevaSlot.starts_at).all()


@router.get("/sevas/{seva_id}/availability")
def availability(
    seva_id: int,
    on: date_type,
    db: Session = Depends(get_db),
) -> dict:
    seva = db.get(SevaSlot, seva_id)
    if not seva:
        raise HTTPException(status_code=404, detail="Seva not found")

    booked = (
        db.query(func.coalesce(func.sum(Booking.devotees), 0))
        .filter(Booking.seva_id == seva_id, Booking.booking_date == on, Booking.status != "cancelled")
        .scalar()
    )
    return {
        "seva_id": seva_id,
        "date": on.isoformat(),
        "capacity": seva.capacity,
        "booked": int(booked or 0),
        "available": max(0, seva.capacity - int(booked or 0)),
    }


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Booking:
    if payload.booking_date < date_type.today():
        raise HTTPException(status_code=400, detail="Booking date cannot be in the past")

    seva = db.get(SevaSlot, payload.seva_id)
    if not seva:
        raise HTTPException(status_code=404, detail="Seva not found")

    booked = (
        db.query(func.coalesce(func.sum(Booking.devotees), 0))
        .filter(
            Booking.seva_id == payload.seva_id,
            Booking.booking_date == payload.booking_date,
            Booking.status != "cancelled",
        )
        .scalar()
    )
    if int(booked or 0) + payload.devotees > seva.capacity:
        raise HTTPException(status_code=409, detail="Slot is full for this date")

    booking = Booking(
        user_id=user.id,
        seva_id=seva.id,
        booking_date=payload.booking_date,
        devotees=payload.devotees,
        amount_inr=seva.price_inr * payload.devotees,
        reference=f"AAL-B-{token_hex(4).upper()}",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.get("/me", response_model=list[BookingOut])
def my_bookings(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Booking]:
    return (
        db.query(Booking)
        .filter(Booking.user_id == user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )


@router.post("/{booking_id}/checkout", response_model=CheckoutIntent)
def checkout(
    booking_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CheckoutIntent:
    booking = db.get(Booking, booking_id)
    if not booking or booking.user_id != user.id:
        raise HTTPException(status_code=404, detail="Booking not found")

    return CheckoutIntent(
        reference=booking.reference,
        amount_inr=booking.amount_inr,
        provider_order_id=f"order_{token_hex(8)}",
    )

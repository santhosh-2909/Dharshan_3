from datetime import datetime, date, time
from sqlalchemy import String, Integer, Float, Date, Time, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    bookings: Mapped[list["Booking"]] = relationship(back_populates="user")
    donations: Mapped[list["Donation"]] = relationship(back_populates="user")
    feedback: Mapped[list["Feedback"]] = relationship(back_populates="user")


class TempleInfo(Base):
    __tablename__ = "temple_info"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    name_en: Mapped[str] = mapped_column(String(160))
    name_ta: Mapped[str] = mapped_column(String(160))
    deity_en: Mapped[str] = mapped_column(String(120))
    deity_ta: Mapped[str] = mapped_column(String(120))
    location: Mapped[str] = mapped_column(String(200))
    history: Mapped[str] = mapped_column(Text)
    architecture: Mapped[str] = mapped_column(Text)
    timings_morning: Mapped[str] = mapped_column(String(80))
    timings_evening: Mapped[str] = mapped_column(String(80))
    rituals: Mapped[str] = mapped_column(Text)
    image_url: Mapped[str] = mapped_column(String(400), default="")


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True)
    title_en: Mapped[str] = mapped_column(String(200))
    title_ta: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    starts_on: Mapped[date] = mapped_column(Date, index=True)
    ends_on: Mapped[date] = mapped_column(Date)
    category: Mapped[str] = mapped_column(String(60))
    is_festival: Mapped[bool] = mapped_column(Boolean, default=False)


class SevaSlot(Base):
    __tablename__ = "seva_slots"

    id: Mapped[int] = mapped_column(primary_key=True)
    name_en: Mapped[str] = mapped_column(String(160))
    name_ta: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text)
    price_inr: Mapped[float] = mapped_column(Float)
    capacity: Mapped[int] = mapped_column(Integer, default=50)
    starts_at: Mapped[time] = mapped_column(Time)
    duration_min: Mapped[int] = mapped_column(Integer, default=30)


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    seva_id: Mapped[int] = mapped_column(ForeignKey("seva_slots.id"))
    booking_date: Mapped[date] = mapped_column(Date, index=True)
    devotees: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(20), default="confirmed")
    reference: Mapped[str] = mapped_column(String(40), unique=True)
    amount_inr: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[User] = relationship(back_populates="bookings")
    seva: Mapped[SevaSlot] = relationship()


class Donation(Base):
    __tablename__ = "donations"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    donor_name: Mapped[str] = mapped_column(String(160))
    purpose: Mapped[str] = mapped_column(String(120))
    amount_inr: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    reference: Mapped[str] = mapped_column(String(40), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[User | None] = relationship(back_populates="donations")


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(160))
    rating: Mapped[int] = mapped_column(Integer)
    message: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[User | None] = relationship(back_populates="feedback")


class ParkingLot(Base):
    __tablename__ = "parking_lots"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    name_en: Mapped[str] = mapped_column(String(160))
    name_ta: Mapped[str] = mapped_column(String(160))
    location: Mapped[str] = mapped_column(String(200))
    capacity_car: Mapped[int] = mapped_column(Integer, default=0)
    capacity_bike: Mapped[int] = mapped_column(Integer, default=0)
    capacity_bus: Mapped[int] = mapped_column(Integer, default=0)
    capacity_auto: Mapped[int] = mapped_column(Integer, default=0)


class VehicleEntry(Base):
    __tablename__ = "vehicle_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    lot_id: Mapped[int] = mapped_column(ForeignKey("parking_lots.id"), index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    vehicle_number: Mapped[str] = mapped_column(String(20), index=True)
    vehicle_type: Mapped[str] = mapped_column(String(16))
    owner_name: Mapped[str] = mapped_column(String(160))
    contact: Mapped[str] = mapped_column(String(40), default="")
    reference: Mapped[str] = mapped_column(String(40), unique=True)
    entered_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    exited_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    lot: Mapped[ParkingLot] = relationship()


class FootfallHistory(Base):
    __tablename__ = "footfall_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    occurred_on: Mapped[date] = mapped_column(Date, unique=True, index=True)
    footfall: Mapped[int] = mapped_column(Integer)
    is_festival: Mapped[bool] = mapped_column(Boolean, default=False)
    festival_name: Mapped[str] = mapped_column(String(120), default="")
    weekday: Mapped[int] = mapped_column(Integer)        # 0=Mon
    year: Mapped[int] = mapped_column(Integer, index=True)
    month: Mapped[int] = mapped_column(Integer)


class CCTVCount(Base):
    __tablename__ = "cctv_counts"

    id: Mapped[int] = mapped_column(primary_key=True)
    camera_id: Mapped[str] = mapped_column(String(40), default="main")
    recorded_at: Mapped[datetime] = mapped_column(DateTime, index=True, default=datetime.utcnow)
    people_count: Mapped[int] = mapped_column(Integer)


class FAQ(Base):
    __tablename__ = "faq"

    id: Mapped[int] = mapped_column(primary_key=True)
    question_en: Mapped[str] = mapped_column(String(400))
    question_ta: Mapped[str] = mapped_column(String(400))
    answer_en: Mapped[str] = mapped_column(Text)
    answer_ta: Mapped[str] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class ZoneMapping(Base):
    __tablename__ = "zone_mappings"

    id: Mapped[int] = mapped_column(primary_key=True)
    zone_name: Mapped[str] = mapped_column(String(80))
    camera_id: Mapped[str] = mapped_column(String(40))
    zone_type: Mapped[str] = mapped_column(String(40))
    x_pct: Mapped[float] = mapped_column(Float)
    y_pct: Mapped[float] = mapped_column(Float)
    width_pct: Mapped[float] = mapped_column(Float)
    height_pct: Mapped[float] = mapped_column(Float)


class EntryGate(Base):
    __tablename__ = "entry_gates"

    id: Mapped[int] = mapped_column(primary_key=True)
    name_en: Mapped[str] = mapped_column(String(120))
    name_ta: Mapped[str] = mapped_column(String(120))
    slug: Mapped[str] = mapped_column(String(40), unique=True)
    throughput_per_min: Mapped[int] = mapped_column(Integer, default=8)
    is_open: Mapped[bool] = mapped_column(Boolean, default=True)


class AnomalyAlert(Base):
    __tablename__ = "anomaly_alerts"

    id: Mapped[int] = mapped_column(primary_key=True)
    detected_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    alert_type: Mapped[str] = mapped_column(String(40))
    message: Mapped[str] = mapped_column(String(500))
    severity: Mapped[str] = mapped_column(String(20))
    actual_value: Mapped[int] = mapped_column(Integer)
    expected_value: Mapped[int] = mapped_column(Integer)
    deviation_pct: Mapped[float] = mapped_column(Float)
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False)

from datetime import date, datetime, time
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(ORMModel):
    id: int
    email: EmailStr
    name: str
    is_admin: bool


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TempleInfoOut(ORMModel):
    id: int
    slug: str
    name_en: str
    name_ta: str
    deity_en: str
    deity_ta: str
    location: str
    history: str
    architecture: str
    timings_morning: str
    timings_evening: str
    rituals: str
    image_url: str


class EventOut(ORMModel):
    id: int
    title_en: str
    title_ta: str
    description: str
    starts_on: date
    ends_on: date
    category: str
    is_festival: bool


class SevaSlotOut(ORMModel):
    id: int
    name_en: str
    name_ta: str
    description: str
    price_inr: float
    capacity: int
    starts_at: time
    duration_min: int


class BookingCreate(BaseModel):
    seva_id: int
    booking_date: date
    devotees: int = Field(ge=1, le=20)


class BookingOut(ORMModel):
    id: int
    seva_id: int
    booking_date: date
    devotees: int
    status: str
    reference: str
    amount_inr: float
    created_at: datetime


class DonationCreate(BaseModel):
    donor_name: str = Field(min_length=2, max_length=160)
    purpose: str = Field(max_length=120)
    amount_inr: float = Field(gt=0)


class DonationOut(ORMModel):
    id: int
    donor_name: str
    purpose: str
    amount_inr: float
    status: str
    reference: str
    created_at: datetime


class CheckoutIntent(BaseModel):
    reference: str
    amount_inr: float
    provider: str = "razorpay"
    provider_order_id: str
    next_action: str = "redirect_to_provider"


class FeedbackCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    rating: int = Field(ge=1, le=5)
    message: str = Field(min_length=4, max_length=2000)


class FeedbackOut(ORMModel):
    id: int
    name: str
    rating: int
    message: str
    created_at: datetime


class FAQOut(ORMModel):
    id: int
    question_en: str
    question_ta: str
    answer_en: str
    answer_ta: str
    sort_order: int


VEHICLE_TYPES = ("car", "bike", "bus", "auto")


class ParkingLotOut(ORMModel):
    id: int
    slug: str
    name_en: str
    name_ta: str
    location: str
    capacity_car: int
    capacity_bike: int
    capacity_bus: int
    capacity_auto: int


class ParkingCounts(BaseModel):
    car: int = 0
    bike: int = 0
    bus: int = 0
    auto: int = 0


class ParkingLotStatus(BaseModel):
    lot: ParkingLotOut
    occupied: ParkingCounts
    available: ParkingCounts
    total_capacity: int
    total_occupied: int
    total_available: int
    occupancy_pct: float


class VehicleEntryCreate(BaseModel):
    lot_id: int
    vehicle_number: str = Field(min_length=2, max_length=20)
    vehicle_type: str = Field(pattern="^(car|bike|bus|auto)$")
    owner_name: str = Field(min_length=2, max_length=160)
    contact: str = Field(default="", max_length=40)


class VehicleEntryOut(ORMModel):
    id: int
    lot_id: int
    vehicle_number: str
    vehicle_type: str
    owner_name: str
    contact: str
    reference: str
    entered_at: datetime
    exited_at: datetime | None = None


class ParkingStats(BaseModel):
    vehicles_entered: int
    currently_parked: int
    by_type: dict[str, int]
    by_type_capacity: dict[str, int]
    total_capacity: int
    available_slots: int
    estimated_people: int
    occupancy_pct: float
    status: str
    status_color: str


class BookingSlotStats(BaseModel):
    morning: int
    afternoon: int
    evening: int


class BookingDailyPoint(BaseModel):
    date: str
    count: int


class BookingStats(BaseModel):
    total_bookings: int
    total_devotees: int
    by_slot: BookingSlotStats
    by_day: list[BookingDailyPoint]


class CCTVHourPoint(BaseModel):
    hour: int
    people_count: int


class CCTVStats(BaseModel):
    total_detected_today: int
    current_count: int
    last_hour: int
    hourly: list[CCTVHourPoint]
    cameras_online: int


class FinalReport(BaseModel):
    parking_people: int
    cctv_people: int
    booking_devotees: int
    overall_total_crowd: int
    peak_hour: int
    peak_hour_total: int
    summary: list[str]


class PredictRequest(BaseModel):
    target_date: date


class PrevYearPoint(BaseModel):
    year: int
    date: date
    footfall: int
    is_festival: bool


class PredictionSuggestions(BaseModel):
    prasadam_servings: int
    prasadam_kg: float
    parking_slots_needed: int
    staff_required: int


class PredictResponse(BaseModel):
    target_date: date
    weekday: str
    is_festival: bool
    festival_name: str
    predicted_crowd: int
    confidence_low: int
    confidence_high: int
    level: str
    level_color: str
    method: str
    weighted_baseline: int
    seasonal_factor: float
    festival_factor: float
    trend_factor: float
    prev_years: list[PrevYearPoint]
    suggestions: PredictionSuggestions
    notes: list[str]


class CrowdHourPoint(BaseModel):
    hour: int
    expected: int
    band: str


class CrowdForecastDay(BaseModel):
    date: date
    weekday: str
    expected_visitors: int
    band: str
    peak_hour: int


class CrowdDashboard(BaseModel):
    current_visitors: int
    capacity: int
    occupancy_pct: float
    band: str
    today_hourly: list[CrowdHourPoint]
    next_seven_days: list[CrowdForecastDay]


# ── Feature 1: Zone Heatmap ──────────────────────────────────────────────

class ZoneHeatmapItem(BaseModel):
    zone_name: str
    zone_type: str
    camera_id: str
    x_pct: float
    y_pct: float
    width_pct: float
    height_pct: float
    people_count: int
    density_pct: float
    band: str


# ── Feature 2: Festival Surge Predictor ───────────────────────────────────

class FestivalSurge(BaseModel):
    event_id: int
    title_en: str
    title_ta: str
    starts_on: date
    days_away: int
    normal_footfall: int
    predicted_footfall: int
    surge_pct: float
    risk_level: str


# ── Feature 3: Queue Wait Time Estimator ─────────────────────────────────

class GateWaitTime(BaseModel):
    gate_id: int
    name_en: str
    name_ta: str
    slug: str
    is_open: bool
    throughput_per_min: int
    estimated_wait_min: float
    crowd_at_gate: int
    recommendation: str


# ── Feature 4: Staff Deployment Recommender ───────────────────────────────

class StaffHourRecommendation(BaseModel):
    hour: int
    expected_visitors: int
    queue_marshals: int
    prasad_staff: int
    parking_attendants: int
    security: int
    total: int


class StaffDayPlan(BaseModel):
    date: date
    weekday: str
    peak_hour: int
    peak_staff: int
    total_staff_hours: int
    hourly: list[StaffHourRecommendation]


# ── Feature 5: Anomaly Alerts ─────────────────────────────────────────────

class AlertOut(ORMModel):
    id: int
    detected_at: datetime
    alert_type: str
    message: str
    severity: str
    actual_value: int
    expected_value: int
    deviation_pct: float
    is_resolved: bool


# ── Feature 6: Revenue Analytics ──────────────────────────────────────────

class MonthRevenue(BaseModel):
    month: str
    booking_revenue: float
    donation_revenue: float
    total: float


class SevaRevenue(BaseModel):
    seva_name: str
    count: int
    revenue: float


class CauseRevenue(BaseModel):
    cause: str
    count: int
    revenue: float


class RevenueAnalytics(BaseModel):
    monthly: list[MonthRevenue]
    top_sevas: list[SevaRevenue]
    top_causes: list[CauseRevenue]
    total_booking_revenue: float
    total_donation_revenue: float
    grand_total: float


# ── Feature 7: Optimal Visit Times ───────────────────────────────────────

class OptimalSlot(BaseModel):
    hour: int
    expected_visitors: int
    estimated_wait_min: float
    band: str
    recommendation: str


class OptimalVisitResponse(BaseModel):
    best_slots: list[OptimalSlot]
    avoid_hours: list[int]
    current_band: str
    current_wait_min: float

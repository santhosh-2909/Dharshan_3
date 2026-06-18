from datetime import date, datetime, time, timedelta
from math import pi, sin

from sqlalchemy.orm import Session

from .models import CCTVCount, Event, FAQ, Feedback, FootfallHistory, ParkingLot, SevaSlot, TempleInfo, User
from .security import hash_password


# Approximate Tamil festival days (month, day) — generic year-on-year markers.
# Real Tamil festivals follow the lunar calendar; for a demo, fixed Gregorian
# dates are sufficient and still let the model learn a "festival multiplier".
FESTIVAL_DATES: list[tuple[int, int, str]] = [
    (1, 14, "Pongal"),
    (1, 15, "Maattu Pongal"),
    (1, 23, "Thai Poosam"),
    (2, 26, "Maha Shivaratri"),
    (3, 28, "Panguni Uthiram"),
    (4, 13, "Tamil New Year"),
    (5, 23, "Vaikasi Visakam"),
    (7, 18, "Aadi Pooram"),
    (8, 8, "Aadi Perukku"),
    (10, 31, "Aippasi Pournami"),
    (11, 12, "Diwali"),
    (12, 5, "Karthigai Deepam"),
    (12, 16, "Vaikunta Ekadasi"),
    (12, 25, "Margazhi finale"),
]


def _seed_footfall_history(db: Session) -> None:
    if db.query(FootfallHistory).count() != 0:
        return

    import random

    random.seed(42)  # reproducible seed across cold starts
    today = date.today()
    start = today - timedelta(days=365 * 5 + 10)
    festival_set = {(m, d): name for m, d, name in FESTIVAL_DATES}

    rows: list[FootfallHistory] = []
    cursor = start
    while cursor <= today - timedelta(days=1):
        year_index = cursor.year - start.year   # 0..5
        # Year-over-year trend: ~3% growth a year + a small COVID-era dip
        growth = (1.03 ** year_index)

        # Weekly seasonality — Saturday and Sunday are dominant
        weekday_mult = {0: 0.85, 1: 0.80, 2: 0.85, 3: 0.90, 4: 1.05, 5: 1.45, 6: 1.55}[cursor.weekday()]

        # Monthly seasonality — Margazhi (Dec) and Aadi (Jul) are heavy
        month_mult = {1: 1.10, 2: 0.95, 3: 0.90, 4: 1.00, 5: 1.05,
                      6: 0.95, 7: 1.30, 8: 1.20, 9: 1.00, 10: 1.10,
                      11: 1.15, 12: 1.40}[cursor.month]

        festival_name = festival_set.get((cursor.month, cursor.day), "")
        festival_mult = 2.6 if festival_name else 1.0

        base = 1800
        noise = random.uniform(0.92, 1.10)
        footfall = int(round(base * growth * weekday_mult * month_mult * festival_mult * noise))

        rows.append(
            FootfallHistory(
                occurred_on=cursor,
                footfall=footfall,
                is_festival=bool(festival_name),
                festival_name=festival_name,
                weekday=cursor.weekday(),
                year=cursor.year,
                month=cursor.month,
            )
        )
        cursor += timedelta(days=1)

    db.add_all(rows)


def _seed_cctv(db: Session) -> None:
    if db.query(CCTVCount).count() != 0:
        return
    # Seed today's hourly CCTV samples following a temple-day rhythm:
    # gentle morning peak around 07:00, stronger evening peak around 18:00.
    today = date.today()
    cameras = [("main", 1.0), ("south-gate", 0.7), ("sanctum", 0.45)]
    rows: list[CCTVCount] = []
    for hour in range(5, 22):
        morning = max(0.0, sin((hour - 5) / 6 * pi))
        evening = max(0.0, sin((hour - 16) / 6 * pi)) if hour >= 16 else 0.0
        weight = 0.55 * morning + 0.95 * evening + 0.05
        base_count = int(380 * weight) + 12
        ts = datetime.combine(today, time(hour=hour, minute=0))
        for cam_id, factor in cameras:
            rows.append(CCTVCount(camera_id=cam_id, recorded_at=ts, people_count=int(base_count * factor)))
    db.add_all(rows)


def seed(db: Session) -> None:
    if db.query(TempleInfo).count() == 0:
        db.add_all(
            [
                TempleInfo(
                    slug="meenakshi-amman",
                    name_en="Meenakshi Amman Temple",
                    name_ta="மீனாட்சி அம்மன் கோயில்",
                    deity_en="Goddess Meenakshi & Lord Sundareswarar",
                    deity_ta="மீனாட்சி அம்மன் மற்றும் சுந்தரேசுவரர்",
                    location="Madurai, Tamil Nadu",
                    history=(
                        "Set in the heart of Madurai on the banks of the Vaigai, the Meenakshi Amman temple is "
                        "an ancient seat of Tamil devotion. The present sanctum traces back over a millennium, "
                        "rebuilt in the 16th century under the Nayak dynasty after centuries of patronage by the "
                        "Pandyas, Cholas and Vijayanagar kings."
                    ),
                    architecture=(
                        "Fourteen towering gopurams rise above a 14-acre walled precinct. The Hall of a Thousand "
                        "Pillars, the golden lotus tank and the pillared corridors are masterpieces of Dravidian "
                        "stone craftsmanship."
                    ),
                    timings_morning="05:00 – 12:30",
                    timings_evening="16:00 – 21:30",
                    rituals=(
                        "Daily Aaradhanai is offered six times. The evening Pallakku procession of the deities "
                        "from the sanctum to the bedchamber is a defining experience for devotees."
                    ),
                    image_url="",
                ),
                TempleInfo(
                    slug="brihadeeswarar",
                    name_en="Brihadeeswarar Temple",
                    name_ta="பிரகதீஸ்வரர் கோயில்",
                    deity_en="Lord Shiva (Peruvudaiyar)",
                    deity_ta="பெருவுடையார்",
                    location="Thanjavur, Tamil Nadu",
                    history=(
                        "Commissioned by Rajaraja Chola I in 1010 CE, the temple is a UNESCO World Heritage Site "
                        "and one of the finest expressions of Chola architecture and statecraft."
                    ),
                    architecture=(
                        "A 66-metre vimana of granite crowned by an 80-tonne capstone presides over the precinct. "
                        "Frescoes of dancers and stone friezes depicting Shiva’s many forms run along the inner walls."
                    ),
                    timings_morning="06:00 – 12:30",
                    timings_evening="16:00 – 20:30",
                    rituals=(
                        "Six daily kalams of worship culminate in the evening Arthajama puja. Mahashivaratri and "
                        "Sadayam (Rajaraja’s birth star) are observed with grand processions."
                    ),
                    image_url="",
                ),
            ]
        )

    if db.query(Event).count() == 0:
        today = date.today()
        db.add_all(
            [
                Event(
                    title_en="Aadi Pooram",
                    title_ta="ஆடி பூரம்",
                    description="Celebrating the goddess with floral offerings, processions and Annadhanam.",
                    starts_on=today + timedelta(days=14),
                    ends_on=today + timedelta(days=14),
                    category="Festival",
                    is_festival=True,
                ),
                Event(
                    title_en="Margazhi Bhajan",
                    title_ta="மார்கழி பஜனை",
                    description="Pre-dawn devotional singing through the streets, every day of Margazhi month.",
                    starts_on=today + timedelta(days=2),
                    ends_on=today + timedelta(days=32),
                    category="Daily",
                    is_festival=False,
                ),
                Event(
                    title_en="Float Festival (Theppam)",
                    title_ta="தெப்பத் திருவிழா",
                    description="Decorated rafts carrying the utsava deities are floated across the temple tank.",
                    starts_on=today + timedelta(days=45),
                    ends_on=today + timedelta(days=47),
                    category="Festival",
                    is_festival=True,
                ),
                Event(
                    title_en="Pradosham",
                    title_ta="பிரதோஷம்",
                    description="Twilight worship of Lord Shiva on the trayodashi tithi.",
                    starts_on=today + timedelta(days=5),
                    ends_on=today + timedelta(days=5),
                    category="Observance",
                    is_festival=False,
                ),
                Event(
                    title_en="Panguni Uthiram",
                    title_ta="பங்குனி உத்திரம்",
                    description="Celestial wedding of Lord Sundareswarar and Goddess Meenakshi — the grandest festival of the temple.",
                    starts_on=today + timedelta(days=30),
                    ends_on=today + timedelta(days=30),
                    category="Festival",
                    is_festival=True,
                ),
                Event(
                    title_en="Thai Poosam",
                    title_ta="தைப்பூசம்",
                    description="Auspicious day celebrating Lord Murugan with kavadi attam and devotional processions.",
                    starts_on=today + timedelta(days=55),
                    ends_on=today + timedelta(days=55),
                    category="Festival",
                    is_festival=True,
                ),
                Event(
                    title_en="Maha Shivaratri",
                    title_ta="மகா சிவராத்திரி",
                    description="Night-long vigil honouring Lord Shiva with abhishekam, chanting and fasting.",
                    starts_on=today + timedelta(days=70),
                    ends_on=today + timedelta(days=70),
                    category="Festival",
                    is_festival=True,
                ),
                Event(
                    title_en="Karthigai Deepam",
                    title_ta="கார்த்திகை தீபம்",
                    description="Festival of lights — thousands of oil lamps illuminate the temple corridors and gopurams.",
                    starts_on=today + timedelta(days=90),
                    ends_on=today + timedelta(days=90),
                    category="Festival",
                    is_festival=True,
                ),
                Event(
                    title_en="Vaikunta Ekadasi",
                    title_ta="வைகுண்ட ஏகாதசி",
                    description="Devotees pass through the Vaikunta Dwaram gateway for the sacred darshan of Lord Vishnu.",
                    starts_on=today + timedelta(days=110),
                    ends_on=today + timedelta(days=110),
                    category="Festival",
                    is_festival=True,
                ),
            ]
        )

    if db.query(SevaSlot).count() == 0:
        db.add_all(
            [
                SevaSlot(
                    name_en="Suprabhata Darshan",
                    name_ta="சுப்ரபாத தரிசனம்",
                    description="Pre-dawn first-glimpse darshan accompanied by Vedic chanting.",
                    price_inr=200.0,
                    capacity=120,
                    starts_at=time(5, 0),
                ),
                SevaSlot(
                    name_en="Abhishekam Seva",
                    name_ta="அபிஷேகம் சேவை",
                    description="Sacred bathing of the deity with milk, sandal paste and herbs.",
                    price_inr=750.0,
                    capacity=60,
                    starts_at=time(7, 30),
                    duration_min=45,
                ),
                SevaSlot(
                    name_en="Archanai",
                    name_ta="அர்ச்சனை",
                    description="Personal sankalpa archanai in the donor’s name and gotra.",
                    price_inr=151.0,
                    capacity=200,
                    starts_at=time(10, 0),
                    duration_min=15,
                ),
                SevaSlot(
                    name_en="Sandhya Aaradhanai",
                    name_ta="சந்தியா ஆராதனை",
                    description="Twilight lamp offering with Tamil thevaram recitation.",
                    price_inr=300.0,
                    capacity=80,
                    starts_at=time(18, 0),
                ),
            ]
        )

    if db.query(FAQ).count() == 0:
        db.add_all(
            [
                FAQ(
                    question_en="What is the temple dress code?",
                    question_ta="கோயில் ஆடை விதிமுறை என்ன?",
                    answer_en="Traditional attire is requested. Men: dhoti or trousers with a shirt. Women: saree, half-saree or salwar kameez.",
                    answer_ta="பாரம்பரிய உடை உகந்தது. ஆண்கள்: வேட்டி அல்லது பேன்ட் சட்டை. பெண்கள்: புடவை, அரை-புடவை அல்லது சல்வார்.",
                    sort_order=1,
                ),
                FAQ(
                    question_en="Are mobile phones allowed inside the sanctum?",
                    question_ta="கருவறையினுள் கைபேசிகள் அனுமதிக்கப்படுமா?",
                    answer_en="Mobile phones, cameras and footwear are not permitted past the inner gopuram. Lockers are available at the main entrance.",
                    answer_ta="உள் கோபுரத்திற்குள் கைபேசிகள், கேமராக்கள், காலணிகள் அனுமதி இல்லை. முக்கிய நுழைவாயிலில் பெட்டகங்கள் உள்ளன.",
                    sort_order=2,
                ),
                FAQ(
                    question_en="How early should I arrive for a booked seva?",
                    question_ta="பதிவு செய்த சேவைக்கு எவ்வளவு முன்னதாக வர வேண்டும்?",
                    answer_en="Please arrive 30 minutes ahead so that prasadam slips and entry tokens can be collected without rush.",
                    answer_ta="30 நிமிடங்கள் முன்னதாக வந்து பிரசாதம் சீட்டு மற்றும் நுழைவு டோக்கனை பெற்றுக் கொள்ளவும்.",
                    sort_order=3,
                ),
                FAQ(
                    question_en="Are donation receipts eligible for tax exemption?",
                    question_ta="நன்கொடை ரசீதுகளுக்கு வரிவிலக்கு உள்ளதா?",
                    answer_en="Yes — receipts above ₹500 are issued under section 80G. Please provide your PAN at the time of donation.",
                    answer_ta="ஆம் — ₹500-க்கு மேற்பட்ட நன்கொடைகளுக்கு 80G ரசீது வழங்கப்படும். நன்கொடை நேரத்தில் PAN-ஐ வழங்கவும்.",
                    sort_order=4,
                ),
            ]
        )

    if db.query(Feedback).count() == 0:
        db.add_all(
            [
                Feedback(
                    name="Priya Subramaniam",
                    rating=5,
                    message="Booked the Suprabhata darshan for my parents — the slot was honoured to the minute and the prasadam counter knew us by reference. Quiet, dignified, well-run.",
                ),
                Feedback(
                    name="Karthik Iyer",
                    rating=5,
                    message="Aalayam helped us plan the Aadi Pooram visit around the crowd forecast. We avoided peak hours and still received full sanctum darshan.",
                ),
                Feedback(
                    name="Lakshmi Narayanan",
                    rating=4,
                    message="The Tamil-first design feels respectful. Donation receipts arrived instantly. Would love SMS reminders for booked sevas.",
                ),
                Feedback(
                    name="Arvind Ramachandran",
                    rating=5,
                    message="As a temple administrator, the operational dashboard has cut our manual queue management in half. Crowd predictions have been remarkably accurate.",
                ),
            ]
        )

    if db.query(ParkingLot).count() == 0:
        db.add_all(
            [
                ParkingLot(
                    slug="south-gate",
                    name_en="South Gate Parking",
                    name_ta="தென் வாசல் வாகன நிறுத்தம்",
                    location="Near Aadi Veedhi, opposite the south gopuram",
                    capacity_car=120,
                    capacity_bike=240,
                    capacity_bus=14,
                    capacity_auto=40,
                ),
                ParkingLot(
                    slug="north-gate",
                    name_en="North Gate Parking",
                    name_ta="வடக்கு வாசல் வாகன நிறுத்தம்",
                    location="Adjoining the temple tank",
                    capacity_car=80,
                    capacity_bike=160,
                    capacity_bus=8,
                    capacity_auto=24,
                ),
                ParkingLot(
                    slug="vip",
                    name_en="VIP & Senior Citizens Parking",
                    name_ta="விஐபி மற்றும் முதியோர் வாகன நிறுத்தம்",
                    location="East gopuram lane",
                    capacity_car=24,
                    capacity_bike=20,
                    capacity_bus=2,
                    capacity_auto=10,
                ),
            ]
        )

    # No generic/sample CCTV data — the CCTV feed shows only live detections
    # (stored under camera_id "webcam-yolo"). Purge any previously-seeded rows.
    db.query(CCTVCount).filter(CCTVCount.camera_id != "webcam-yolo").delete(synchronize_session=False)

    _seed_footfall_history(db)

    if db.query(User).filter(User.email == "demo@aalayam.in").first() is None:
        db.add(
            User(
                email="demo@aalayam.in",
                name="Demo Devotee",
                hashed_password=hash_password("demo1234"),
                is_admin=False,
            )
        )

    db.commit()

# Aalayam — Tamil Nadu Temple Platform

**Aalayam** (ஆலயம், "temple") is a full-stack platform for a Tamil Nadu Hindu
temple. It serves two audiences from one codebase:

- **Devotees** — plan a darshan, book sevas, donate, read the temple's living
  history, register a vehicle, and check the live crowd, all in **English or
  Tamil** with a **light / dark** theme.
- **Temple administrators** — run an operational control room: real-time crowd
  from CCTV, parking occupancy, booking analytics, a combined footfall report,
  and an AI-style crowd forecast that turns predicted attendance into concrete
  prasadam / staffing / parking provisioning numbers.

The design language is deliberately restrained and culturally rooted (saffron,
maroon, temple-gold; Cormorant Garamond + Inter + Noto Serif Tamil), and the
backend is a clean, modular FastAPI service with zero-config SQLite that
upgrades to PostgreSQL by changing one environment variable.

---

## Table of contents

- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Quick start](#quick-start)
- [Feature tour](#feature-tour)
- [Data model](#data-model)
- [API reference](#api-reference)
- [The crowd-prediction model](#the-crowd-prediction-model)
- [Real-time crowd detection (webcam + YOLOv8)](#real-time-crowd-detection-webcam--yolov8)
- [Frontend](#frontend)
- [Design system](#design-system)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Sample credentials](#sample-credentials)
- [Production checklist](#production-checklist)

---

## Architecture

```
                Browser (React SPA)
                        │
          /api/v1/*  ───┼───  static assets
                        │
   ┌────────────────────┴─────────────────────┐
   │  FastAPI app  (temple/backend/app/main)   │
   │                                           │
   │  13 routers under /api/v1                  │
   │  ├─ devotee:  auth · temple · events ·    │
   │  │            bookings · donations ·       │
   │  │            feedback · faq               │
   │  └─ operations: crowd · stats · parking ·  │
   │                 cctv · final-report ·      │
   │                 prediction                 │
   │                                           │
   │  SQLAlchemy 2.0 ORM  ──►  SQLite / Postgres │
   │  Seeds on first boot (lifespan hook)       │
   └───────────────────────────────────────────┘
```

In **development** the Vite dev server (port `3000`) proxies `/api/*` to the
FastAPI backend (port `8000`), so the browser only ever talks to one origin.

In **production** the same FastAPI app also serves the built SPA: a catch-all
route streams `frontend/dist/index.html` (and its assets) for any non-`/api`
path, so a single container delivers both API and UI.

---

## Tech stack

| Layer | Choice |
|---|---|
| Backend framework | FastAPI (ASGI, served by Uvicorn) |
| ORM / DB | SQLAlchemy 2.0 (typed `Mapped[...]` models) · SQLite (default) / PostgreSQL |
| Auth | JWT (`python-jose`) + bcrypt password hashing (`passlib`) |
| Validation / settings | Pydantic v2 · pydantic-settings (`.env`) |
| Frontend framework | React 18 + React Router 6 |
| Build tool | Vite 5 |
| i18n | i18next + react-i18next + browser language detector (English / Tamil) |
| Styling | Hand-tuned CSS with design tokens (no UI framework) |
| Deployment | Docker (Render) · Vercel serverless functions |

---

## Repository layout

```
temple/
├── backend/                         FastAPI · SQLAlchemy · SQLite · JWT
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py              register · login · me  (JWT)
│   │   │   ├── temple.py           temple profiles
│   │   │   ├── events.py           festival / event calendar
│   │   │   ├── bookings.py         seva slots · availability · booking · stats · checkout
│   │   │   ├── donations.py        causes · donate · recent wall · checkout
│   │   │   ├── feedback.py         submit · list
│   │   │   ├── faq.py              bilingual FAQ
│   │   │   ├── crowd.py            synthetic live + 7-day crowd dashboard
│   │   │   ├── stats.py            aggregated landing-page numbers
│   │   │   ├── parking.py         lots · entry/exit · occupancy · people estimate
│   │   │   ├── cctv.py             people-count ingestion + hourly stats
│   │   │   ├── final_report.py    combined crowd estimate (parking+cctv+bookings)
│   │   │   └── prediction.py      seasonal-trend footfall forecast
│   │   ├── config.py               pydantic-settings (reads .env)
│   │   ├── db.py                   SQLAlchemy 2.0 engine + session + Base
│   │   ├── deps.py                 get_db · get_current_user · get_optional_user
│   │   ├── main.py                 app factory · lifespan seed · CORS · SPA serving
│   │   ├── models.py               12 ORM models
│   │   ├── schemas.py              Pydantic v2 request/response schemas
│   │   ├── security.py             JWT encode/decode + bcrypt
│   │   └── seed.py                 idempotent sample-data + 5-year history generator
│   ├── requirements.txt
│   └── .env.example
└── frontend/                        Vite · React 18 · Router · i18n · hand-tuned CSS
    ├── index.html
    ├── package.json
    ├── vite.config.js               dev server :3000, proxies /api → :8000
    └── src/
        ├── api/client.js            fetch wrapper with bearer-token auth
        ├── context/                 ThemeContext (light/dark) · AuthContext (JWT)
        ├── i18n/                     index.js + en.json + ta.json
        ├── hooks/                    useScrollReveal
        ├── components/               Nav · Footer · Loader · Stars · Sidebar ·
        │                             OpsLayout · IntroVideo · Icon + landing/*
        ├── pages/                    16 routed pages (see Frontend section)
        └── styles/                   theme.css · app.css · landing.css · dashboard.css
```

> This `temple/` tree is the actively deployed application. The repository root
> also contains an unrelated legacy "SmartDarshan" crowd-analytics app
> (`backend/`, `frontend/`); the root `Dockerfile`, `render.yaml`, `vercel.json`
> and `api/` all point at **this** temple platform.

---

## Quick start

Requirements: **Python 3.10+** and **Node 18+**.

### 1. Backend — port 8000

```bash
cd temple/backend
python -m venv .venv
# Windows:  .venv\Scripts\activate
# Mac/Lin:  source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env             # then set SECRET_KEY to a long random string
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

On first run the app creates `aalayam.db` and **seeds** it automatically:
2 temples, 4 events, 4 sevas, 4 FAQs, 4 feedback entries, 3 parking lots,
today's hourly CCTV samples, **~5 years of daily footfall history** (for the
prediction model), and 1 demo user. Seeding is idempotent — it only fills empty
tables, so restarts are safe.

- Interactive API docs: <http://127.0.0.1:8000/docs>
- Health check: <http://127.0.0.1:8000/health>

### 2. Frontend — port 3000

```bash
cd temple/frontend
npm install
npm run dev
```

Open <http://localhost:3000>. Vite proxies every `/api/*` call to the backend on
port 8000, so no CORS configuration is needed in development.

> **Port note:** the source of truth is `vite.config.js` — frontend `3000`,
> proxy target `8000`. (Run the backend on 8000 to match; if you change one,
> change the other.)

---

## Feature tour

### Devotee features
- **Bilingual UI** — instant English ⇄ Tamil switching, persisted in
  `localStorage`, with `lang`/`data-lang` set on `<html>` and Tamil-aware fonts.
- **Light / dark theme** — respects `prefers-color-scheme` on first load, then
  remembers the user's choice.
- **Accounts** — register / login with JWT; the token is stored client-side and
  the session is restored on reload via `/auth/me`.
- **Temple profiles** — history, architecture, timings and rituals for each
  temple, in both languages.
- **Events calendar** — upcoming festivals and observances, filterable.
- **Seva bookings** — browse seva slots, check live availability for a date,
  book (capacity is enforced transactionally), and view a mock payment hand-off.
- **Donations** — suggested causes, anonymous-friendly donations, a public
  recent-donations wall, and a mock checkout intent.
- **Parking** — register a vehicle into a lot (with duplicate-plate and
  capacity guards) and release it on exit.
- **Feedback & FAQ** — leave a rating + message; read a curated bilingual FAQ.

### Operations / admin features
- **Crowd dashboard** (`/crowd/dashboard`) — current occupancy band, an hourly
  curve for today, and a 7-day outlook.
- **CCTV analytics** — ingest per-camera people counts and view today's hourly
  detection, current count, last-hour total, and cameras online.
- **Parking analytics** — per-lot and overall occupancy, available slots, and an
  **estimated-people** figure derived from vehicle mix.
- **Booking analytics** — totals, devotees, morning/afternoon/evening split, and
  a 14-day trend.
- **Final report** — a single combined live crowd estimate that fuses parking
  occupancy, CCTV detections and confirmed bookings, with the day's peak hour.
- **Crowd prediction** — pick a future date and get a forecast with a confidence
  band plus actionable provisioning numbers (see below).

---

## Data model

Twelve SQLAlchemy 2.0 models (`backend/app/models.py`):

| Model | Purpose |
|---|---|
| `User` | Devotee / admin account (bcrypt-hashed password, `is_admin` flag) |
| `TempleInfo` | Per-temple profile (bilingual name/deity, history, architecture, timings, rituals) |
| `Event` | Festival / observance calendar entry (bilingual, date range, `is_festival`) |
| `SevaSlot` | Bookable ritual slot (price, capacity, start time, duration) |
| `Booking` | A devotee's seva booking (date, party size, amount, status, reference) |
| `Donation` | A donation (optionally anonymous; donor, purpose, amount, status, reference) |
| `Feedback` | Rating (1–5) + message, optionally tied to a user |
| `ParkingLot` | A lot with per-vehicle-type capacity (car/bike/bus/auto) |
| `VehicleEntry` | A vehicle currently/previously in a lot (plate, type, owner, entry/exit timestamps) |
| `FootfallHistory` | One row per day of historical footfall (weekday, month, year, festival flag) — feeds prediction |
| `CCTVCount` | A per-camera people-count sample at a timestamp |
| `FAQ` | Bilingual question/answer with sort order |

---

## API reference

All endpoints are mounted under `/api/v1`. Auth column: **—** public,
**bearer** requires a JWT, **optional** works either way (and attributes the
record to the user when a token is present).

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET  | `/health` | — | Liveness probe (used by Render health check) |
| **Auth** |
| POST | `/api/v1/auth/register` | — | Create account → returns JWT + user |
| POST | `/api/v1/auth/login` | — | Email + password → JWT + user |
| GET  | `/api/v1/auth/me` | bearer | Current user |
| **Temple** |
| GET  | `/api/v1/temple` | — | All temple profiles |
| GET  | `/api/v1/temple/{slug}` | — | One temple |
| **Events** |
| GET  | `/api/v1/events?upcoming_only=&festival_only=` | — | Event / festival calendar |
| **Bookings** |
| GET  | `/api/v1/bookings/sevas` | — | All seva slots |
| GET  | `/api/v1/bookings/sevas/{id}/availability?on=YYYY-MM-DD` | — | Remaining capacity for a date |
| GET  | `/api/v1/bookings/stats` | — | Totals · slot split · 14-day trend |
| POST | `/api/v1/bookings` | bearer | Create booking (capacity-checked) |
| GET  | `/api/v1/bookings/me` | bearer | My bookings |
| POST | `/api/v1/bookings/{id}/checkout` | bearer | Mock payment intent |
| **Donations** |
| GET  | `/api/v1/donations/causes` | — | Suggested causes |
| POST | `/api/v1/donations` | optional | Record a donation (anonymous OK) |
| POST | `/api/v1/donations/{id}/checkout` | — | Mock payment intent |
| GET  | `/api/v1/donations/recent` | — | Public recent-donations wall |
| **Feedback / FAQ** |
| POST | `/api/v1/feedback` | optional | Submit rating + message |
| GET  | `/api/v1/feedback` | — | Recent feedback |
| GET  | `/api/v1/faq` | — | Bilingual FAQ list |
| **Crowd / stats** |
| GET  | `/api/v1/crowd/dashboard` | — | Live band + hourly curve + 7-day outlook |
| GET  | `/api/v1/stats/landing` | — | Aggregated landing-page metrics |
| **Parking** |
| GET  | `/api/v1/parking/stats` | — | Overall occupancy + estimated people |
| GET  | `/api/v1/parking/lots` | — | All lots with live status |
| GET  | `/api/v1/parking/lots/{slug}` | — | One lot's status |
| POST | `/api/v1/parking/entry` | optional | Register a vehicle entry |
| POST | `/api/v1/parking/exit/{entry_id}` | — | Register a vehicle exit |
| GET  | `/api/v1/parking/active?lot_id=` | — | Vehicles currently parked |
| GET  | `/api/v1/parking/me` | bearer | My vehicle entries |
| **CCTV** |
| POST | `/api/v1/cctv/ingest` | — | Push a people-count sample |
| GET  | `/api/v1/cctv/stats` | — | Today's hourly detection + current count |
| GET  | `/api/v1/cctv/recent?limit=` | — | Recent raw counts |
| **Reporting / prediction** |
| GET  | `/api/v1/final-report` | — | Combined live crowd estimate + peak hour |
| POST | `/api/v1/predict` | — | Footfall forecast for a target date |
| **Live crowd detection (webcam + YOLOv8, optional)** |
| GET  | `/api/crowd/live` | — | Live people count + density band |
| GET  | `/api/crowd/status` | — | Live count vs. forecast → occupancy status |
| GET  | `/api/crowd/stream` | — | Annotated MJPEG video stream |
| POST | `/api/crowd/camera/start` | — | Start camera + inference loop |
| POST | `/api/crowd/camera/stop` | — | Release camera + stop inference |

> The `/api/crowd/*` routes are mounted at `/api` (not `/api/v1`) to match the
> integration contract, and are distinct from the `/api/v1/crowd/dashboard`
> analytics endpoint. They require the optional vision extras (see below);
> without them they respond with HTTP 503 rather than failing the app.

---

## The crowd-prediction model

`POST /api/v1/predict` (`{ "target_date": "YYYY-MM-DD" }`) returns a footfall
forecast built from the seeded `FootfallHistory`. It's a hand-rolled **additive
seasonal model** that captures the same signals Prophet would for this domain —
no heavyweight ML dependency:

```
yearly_baseline = linear_trend(year)                 # year-over-year growth
weekday_factor  = mean(footfall | weekday) / overall # weekly seasonality
month_factor    = mean(footfall | month)   / overall # monthly seasonality
festival_factor = mean(festival_days) / mean(non_festival_days)   # spike
seasonal_factor = weekday_factor × month_factor

prediction = yearly_baseline × seasonal_factor × festival_factor
```

A weighted-average baseline (`0.5·last_year + 0.3·2yrs_ago + 0.2·mean(3–5yrs)`)
is computed in parallel and used as a **fallback** when there are fewer than 200
history rows. The response includes a **±15 % confidence band**, the detected
festival (if any), a `Low/Medium/High` level with a colour, the factor
breakdown, the same calendar day across previous years, and **operational
suggestions**:

| Suggestion | Heuristic |
|---|---|
| `prasadam_servings` | predicted × 1.15 |
| `prasadam_kg` | predicted × 0.12 (~120 g per devotee) |
| `parking_slots_needed` | predicted ÷ 5 (~5 devotees per vehicle) |
| `staff_required` | predicted ÷ 75 (1 staff per ~75 devotees) |

> The endpoint deliberately `await`s ~2.4 s to mimic real model inference for
> the UI's "thinking" state. Swapping in Prophet later is a single-function
> change — keep `predict()`'s input/output shapes identical.

### XGBoost prediction service (`prediction-api/`)

The **Prediction page** (`/prediction`) is wired to a separate, trained
**XGBoost** model service ([Temple-API](https://github.com/santhosh-2909/Temple-API))
vendored under `prediction-api/`. It loads `hacktemple_xgboost_model.pkl` and
predicts daily footfall from weather + calendar + festival features.

```bash
cd temple/prediction-api
python -m venv .venv && .venv/Scripts/activate     # (source .venv/bin/activate on mac/linux)
pip install -r requirements.txt
uvicorn app:app --port 8001
```

- **`POST /predict`** ← `{date, temple, temperature, rainfall, holiday,
  festival_tier, prasadam_sales}` → `{expected_footfall, crowd_level, …}`.
  `festival_tier` ∈ `NORMAL · WEEKEND · MEDIUM_LOW · MEDIUM · HIGH · PEAK`.
- The Vite dev server proxies **`/xgb` → `http://127.0.0.1:8001`** (prefix
  stripped), and `api.predictXgb()` posts to `/xgb/predict` — CORS-free in dev,
  and the service also sets permissive CORS for direct calls.
- The frontend form collects the model inputs; operational planning numbers
  (prasadam / parking / staff) are derived client-side from the predicted
  footfall.

> Run all three locally for the full experience: temple backend (`:8000`),
> XGBoost prediction API (`:8001`), and the Vite frontend (`:3000`).

---

## Real-time crowd detection (webcam + YOLOv8)

An **optional**, locally-run module turns a laptop webcam (or any RTSP/HTTP
camera) into a live people counter using **OpenCV + YOLOv8 (Ultralytics)**, and
fuses the live count with the footfall forecast above. It is intentionally
decoupled from the core API so the cloud deployment stays lightweight — the
heavy `torch`/`opencv` stack lives in a separate requirements file and is
imported lazily; if it (or a camera) is absent, the endpoints return HTTP 503
instead of breaking the app.

### Architecture (service layer)

```
app/
├── services/
│   ├── vision_config.py    pydantic-settings for the vision stack (.env)
│   ├── yolo_service.py     singleton YOLO loader → detect_persons(frame)
│   ├── webcam_service.py   threaded cv2.VideoCapture, latest-frame cache, auto-reconnect
│   └── crowd_service.py    background inference loop · density · forecast bridge · singleton
├── routers/
│   └── live_crowd.py       /api/crowd/* endpoints (Swagger-documented)
├── utils/
│   └── logging_config.py   centralised logging
└── live_view.py            standalone annotated OpenCV window (Feature 2)
```

- **`yolo_service`** loads `yolov8n.pt` exactly once (thread-safe singleton) and
  detects only the COCO `person` class.
- **`webcam_service`** runs a daemon capture thread that always holds the latest
  frame and transparently reconnects a dropped camera.
- **`crowd_service`** runs a background inference loop (with **frame skipping**
  and an inference throttle for 15–30 FPS-class performance), caches the count +
  density + an annotated JPEG, and computes today's forecast by reusing the
  **same** prediction helpers as `/api/v1/predict` (minus its artificial delay).

### Classification rules

| People count | Density | | Live ÷ forecast | Occupancy status |
|---|---|---|---|---|
| 0–10 | `LOW` | | < 50 % | `NORMAL` |
| 11–30 | `MEDIUM` | | 50–80 % | `BUSY` |
| 31–60 | `HIGH` | | 80–100 % | `CROWDED` |
| 61+ | `VERY_HIGH` | | > 100 % | `OVERCAPACITY` |

### Install & run (camera-equipped machine only)

```bash
cd temple/backend
pip install -r requirements.txt            # core API
pip install -r requirements-vision.txt     # YOLOv8 + OpenCV (heavy, optional)
python -m uvicorn app.main:app --reload --port 8000
```

Then:

```bash
# live count + density
curl http://127.0.0.1:8000/api/crowd/live
# {"people_count": 14, "density": "MEDIUM", "timestamp": "2026-06-15T12:30:00"}

# live vs. forecast
curl http://127.0.0.1:8000/api/crowd/status
# {"current_count":120,"predicted_count":500,"expected_remaining":380,
#  "occupancy_pct":24.0,"occupancy_status":"NORMAL","density":"VERY_HIGH",...}
```

The annotated live video is available at `GET /api/crowd/stream` (drop it into an
`<img src="/api/crowd/stream">`). For a native OpenCV window with bounding boxes
and an on-screen count, run the standalone viewer (stop the API server first —
only one process can hold the camera):

```bash
python live_view.py        # press 'q' to quit
```

### Configuration (`.env`)

| Variable | Default | Purpose |
|---|---|---|
| `YOLO_MODEL` | `yolov8n.pt` | Ultralytics weights (auto-downloaded; use `yolov8s/m.pt` for accuracy) |
| `CAMERA_SOURCE` | `0` | Webcam index, or a file path / RTSP-HTTP stream URL |
| `CONFIDENCE_THRESHOLD` | `0.5` | Minimum detection confidence |
| `FRAME_SKIP` | `2` | Run inference on 1 of every N frames |
| `INFERENCE_INTERVAL` | `0.04` | Min seconds between inferences (throttle) |

> **Note on the existing forecast:** this integration was built against the
> repository's *actual* forecasting code — the hand-rolled seasonal-trend model
> in `routers/prediction.py` — not an XGBoost model. `/api/crowd/status` reuses
> that model's helpers directly, so if you later swap in XGBoost/Prophet there,
> the live comparison follows automatically.

---

## Frontend

A React 18 + Vite SPA. State lives in two contexts — `AuthContext` (JWT in
`localStorage`, session restored via `/auth/me`) and `ThemeContext` (light/dark)
— and all data flows through one typed `api` client (`src/api/client.js`).

**Routed pages** (`src/App.jsx`):

| Route | Page | Notes |
|---|---|---|
| `/` | Landing | Full marketing landing (hero, features, gallery, testimonials, CTA) |
| `/about` | About | Temple history & profiles |
| `/events` | Events | Festival / event calendar |
| `/bookings` | Bookings | Seva booking — **protected** (redirects to login) |
| `/donations` | Donations | Causes + donation flow |
| `/parking` | Parking | Vehicle entry/exit |
| `/dashboard` | Dashboard | Operations overview |
| `/dashboard/parking` | ParkingStats | Parking occupancy analytics |
| `/dashboard/bookings` | BookingStats | Booking analytics |
| `/cctv` | CCTV | Live people-detection view |
| `/prediction` | Prediction | Crowd forecast + provisioning |
| `/final-report` | FinalReport | Combined crowd report |
| `/feedback` | Feedback | Submit / read feedback |
| `/faq` | FAQ | Bilingual FAQ |
| `/settings` | Settings | Theme / language preferences |
| `/login` | Login | Sign-in / register (`?mode=register`, `?next=`) |

Any unknown route redirects to `/`.

---

## Design system

| Role | Light | Dark |
|---|---|---|
| Primary | Deep saffron `#C45A1B`, maroon `#6B1F2A`, gold `#C8A94A` | Same hues, warmer tone-mapped |
| Secondary | Ivory `#FBF6EC`, sandalwood beige `#E8DDC6`, stone grey `#6B6258` | Lamp-lit dark `#1A0F12` / `#221518` |
| Accent | Gold gradient (CTA + brand mark only) | Dimmed gold |
| Type — heading | Cormorant Garamond (serif) | — |
| Type — body | Inter | — |
| Type — Tamil | Noto Serif Tamil | — |

Tokens live in `src/styles/theme.css`. Light/dark switches via `data-theme="dark"`
on `<html>`; the choice is persisted and respects `prefers-color-scheme` on first
load.

**Quality details:** no UI-framework dependency; self-hosted/preconnected fonts
(no FOUT); CSS-variable theming (no React re-render of unrelated trees); a sticky
translucent nav using only `backdrop-filter`; and accessibility throughout —
skip link, focus-visible rings, semantic landmarks, and a reduced-motion guard.

---

## Configuration

Backend settings are read from environment / `.env` (`backend/app/config.py`):

| Variable | Default | Purpose |
|---|---|---|
| `APP_NAME` | `Aalayam` | Display name in API title & health |
| `SECRET_KEY` | `dev-secret-replace-in-production` | JWT signing key — **change in production** |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | JWT lifetime (24 h) |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `DATABASE_URL` | `sqlite:///./aalayam.db` | Any SQLAlchemy URL (e.g. `postgresql+psycopg://user:pw@host/db`) |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated allowed origins (only matters for direct cross-origin calls; the Vite dev proxy makes this moot locally) |

Copy `backend/.env.example` to `backend/.env` and adjust. SQLite databases and
`.env` files are git-ignored; the DB is regenerated from the seed on first boot.

---

## Deployment

The repository root ships two deployment paths, both targeting this app:

### Docker / Render (`Dockerfile`, `render.yaml`)
A multi-stage build: Node builds the SPA (`temple/frontend → dist`), then a
slim Python image installs the backend and copies the built `dist/` in. The
FastAPI app serves both the API and the SPA, listening on `$PORT` (default
`10000`). `render.yaml` wires up the Docker runtime, a generated `SECRET_KEY`,
and a `/health` health check.

```bash
docker build -t aalayam .
docker run -p 10000:10000 -e SECRET_KEY=$(openssl rand -hex 32) aalayam
# open http://localhost:10000
```

### Vercel (`vercel.json`, `api/index.py`)
Vercel builds the SPA (`outputDirectory: temple/frontend/dist`) and routes
`/api/*` to a serverless function (`api/index.py`) that imports the **same**
FastAPI app. Caveats baked into that file: it defaults `DATABASE_URL` to
`/tmp/aalayam.db` (writable but ephemeral per cold start) and `CORS_ORIGINS` to
`*` — set a managed Postgres `DATABASE_URL` and a tight `CORS_ORIGINS` in
Project Settings for real persistence.

---

## Sample credentials

- **Email:** `demo@aalayam.in`
- **Password:** `demo1234`

Or register a fresh account from the sign-in screen.

---

## Production checklist

1. Replace `SECRET_KEY` with a 64+ character random string from a secret manager.
2. Set `CORS_ORIGINS` to the deployed frontend origin only.
3. Move to PostgreSQL and run Alembic migrations instead of `create_all`.
4. Plug in a real payment provider (Razorpay / PhonePe / Stripe) — the checkout
   endpoints already return a provider-shaped intent; verify webhook signatures.
5. Put the API behind a reverse proxy with HTTPS, gzip and HTTP/2.
6. Replace the synthetic crowd/CCTV data with real ingestion feeds.
7. Add structured logging and an error reporter (Sentry, Logfire).
</content>
</invoke>

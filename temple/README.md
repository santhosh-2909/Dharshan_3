# Aalayam — Tamil Nadu Temple Platform

A full-stack reference application for a Tamil Nadu Hindu temple, built around a
restrained, culturally rooted design language and a clean, modular backend.

```
temple/
├── backend/            FastAPI · SQLAlchemy · SQLite · JWT
│   ├── app/
│   │   ├── routers/    auth · temple · events · bookings · donations · feedback · faq · crowd
│   │   ├── config.py   pydantic-settings (.env)
│   │   ├── db.py       SQLAlchemy 2.0 engine + session
│   │   ├── deps.py     get_db, get_current_user, get_optional_user
│   │   ├── main.py     app factory + lifespan + CORS + router mounting
│   │   ├── models.py   ORM models
│   │   ├── schemas.py  Pydantic v2 schemas
│   │   ├── security.py JWT + bcrypt password hashing
│   │   └── seed.py     Sample data (temples, events, sevas, FAQ, demo user)
│   ├── requirements.txt
│   └── .env.example
└── frontend/           Vite · React 18 · Router · hand-tuned CSS
    ├── index.html
    ├── package.json
    ├── vite.config.js  proxies /api → http://127.0.0.1:8001
    └── src/
        ├── api/client.js       Fetch wrapper with bearer-token auth
        ├── context/            ThemeContext, AuthContext
        ├── components/         Nav, Footer, Loader, Stars
        ├── pages/              Dashboard, About, Events, Bookings,
        │                       Donations, Feedback, FAQ, Settings, Login
        └── styles/             theme.css (tokens) + app.css (components)
```

## Design system

| Role | Light | Dark |
|---|---|---|
| Primary | Deep saffron `#C45A1B`, maroon `#6B1F2A`, gold `#C8A94A` | Same hues, warmer tone-mapped |
| Secondary | Ivory `#FBF6EC`, sandalwood beige `#E8DDC6`, stone grey `#6B6258` | Lamp-lit dark `#1A0F12` / `#221518` |
| Accent | Gold gradient (CTA + brand mark only) | Dimmed gold |
| Type — heading | Cormorant Garamond (serif) | — |
| Type — body | Inter | — |
| Type — Tamil | Noto Serif Tamil | — |

Tokens live in `src/styles/theme.css`. Light / dark switch via `data-theme="dark"`
on `<html>` and respects `prefers-color-scheme` on first load.

## Quick start

### 1. Backend (port 8001)

```bash
cd temple/backend
python -m venv .venv
# Windows:  .venv\Scripts\activate
# Mac/Lin:  source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env             # then set SECRET_KEY to a long random string
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

The first run creates `aalayam.db` and seeds two temples, four events, four sevas,
four FAQs, and one demo user (`demo@aalayam.in` / `demo1234`).

API docs: http://127.0.0.1:8001/docs

### 2. Frontend (port 5173)

```bash
cd temple/frontend
npm install
npm run dev
```

Open http://localhost:5173 — Vite proxies `/api/*` to the backend.

## API surface

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/auth/register` | — | Create account, returns JWT |
| POST | `/api/v1/auth/login` | — | Email + password → JWT |
| GET  | `/api/v1/auth/me` | bearer | Current user |
| GET  | `/api/v1/temple` | — | All temple profiles |
| GET  | `/api/v1/temple/{slug}` | — | One temple |
| GET  | `/api/v1/events` | — | Upcoming events (filterable) |
| GET  | `/api/v1/bookings/sevas` | — | All seva slots |
| GET  | `/api/v1/bookings/sevas/{id}/availability?on=YYYY-MM-DD` | — | Capacity check |
| POST | `/api/v1/bookings` | bearer | Create booking |
| GET  | `/api/v1/bookings/me` | bearer | My bookings |
| POST | `/api/v1/bookings/{id}/checkout` | bearer | Create payment intent (mock) |
| GET  | `/api/v1/donations/causes` | — | Suggested causes |
| POST | `/api/v1/donations` | optional | Record donation (anonymous OK) |
| POST | `/api/v1/donations/{id}/checkout` | — | Payment intent (mock) |
| GET  | `/api/v1/donations/recent` | — | Public wall |
| POST | `/api/v1/feedback` | optional | Submit feedback |
| GET  | `/api/v1/feedback` | — | Recent feedback |
| GET  | `/api/v1/faq` | — | FAQ list |
| GET  | `/api/v1/crowd/dashboard` | — | Live + 7-day crowd model |

## Payment integration

Payment intent endpoints (`/bookings/{id}/checkout`, `/donations/{id}/checkout`)
return a `provider_order_id` and `next_action`. The shape matches Razorpay /
Stripe / PhonePe — replace the stub in `routers/bookings.py` and `routers/donations.py`
with the real SDK call once keys are provisioned. The frontend already shows the
provider order id and the "redirect to provider" hand-off message.

## Performance & quality

- React + Vite, no UI framework dependency, ~ 50 KB JS gzip after build
- Self-hosted Google Fonts via `preconnect`, no FOUT
- CSS-variable theme switching (no React re-render of unrelated trees)
- Sticky translucent nav uses `backdrop-filter` only — no JS scroll handlers
- WCAG: skip link, focus-visible rings, semantic landmarks, reduced-motion guard
- Bcrypt password hashing, JWT signed with `SECRET_KEY`, no PII in tokens
- Capacity is checked transactionally in the booking endpoint
- SQLite for zero-config; flip `DATABASE_URL` to PostgreSQL for production
  (`postgresql+psycopg://user:pw@host/db`) — schema is identical

## Production checklist (when you're ready)

1. Replace `SECRET_KEY` with a 64+ char random string from a secret manager.
2. Set `CORS_ORIGINS` to the deployed frontend origin only.
3. Move to PostgreSQL and run Alembic migrations instead of `create_all`.
4. Plug in Razorpay (or PhonePe / Stripe) keys; verify webhook signatures.
5. Put the API behind a reverse proxy with HTTPS, gzip and HTTP/2.
6. Build the frontend (`npm run build`) and serve `dist/` from the proxy/CDN.
7. Add structured logging and an error reporter (Sentry, Logfire).

## Sample credentials

- **Email:** `demo@aalayam.in`
- **Password:** `demo1234`

Or register a fresh account from the sign-in screen.

"""Vercel serverless entrypoint for the Aalayam temple platform.

Vercel routes everything under /api/* to this file. We reuse the FastAPI
app from `temple/backend/app/main.py` so a single source of truth powers
both local development and the deployed environment.

Caveats specific to Vercel:

  * The deployed filesystem at `/var/task` is read-only.  SQLite needs a
    writable path, so we default `DATABASE_URL` to `/tmp/aalayam.db` when
    running on Vercel.  `/tmp` survives within a warm container only; on
    every cold start the DB is empty and the seed runs again.  This is
    fine for read-heavy demos but writes (bookings, donations, parking
    entries) will not persist between cold starts.

  * For real persistence, set the `DATABASE_URL` environment variable on
    the Vercel project to a managed Postgres URL (Neon, Supabase, Vercel
    Postgres).  No code change needed — SQLAlchemy will pick it up.

  * `CORS_ORIGINS` defaults to `*` here because the deployed origin is
    unknown at build time.  Tighten this in Vercel Project Settings.
"""

import os
import sys
from pathlib import Path

# Make `temple/backend/app/...` importable.
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "temple" / "backend"))

if os.getenv("VERCEL"):
    os.environ.setdefault("DATABASE_URL", "sqlite:////tmp/aalayam.db")
    os.environ.setdefault("CORS_ORIGINS", "*")

# Vercel's Python runtime auto-detects ASGI apps named `app`.
from app.main import app  # noqa: E402, F401

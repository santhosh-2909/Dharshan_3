# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repo contains two distinct applications under one roof:

1. **SmartDarshan Crowd Analytics** (`backend/`, `frontend/`) — A FastAPI app that reads a ZIP dataset of timestamped images, computes crowd-intensity scores via image heuristics (edge detection, contrast, brightness), and serves a static HTML dashboard. No ML model — purely image-derived metrics.

2. **Aalayam Temple Platform** (`temple/`) — A full-stack temple management system with a FastAPI + SQLAlchemy backend (`temple/backend/`) and a React + Vite SPA frontend (`temple/frontend/`). Features: auth (JWT), bookings, donations, events, parking, CCTV, crowd insights, feedback, FAQ, predictions, and a final report view.

## Commands

### SmartDarshan (root-level)
```bash
pip install -r requirements.txt
python -m uvicorn backend.main:app --reload          # serves on :8000
```
Requires a dataset ZIP (set `SMARTDARSHAN_DATASET_ZIP` env var or place `archive(1).zip` in `data/`).

### Aalayam Backend
```bash
pip install -r temple/backend/requirements.txt
cd temple/backend && uvicorn app.main:app --reload --port 8001
```
Uses SQLite by default (`aalayam.db`). Set `DATABASE_URL` env var for Postgres. Config via env vars or `.env` file (see `temple/backend/app/config.py`).

### Aalayam Frontend
```bash
cd temple/frontend && npm install && npm run dev      # dev server on :5173, proxies /api to :8001
cd temple/frontend && npm run build                   # outputs to temple/frontend/dist/
```

## Architecture

### SmartDarshan
- `backend/main.py` — Single-file FastAPI app. `CrowdDatasetService` class loads images from ZIP, scores them, builds analytics (timeline, heatmap, forecast, footfall, attendance, traffic). All state is in-memory, loaded lazily and cached.
- `backend/services/` — Modular services: `heuristic.py`, `ml_predictor.py`, `pattern_matcher.py`, `risk_scorer.py`, `explanation.py`, `database.py`.
- `frontend/` — Static HTML/CSS/JS dashboard served by FastAPI at `/app`.

### Aalayam Temple Platform
- **Backend** (`temple/backend/app/`):
  - `config.py` — Pydantic Settings (env-driven: `SECRET_KEY`, `DATABASE_URL`, `CORS_ORIGINS`).
  - `db.py` — SQLAlchemy engine/session setup with `Base` declarative base.
  - `models.py` / `schemas.py` — ORM models and Pydantic schemas.
  - `security.py` — JWT auth helpers. `deps.py` — dependency injection.
  - `routers/` — One router module per feature (auth, bookings, donations, events, crowd, parking, cctv, stats, faq, feedback, final_report, prediction). All mounted at `/api/v1`.
  - `seed.py` — Database seeder run on startup via lifespan handler.
  - `main.py` — App factory with lifespan (creates tables + seeds), mounts all routers, serves frontend dist as SPA fallback.
- **Frontend** (`temple/frontend/`):
  - React 18 + React Router 6 SPA. Vite build. No Tailwind — plain CSS (`src/styles/`).
  - `src/api/client.js` — API client.
  - `src/context/` — AuthContext (JWT), ThemeContext.
  - `src/i18n/` — i18next with English and Tamil (`en.json`, `ta.json`).
  - `src/pages/` — Route-level page components.
  - `src/components/` — Shared components; `landing/` subfolder for marketing page sections.

## Deployment

- **Render** (`Dockerfile`, `render.yaml`): Multi-stage Docker build — builds frontend with Node, runs backend with Python. Serves on port 10000.
- **Vercel** (`vercel.json`, `api/index.py`): Frontend is built and served as static. `api/index.py` is a serverless entrypoint that re-exports the Aalayam FastAPI app. On Vercel, SQLite writes to `/tmp` (ephemeral); set `DATABASE_URL` to Postgres for persistence.
- Root `requirements.txt` mirrors `temple/backend/requirements.txt` for Vercel's serverless Python runtime — keep them in sync.

## Key Environment Variables

| Variable | Used By | Default |
|---|---|---|
| `SECRET_KEY` | Aalayam | `dev-secret-replace-in-production` |
| `DATABASE_URL` | Aalayam | `sqlite:///./aalayam.db` |
| `CORS_ORIGINS` | Aalayam | `http://localhost:5173,http://127.0.0.1:5173` |
| `SMARTDARSHAN_DATASET_ZIP` | SmartDarshan | looks in `data/` |
| `SMARTDARSHAN_REFERENCE_ZIP` | SmartDarshan | looks in `data/` |
| `SMARTDARSHAN_ATTENDANCE_CSV` | SmartDarshan | looks in `data/` |
| `SMARTDARSHAN_TRAFFIC_CSV` | SmartDarshan | looks in `data/` |

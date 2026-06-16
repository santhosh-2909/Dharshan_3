from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .db import Base, SessionLocal, engine
from .routers import anomaly, auth, bookings, cctv, crowd, donations, events, faq, feedback, final_report, history, live_crowd, parking, prediction, queue_wait, staffing, stats, temple
from .seed import seed
from .utils.logging_config import configure_logging

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_logging()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
    yield
    # Release the webcam + inference threads if the live-crowd feature was used.
    # No-op (and import is lazy) when the camera was never started.
    from .services.crowd_service import get_crowd_service

    get_crowd_service().shutdown()


app = FastAPI(
    title=f"{settings.app_name} API",
    description="Temple platform: bookings, donations, events, crowd insights.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "app": settings.app_name}


api_v1_routers = [auth, temple, events, bookings, donations, feedback, faq, crowd, stats, parking, cctv, final_report, prediction, queue_wait, staffing, anomaly, history]
for router_module in api_v1_routers:
    app.include_router(router_module.router, prefix="/api/v1")

# Real-time webcam crowd detection (YOLOv8). Mounted at /api/crowd/* per the
# integration contract — distinct from the /api/v1/crowd analytics router.
# Registered before the SPA catch-all below so its routes win.
app.include_router(live_crowd.router, prefix="/api")


frontend_dist_dir = Path(__file__).resolve().parents[2] / "frontend" / "dist"
frontend_index_file = frontend_dist_dir / "index.html"


@app.get("/", include_in_schema=False)
def serve_frontend_root():
    if frontend_index_file.exists():
        return FileResponse(frontend_index_file)
    return {"message": "Frontend build not found. Build temple/frontend to serve the SPA."}


@app.get("/{full_path:path}", include_in_schema=False)
def serve_frontend(full_path: str):
    if full_path == "api" or full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Not Found")

    if not frontend_index_file.exists():
        return {"message": "Frontend build not found. Build temple/frontend to serve the SPA."}

    requested_path = frontend_dist_dir / full_path
    if full_path and requested_path.exists() and requested_path.is_file():
        return FileResponse(requested_path)

    return FileResponse(frontend_index_file)

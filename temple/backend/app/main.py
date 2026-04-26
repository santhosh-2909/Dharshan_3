from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .db import Base, SessionLocal, engine
from .routers import auth, bookings, cctv, crowd, donations, events, faq, feedback, final_report, parking, prediction, stats, temple
from .seed import seed

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
    yield


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


api_v1_routers = [auth, temple, events, bookings, donations, feedback, faq, crowd, stats, parking, cctv, final_report, prediction]
for router_module in api_v1_routers:
    app.include_router(router_module.router, prefix="/api/v1")

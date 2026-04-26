from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Event
from ..schemas import EventOut

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[EventOut])
def list_events(
    upcoming_only: bool = Query(default=True),
    festival_only: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> list[Event]:
    query = db.query(Event)
    if upcoming_only:
        query = query.filter(Event.ends_on >= date.today())
    if festival_only:
        query = query.filter(Event.is_festival.is_(True))
    return query.order_by(Event.starts_on).all()

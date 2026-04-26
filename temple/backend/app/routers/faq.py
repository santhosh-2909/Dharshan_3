from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import FAQ
from ..schemas import FAQOut

router = APIRouter(prefix="/faq", tags=["faq"])


@router.get("", response_model=list[FAQOut])
def list_faq(db: Session = Depends(get_db)) -> list[FAQ]:
    return db.query(FAQ).order_by(FAQ.sort_order, FAQ.id).all()

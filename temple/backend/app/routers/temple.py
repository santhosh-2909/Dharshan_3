from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import TempleInfo
from ..schemas import TempleInfoOut

router = APIRouter(prefix="/temple", tags=["temple"])


@router.get("", response_model=list[TempleInfoOut])
def list_temples(db: Session = Depends(get_db)) -> list[TempleInfo]:
    return db.query(TempleInfo).order_by(TempleInfo.name_en).all()


@router.get("/{slug}", response_model=TempleInfoOut)
def get_temple(slug: str, db: Session = Depends(get_db)) -> TempleInfo:
    temple = db.query(TempleInfo).filter(TempleInfo.slug == slug).first()
    if not temple:
        raise HTTPException(status_code=404, detail="Temple not found")
    return temple

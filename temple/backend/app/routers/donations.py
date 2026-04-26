from secrets import token_hex

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_optional_user
from ..models import Donation, User
from ..schemas import CheckoutIntent, DonationCreate, DonationOut

router = APIRouter(prefix="/donations", tags=["donations"])


@router.get("/causes")
def causes() -> list[dict]:
    return [
        {"id": "annadhanam", "name_en": "Annadhanam (food offering)", "name_ta": "அன்னதானம்", "min_inr": 101},
        {"id": "deepa-aaradhanai", "name_en": "Deepa Aaradhanai", "name_ta": "தீப ஆராதனை", "min_inr": 51},
        {"id": "renovation", "name_en": "Temple renovation", "name_ta": "கோயில் புதுப்பிப்பு", "min_inr": 501},
        {"id": "vedic-school", "name_en": "Vedic school support", "name_ta": "வேத பாடசாலை", "min_inr": 251},
    ]


@router.post("", response_model=DonationOut, status_code=status.HTTP_201_CREATED)
def create_donation(
    payload: DonationCreate,
    user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
) -> Donation:
    donation = Donation(
        user_id=user.id if user else None,
        donor_name=payload.donor_name.strip(),
        purpose=payload.purpose.strip(),
        amount_inr=payload.amount_inr,
        reference=f"AAL-D-{token_hex(4).upper()}",
    )
    db.add(donation)
    db.commit()
    db.refresh(donation)
    return donation


@router.post("/{donation_id}/checkout", response_model=CheckoutIntent)
def checkout(donation_id: int, db: Session = Depends(get_db)) -> CheckoutIntent:
    donation = db.get(Donation, donation_id)
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    return CheckoutIntent(
        reference=donation.reference,
        amount_inr=donation.amount_inr,
        provider_order_id=f"order_{token_hex(8)}",
    )


@router.get("/recent", response_model=list[DonationOut])
def recent_donations(db: Session = Depends(get_db)) -> list[Donation]:
    return db.query(Donation).order_by(Donation.created_at.desc()).limit(8).all()

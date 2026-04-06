from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, ReviewCard
from app.schemas.schemas import ReviewCardOut, ReviewSubmitRequest, ReviewSubmitResponse
from app.services.spaced_repetition import calculate_next_review

router = APIRouter(prefix="/api/review", tags=["Review"])


@router.get("/due", response_model=list[ReviewCardOut])
def get_due_cards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all review cards due today for the current user."""
    cards = (
        db.query(ReviewCard)
        .filter(
            ReviewCard.user_id == current_user.id,
            ReviewCard.due_date <= datetime.utcnow(),
        )
        .order_by(ReviewCard.due_date)
        .all()
    )
    return cards


@router.post("/submit", response_model=ReviewSubmitResponse)
def submit_review(
    payload: ReviewSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = (
        db.query(ReviewCard)
        .filter(ReviewCard.id == payload.card_id, ReviewCard.user_id == current_user.id)
        .first()
    )
    if not card:
        raise HTTPException(404, "Review card not found")

    new_interval, new_ease, new_reps, due_date = calculate_next_review(
        interval=card.interval_days,
        ease_factor=card.ease_factor,
        repetitions=card.repetitions,
        result=payload.result,
    )

    card.interval_days = new_interval
    card.ease_factor = new_ease
    card.repetitions = new_reps
    card.due_date = due_date
    card.last_reviewed = datetime.utcnow()

    db.commit()
    db.refresh(card)

    return ReviewSubmitResponse(
        card_id=card.id,
        next_due_date=card.due_date,
        interval_days=card.interval_days,
    )

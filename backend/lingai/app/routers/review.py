from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.time import utc_now_naive
from app.models.user import User, ReviewCard
from app.schemas.schemas import ReviewCardOut, ReviewSubmitRequest, ReviewSubmitResponse
from app.services.spaced_repetition import (
    interval_days_for_step,
    next_step_for_result,
    schedule_due_for_step,
)

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
            ReviewCard.due_date <= utc_now_naive(),
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

    current_step = max(card.repetitions, 1)
    next_step = next_step_for_result(current_step, payload.result)
    card.repetitions = next_step
    card.interval_days = interval_days_for_step(next_step)
    card.due_date = schedule_due_for_step(next_step)
    card.last_reviewed = utc_now_naive()

    db.commit()
    db.refresh(card)

    return ReviewSubmitResponse(
        card_id=card.id,
        next_due_date=card.due_date,
        interval_days=card.interval_days,
    )

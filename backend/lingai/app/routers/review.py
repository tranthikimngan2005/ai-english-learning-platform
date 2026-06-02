from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.schemas import ReviewCardOut, ReviewSubmitRequest, ReviewSubmitResponse, RecentMistakeOut
from app.services.review_service import (
    get_due_cards as get_due_cards_service,
    get_mistakes as get_mistakes_service,
    get_recent_mistakes as get_recent_mistakes_service,
    get_srs_cards as get_srs_cards_service,
    submit_review as submit_review_service,
)

router = APIRouter(prefix="/api/review", tags=["Review"])


@router.get("/recent-mistakes", response_model=list[RecentMistakeOut])
def get_recent_mistakes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_recent_mistakes_service(db, current_user)


@router.get("/mistakes", response_model=list[RecentMistakeOut])
def get_mistakes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_mistakes_service(db, current_user)


@router.get("/due", response_model=list[ReviewCardOut])
def get_due_cards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_due_cards_service(db, current_user)


@router.get("/srs", response_model=list[ReviewCardOut])
def get_srs_cards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_srs_cards_service(db, current_user)


@router.post("/submit", response_model=ReviewSubmitResponse)
def submit_review(
    payload: ReviewSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return submit_review_service(db, current_user, payload)

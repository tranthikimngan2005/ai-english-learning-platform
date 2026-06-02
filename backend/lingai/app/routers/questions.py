from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import LevelEnum, SkillEnum, User
from app.schemas.schemas import (
    PracticeSessionRequest,
    PracticeSessionResponse,
    QuestionCreate,
    QuestionOut,
    RecommendationResponse,
    SubmitAnswerRequest,
    SubmitAnswerResponse,
)
from app.services.question_service import (
    create_question as create_question_service,
    delete_question as delete_question_service,
    list_questions as list_questions_service,
    recommendations as recommendations_service,
    start_practice as start_practice_service,
    submit_answer as submit_answer_service,
    update_question as update_question_service,
)

router = APIRouter(prefix="/api/questions", tags=["Questions"])


# ──────────────────────────────────────────────
# CRUD
# ──────────────────────────────────────────────

@router.get("", response_model=list[QuestionOut])
def list_questions(
    skill: Optional[SkillEnum] = Query(None),
    level: Optional[LevelEnum] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("creator", "admin")),
):
    return list_questions_service(db, current_user, skill=skill, level=level)


@router.post("", response_model=QuestionOut, status_code=201)
def create_question(
    payload: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("creator", "admin")),
):
    return create_question_service(db, current_user, payload)


@router.put("/{qid}", response_model=QuestionOut)
def update_question(
    qid: int,
    payload: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("creator", "admin")),
):
    return update_question_service(db, current_user, qid, payload)


@router.delete("/{qid}", status_code=204)
def delete_question(
    qid: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("creator", "admin")),
):
    delete_question_service(db, current_user, qid)


@router.get("/recommendations", response_model=list[RecommendationResponse])
def recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return recommendations_service(db, current_user)


# ──────────────────────────────────────────────
# Practice session
# ──────────────────────────────────────────────

@router.post("/practice/start", response_model=PracticeSessionResponse)
def start_practice(
    payload: PracticeSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return start_practice_service(db, current_user, payload)


# ──────────────────────────────────────────────
# Submit answer
# ──────────────────────────────────────────────

@router.post("/practice/submit", response_model=SubmitAnswerResponse)
def submit_answer(
    payload: SubmitAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return submit_answer_service(db, current_user, payload)

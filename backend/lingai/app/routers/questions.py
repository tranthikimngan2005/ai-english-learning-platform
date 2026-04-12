import random
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import (
    User, Question, QuestionAttempt, SkillProfile, ReviewCard,
    ContentStatusEnum, SkillEnum, LevelEnum
)
from app.schemas.schemas import (
    QuestionCreate, QuestionOut,
    SubmitAnswerRequest, SubmitAnswerResponse,
    PracticeSessionRequest, PracticeSessionResponse,
)
from app.services.spaced_repetition import (
    interval_days_for_step,
    level_up_check,
    next_level,
    schedule_due_for_step,
)
from app.services.streak import update_streak

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
    q = db.query(Question)
    if skill:
        q = q.filter(Question.skill == skill)
    if level:
        q = q.filter(Question.level == level)
    return q.order_by(Question.created_at.desc()).all()


@router.post("", response_model=QuestionOut, status_code=201)
def create_question(
    payload: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("creator", "admin")),
):
    q = Question(
        **payload.model_dump(),
        creator_id=current_user.id,
        status=ContentStatusEnum.approved,
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return q


@router.put("/{qid}", response_model=QuestionOut)
def update_question(
    qid: int,
    payload: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("creator", "admin")),
):
    q = db.query(Question).filter(Question.id == qid).first()
    if not q:
        raise HTTPException(404, "Question not found")
    if q.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Not your question")
    for k, v in payload.model_dump().items():
        setattr(q, k, v)
    # Question updates are published immediately; no admin moderation step.
    q.status = ContentStatusEnum.approved
    db.commit()
    db.refresh(q)
    return q


@router.delete("/{qid}", status_code=204)
def delete_question(
    qid: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("creator", "admin")),
):
    q = db.query(Question).filter(Question.id == qid).first()
    if not q:
        raise HTTPException(404, "Question not found")
    if q.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Not your question")
    db.delete(q)
    db.commit()


# ──────────────────────────────────────────────
# Practice session
# ──────────────────────────────────────────────

@router.post("/practice/start", response_model=PracticeSessionResponse)
def start_practice(
    payload: PracticeSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns N approved questions for a skill, adaptive by user's current level.
    Mix: 70% current level, 30% one level below (for confidence) or above (for stretch).
    """
    profile = (
        db.query(SkillProfile)
        .filter(SkillProfile.user_id == current_user.id, SkillProfile.skill == payload.skill)
        .first()
    )
    current_level = profile.current_level if profile else LevelEnum.A1

    approved_q = (
        db.query(Question)
        .filter(
            Question.skill == payload.skill,
            Question.status == ContentStatusEnum.approved,
            Question.level == current_level,
        )
        .all()
    )

    if len(approved_q) < payload.count:
        # pad with any level
        extra = (
            db.query(Question)
            .filter(
                Question.skill == payload.skill,
                Question.status == ContentStatusEnum.approved,
            )
            .all()
        )
        pool = list({q.id: q for q in approved_q + extra}.values())
    else:
        pool = approved_q

    selected = random.sample(pool, min(payload.count, len(pool)))
    return PracticeSessionResponse(questions=selected)


# ──────────────────────────────────────────────
# Submit answer
# ──────────────────────────────────────────────

@router.post("/practice/submit", response_model=SubmitAnswerResponse)
def submit_answer(
    payload: SubmitAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    question = db.query(Question).filter(Question.id == payload.question_id).first()
    if not question:
        raise HTTPException(404, "Question not found")

    is_correct = payload.user_answer.strip().lower() == question.correct_answer.strip().lower()
    xp = 10 if is_correct else 2

    # Save attempt
    attempt = QuestionAttempt(
        user_id=current_user.id,
        question_id=question.id,
        user_answer=payload.user_answer,
        is_correct=is_correct,
    )
    db.add(attempt)

    # Update skill profile
    profile = (
        db.query(SkillProfile)
        .filter(SkillProfile.user_id == current_user.id, SkillProfile.skill == question.skill)
        .first()
    )
    if profile:
        profile.questions_done += 1
        if is_correct:
            profile.questions_correct += 1

        # Level up check
        if level_up_check(profile.questions_done, profile.questions_correct):
            new_level = next_level(profile.current_level.value)
            if new_level:
                profile.current_level = new_level
                profile.questions_done = 0
                profile.questions_correct = 0

    # Only wrong answers are queued for recommendation/review.
    if not is_correct:
        card = (
            db.query(ReviewCard)
            .filter(ReviewCard.user_id == current_user.id, ReviewCard.question_id == question.id)
            .first()
        )
        if not card:
            card = ReviewCard(
                user_id=current_user.id,
                question_id=question.id,
            )
            db.add(card)

        card.repetitions = 1
        card.interval_days = interval_days_for_step(card.repetitions)
        card.due_date = schedule_due_for_step(card.repetitions)

    # Update streak
    update_streak(db, current_user)

    db.commit()

    return SubmitAnswerResponse(
        is_correct=is_correct,
        correct_answer=question.correct_answer,
        explanation=question.explanation,
        ai_feedback=None,  # AI feedback hooked in chat router
        xp_gained=xp,
    )

import random
import re
import hashlib
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import (
    User, Question, QuestionAttempt, SkillProfile, ReviewCard,
    ContentStatusEnum, SkillEnum, LevelEnum
)
from app.schemas.schemas import (
    QuestionCreate, QuestionOut, RecommendationResponse,
    SubmitAnswerRequest, SubmitAnswerResponse,
    PracticeSessionRequest, PracticeSessionResponse,
    PassageObject,
)
from app.services.spaced_repetition import (
    interval_days_for_step,
    level_up_check,
    next_level,
    schedule_due_for_step,
)
from app.services.streak import update_streak
from app.services.recommendation import get_recommendations, track_user_error

router = APIRouter(prefix="/api/questions", tags=["Questions"])


def _extract_blank_number(question: Question) -> int:
    text = (question.content or "").strip()
    match = re.search(r"\((\d+)\)", text)
    if match:
        return int(match.group(1))
    return question.id


def _build_passage_id(passage: str) -> str:
    normalized = (passage or "").strip().lower()
    if not normalized:
        return "passage-unknown"
    digest = hashlib.md5(normalized.encode("utf-8")).hexdigest()[:8]
    first_line = normalized.splitlines()[0][:28].strip().replace(" ", "-")
    first_line = re.sub(r"[^a-z0-9\-]", "", first_line)
    first_line = first_line or "passage"
    return f"{first_line}-{digest}"


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
        # Sửa ép kiểu so sánh Enum tương thích với PostgreSQL
        level_val = level.name if hasattr(level, 'name') else level
        q = q.filter(or_(Question.level == level, Question.level == level_val))
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


@router.get("/recommendations", response_model=list[RecommendationResponse])
def recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return due review questions based on the user's past mistakes."""
    return get_recommendations(current_user.id, db)


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

    base_query = (
        db.query(Question)
        .filter(
            Question.skill == payload.skill,
            Question.status == ContentStatusEnum.approved,
        )
    )

    if payload.part is not None:
        base_query = base_query.filter(Question.part == payload.part)

    # 🌟 ĐOẠN SỬA LỖI CHÍ MẠNG: Đảm bảo tương thích so sánh Enum cả kiểu Object lẫn kiểu Chuỗi/Số trong Postgres
    level_name = current_level.name if hasattr(current_level, 'name') else current_level
    level_questions = base_query.filter(or_(Question.level == current_level, Question.level == level_name)).all()
    
    if len(level_questions) < payload.count:
        pool = list({q.id: q for q in level_questions + base_query.all()}.values())
    else:
        pool = level_questions

    if payload.part in (6, 7):
        grouped: dict[str, list[Question]] = {}
        for question in pool:
            passage_text = (question.passage or "").strip()
            if not passage_text:
                continue
            passage_id = _build_passage_id(passage_text)
            grouped.setdefault(passage_id, []).append(question)

        passage_objects: list[PassageObject] = []
        for passage_id, items in grouped.items():
            sorted_items = sorted(items, key=_extract_blank_number)
            passage_objects.append(
                PassageObject(
                    passage_id=passage_id,
                    part=int(sorted_items[0].part),
                    passage=sorted_items[0].passage or "",
                    questions=sorted_items,
                )
            )

        if payload.part == 6:
            passage_objects = [p for p in passage_objects if 3 <= len(p.questions) <= 4]

        random.shuffle(passage_objects)
        selected_passages: list[PassageObject] = []
        question_budget = max(int(payload.count), 1)
        running_questions = 0
        for passage_obj in passage_objects:
            selected_passages.append(passage_obj)
            running_questions += len(passage_obj.questions)
            if running_questions >= question_budget:
                break

        return PracticeSessionResponse(questions=[], passages=selected_passages)

    selected = random.sample(pool, min(payload.count, len(pool)))
    return PracticeSessionResponse(questions=selected, passages=[])


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

    attempt = QuestionAttempt(
        user_id=current_user.id,
        question_id=question.id,
        user_answer=payload.user_answer,
        is_correct=is_correct,
    )
    db.add(attempt)

    profile = (
        db.query(SkillProfile)
        .filter(SkillProfile.user_id == current_user.id, SkillProfile.skill == question.skill)
        .first()
    )
    if profile:
        profile.questions_done += 1
        if is_correct:
            profile.questions_correct += 1

        if level_up_check(profile.questions_done, profile.questions_correct):
            # Ép kiểu an toàn khi gọi hàm xử lý nâng cấp cấp độ
            current_lv_val = profile.current_level.value if hasattr(profile.current_level, 'value') else profile.current_level
            new_level = next_level(current_lv_val)
            if new_level:
                profile.current_level = new_level
                profile.questions_done = 0
                profile.questions_correct = 0

    track_user_error(current_user.id, question.id, is_correct, db)

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

    update_streak(db, current_user)
    db.commit()

    return SubmitAnswerResponse(
        is_correct=is_correct,
        correct_answer=question.correct_answer,
        explanation=question.explanation,
        ai_feedback=None,
        xp_gained=xp,
    )
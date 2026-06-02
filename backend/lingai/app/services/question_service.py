from __future__ import annotations

import hashlib
import random
import re
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import (
    ContentStatusEnum,
    LevelEnum,
    Question,
    QuestionAttempt,
    ReviewCard,
    SkillEnum,
    SkillProfile,
    User,
)
from app.schemas.schemas import (
    PassageObject,
    PracticeSessionRequest,
    PracticeSessionResponse,
    QuestionCreate,
    RecommendationResponse,
    SubmitAnswerRequest,
    SubmitAnswerResponse,
)
from app.services.analytics_service import get_recommendations, track_user_error
from app.services.spaced_repetition import (
    interval_days_for_step,
    level_up_check,
    next_level,
    schedule_due_for_step,
)
from app.services.streak import update_streak


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


def list_questions(
    db: Session,
    current_user: User,
    skill: Optional[SkillEnum] = None,
    level: Optional[LevelEnum] = None,
) -> list[Question]:
    query = db.query(Question)
    if skill:
        query = query.filter(Question.skill == skill)
    if level:
        query = query.filter(Question.level == level)
    return query.order_by(Question.created_at.desc()).all()


def create_question(db: Session, current_user: User, payload: QuestionCreate) -> Question:
    question = Question(
        **payload.model_dump(),
        creator_id=current_user.id,
        status=ContentStatusEnum.approved,
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


def update_question(db: Session, current_user: User, qid: int, payload: QuestionCreate) -> Question:
    question = db.query(Question).filter(Question.id == qid).first()
    if not question:
        raise HTTPException(404, "Question not found")
    if question.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Not your question")
    for key, value in payload.model_dump().items():
        setattr(question, key, value)
    question.status = ContentStatusEnum.approved
    db.commit()
    db.refresh(question)
    return question


def delete_question(db: Session, current_user: User, qid: int) -> None:
    question = db.query(Question).filter(Question.id == qid).first()
    if not question:
        raise HTTPException(404, "Question not found")
    if question.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Not your question")
    db.delete(question)
    db.commit()


def recommendations(db: Session, current_user: User) -> list[RecommendationResponse]:
    return get_recommendations(current_user.id, db)


def start_practice(db: Session, current_user: User, payload: PracticeSessionRequest) -> PracticeSessionResponse:
    profile = (
        db.query(SkillProfile)
        .filter(SkillProfile.user_id == current_user.id, SkillProfile.skill == payload.skill)
        .first()
    )
    current_level = profile.current_level if profile else LevelEnum.A1

    base_query = db.query(Question).filter(
        Question.skill == payload.skill,
        Question.status == ContentStatusEnum.approved,
    )
    if payload.part is not None:
        base_query = base_query.filter(Question.part == payload.part)

    level_questions = base_query.filter(Question.level == current_level).all()
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


def submit_answer(db: Session, current_user: User, payload: SubmitAnswerRequest) -> SubmitAnswerResponse:
    question = db.query(Question).filter(Question.id == payload.question_id).first()
    if not question:
        raise HTTPException(404, "Question not found")

    is_correct = payload.user_answer.strip().lower() == question.correct_answer.strip().lower()
    xp = 10 if is_correct else 2

    db.add(
        QuestionAttempt(
            user_id=current_user.id,
            question_id=question.id,
            user_answer=payload.user_answer,
            is_correct=is_correct,
        )
    )

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
            new_level = next_level(profile.current_level.value)
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
            card = ReviewCard(user_id=current_user.id, question_id=question.id)
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
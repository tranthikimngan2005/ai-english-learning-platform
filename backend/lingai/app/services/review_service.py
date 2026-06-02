from __future__ import annotations

import random
from datetime import timedelta

from fastapi import HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.time import utc_now_naive
from app.models.user import Question, QuestionAttempt, ReviewCard, ReviewResultEnum, User
from app.schemas.schemas import RecentMistakeOut, ReviewSubmitRequest, ReviewSubmitResponse
from app.services.analytics_service import track_user_error
from app.services.spaced_repetition import (
    interval_days_for_step,
    next_step_for_result,
    schedule_due_for_step,
)


def _distinct_attempts(attempts: list[QuestionAttempt]) -> list[QuestionAttempt]:
    distinct_attempts: list[QuestionAttempt] = []
    seen_question_ids: set[int] = set()
    for attempt in attempts:
        if attempt.question_id in seen_question_ids:
            continue
        seen_question_ids.add(attempt.question_id)
        distinct_attempts.append(attempt)
    return distinct_attempts


def get_recent_mistakes(db: Session, current_user: User) -> list[RecentMistakeOut]:
    latest_attempt = (
        db.query(QuestionAttempt)
        .filter(QuestionAttempt.user_id == current_user.id)
        .order_by(desc(QuestionAttempt.attempted_at))
        .first()
    )
    if not latest_attempt:
        return []

    session_start = latest_attempt.attempted_at - timedelta(minutes=90)
    attempts = (
        db.query(QuestionAttempt)
        .join(Question, QuestionAttempt.question_id == Question.id)
        .filter(
            QuestionAttempt.user_id == current_user.id,
            QuestionAttempt.is_correct.is_(False),
            QuestionAttempt.attempted_at >= session_start,
            QuestionAttempt.attempted_at <= latest_attempt.attempted_at,
            Question.id.isnot(None),
        )
        .order_by(desc(QuestionAttempt.attempted_at))
        .all()
    )

    return [
        RecentMistakeOut(
            attempt_id=attempt.id,
            user_answer=attempt.user_answer,
            attempted_at=attempt.attempted_at,
            question=attempt.question,
        )
        for attempt in _distinct_attempts(attempts)
    ]


def get_mistakes(db: Session, current_user: User) -> list[RecentMistakeOut]:
    attempts = (
        db.query(QuestionAttempt)
        .join(Question, QuestionAttempt.question_id == Question.id)
        .filter(
            QuestionAttempt.user_id == current_user.id,
            QuestionAttempt.is_correct.is_(False),
            Question.id.isnot(None),
        )
        .order_by(desc(QuestionAttempt.attempted_at))
        .limit(200)
        .all()
    )

    return [
        RecentMistakeOut(
            attempt_id=attempt.id,
            user_answer=attempt.user_answer,
            attempted_at=attempt.attempted_at,
            question=attempt.question,
        )
        for attempt in _distinct_attempts(attempts)
    ]


def get_due_cards(db: Session, current_user: User) -> list[ReviewCard]:
    cards = (
        db.query(ReviewCard)
        .join(Question, ReviewCard.question_id == Question.id)
        .filter(
            ReviewCard.user_id == current_user.id,
            ReviewCard.due_date <= utc_now_naive(),
            Question.id.isnot(None),
        )
        .order_by(ReviewCard.due_date)
        .all()
    )

    distinct_cards: list[ReviewCard] = []
    seen_question_ids: set[int] = set()
    for card in cards:
        if card.question_id in seen_question_ids:
            continue
        seen_question_ids.add(card.question_id)
        distinct_cards.append(card)

    random.shuffle(distinct_cards)
    return distinct_cards


def get_srs_cards(db: Session, current_user: User) -> list[ReviewCard]:
    return get_due_cards(db, current_user)


def submit_review(db: Session, current_user: User, payload: ReviewSubmitRequest) -> ReviewSubmitResponse:
    card = (
        db.query(ReviewCard)
        .join(Question, ReviewCard.question_id == Question.id)
        .filter(ReviewCard.id == payload.card_id, ReviewCard.user_id == current_user.id)
        .first()
    )
    if not card:
        raise HTTPException(404, "Review card not found")

    current_step = max(card.repetitions, 1)
    tags = str(card.question.tags or "").lower() if card.question else ""
    is_flashcard = "flashcard" in tags or "vocab" in tags

    if is_flashcard:
        if payload.result == ReviewResultEnum.again:
            next_step = 2
        elif payload.result == ReviewResultEnum.hard:
            next_step = 3
        else:
            next_step = 4
    else:
        next_step = next_step_for_result(current_step, payload.result)

    card.repetitions = next_step
    card.interval_days = interval_days_for_step(next_step)
    card.due_date = schedule_due_for_step(next_step)
    card.last_reviewed = utc_now_naive()

    track_user_error(
        user_id=current_user.id,
        question_id=card.question_id,
        is_correct=payload.result != ReviewResultEnum.again,
        db=db,
    )

    db.commit()
    db.refresh(card)

    return ReviewSubmitResponse(
        card_id=card.id,
        next_due_date=card.due_date,
        interval_days=card.interval_days,
    )
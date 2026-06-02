from __future__ import annotations

import json
from collections import Counter
from datetime import timedelta
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.time import utc_now_naive
from app.models.user import Question, QuestionAttempt, UserErrorTrack
from app.schemas.schemas import QuestionResponse


def _batch_snapshot_path() -> Path:
    return Path(settings.ANALYTICS_BATCH_SNAPSHOT_PATH)


def _load_batch_snapshot() -> dict[str, Any] | None:
    path = _batch_snapshot_path()
    if not path.exists():
        return None

    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None

    if not isinstance(raw, dict):
        return None
    return raw


def _normalize_recommendation_item(item: dict[str, Any]) -> dict[str, Any]:
    question = item.get("question")
    next_review = item.get("next_review")
    if isinstance(question, dict):
        question_data = QuestionResponse.model_validate(question).model_dump(mode="json")
    else:
        question_data = question
    if hasattr(next_review, "isoformat"):
        next_review = next_review.isoformat()
    return {"question": question_data, "next_review": next_review}


def _batch_recommendations_for_user(user_id: int) -> list[dict[str, Any]] | None:
    snapshot = _load_batch_snapshot()
    if not snapshot:
        return None

    recommendations = snapshot.get("recommendations")
    if not isinstance(recommendations, dict):
        return None

    items = recommendations.get(str(user_id))
    if items is None:
        items = recommendations.get(user_id)
    if items is None:
        return None
    if not isinstance(items, list):
        return None
    normalized: list[dict[str, Any]] = []
    for item in items:
        if isinstance(item, dict):
            normalized.append(_normalize_recommendation_item(item))
    return normalized


def _batch_failed_tags() -> list[dict[str, Any]] | None:
    snapshot = _load_batch_snapshot()
    if not snapshot:
        return None

    failed_tags = snapshot.get("failed_tags")
    if not isinstance(failed_tags, list):
        return None

    normalized: list[dict[str, Any]] = []
    for item in failed_tags:
        if not isinstance(item, dict):
            continue
        tag = item.get("tag")
        fail_count = item.get("fail_count")
        if isinstance(tag, str) and fail_count is not None:
            normalized.append({"tag": tag, "fail_count": int(fail_count)})
    return normalized


def refresh_batch_snapshot() -> dict[str, Any] | None:
    """Public helper to load and return the current batch snapshot.

    Returns the raw snapshot dict or None on error/missing file.
    """
    return _load_batch_snapshot()


def update_user_error_with_db(db: Session, user_id: int, question_id: int, is_correct: bool) -> UserErrorTrack | None:
    now = utc_now_naive()
    track = (
        db.query(UserErrorTrack)
        .filter(
            UserErrorTrack.user_id == user_id,
            UserErrorTrack.question_id == question_id,
        )
        .first()
    )

    if not is_correct:
        if not track:
            track = UserErrorTrack(
                user_id=user_id,
                question_id=question_id,
                error_count=1,
                last_attempt=now,
                next_review=now + timedelta(days=3),
                status="pending",
            )
            db.add(track)
        else:
            track.error_count += 1
            track.last_attempt = now
            track.next_review = now + timedelta(days=1)
            track.status = "pending"

        db.commit()
        db.refresh(track)
        return track

    if not track:
        return None

    is_due_review = track.status == "pending" and track.next_review is not None and track.next_review <= now
    if is_due_review:
        track.last_attempt = now
        if track.error_count <= 1:
            track.status = "mastered"
            track.next_review = None
            track.error_count = 0
        else:
            track.error_count -= 1
            track.next_review = now + timedelta(days=7)
            track.status = "pending"

        db.commit()
        db.refresh(track)

    return track


def track_user_error(user_id: int, question_id: int, is_correct: bool, db: Session) -> UserErrorTrack | None:
    return update_user_error_with_db(db, user_id, question_id, is_correct)


def get_recommendations(user_id: int, db: Session) -> list[dict[str, Any]]:
    batch_items = _batch_recommendations_for_user(user_id)
    if batch_items is not None:
        return batch_items

    now = utc_now_naive()

    failed_attempts = (
        db.query(QuestionAttempt)
        .join(Question, Question.id == QuestionAttempt.question_id)
        .filter(
            QuestionAttempt.user_id == user_id,
            QuestionAttempt.is_correct.is_(False),
        )
        .order_by(QuestionAttempt.attempted_at.desc())
        .limit(200)
        .all()
    )

    recommendations: list[dict[str, Any]] = []
    seen_question_ids: set[int] = set()

    for attempt in failed_attempts:
        qid = int(attempt.question_id)
        if qid in seen_question_ids:
            continue
        seen_question_ids.add(qid)
        recommendations.append({"question": attempt.question, "next_review": attempt.attempted_at})

    tracks = (
        db.query(UserErrorTrack)
        .join(Question, Question.id == UserErrorTrack.question_id)
        .filter(
            UserErrorTrack.user_id == user_id,
            UserErrorTrack.status == "pending",
            UserErrorTrack.next_review.isnot(None),
            UserErrorTrack.next_review <= now,
        )
        .order_by(UserErrorTrack.next_review.asc())
        .all()
    )

    for track in tracks:
        qid = int(track.question_id)
        if qid in seen_question_ids:
            continue
        seen_question_ids.add(qid)
        recommendations.append({"question": track.question, "next_review": track.next_review})

    return recommendations


def build_failed_tag_counts(db: Session) -> list[dict[str, int | str]]:
    batch_items = _batch_failed_tags()
    if batch_items is not None:
        return batch_items

    failed_rows = (
        db.query(Question.tags)
        .join(QuestionAttempt, QuestionAttempt.question_id == Question.id)
        .filter(QuestionAttempt.is_correct.is_(False), Question.tags.isnot(None))
        .all()
    )

    counter: Counter[str] = Counter()
    ignore_prefixes = ("category:", "difficulty:")

    for (raw_tags,) in failed_rows:
        if not raw_tags:
            continue
        for raw_tag in raw_tags.split(","):
            tag = raw_tag.strip()
            if not tag or tag == "flashcard_vocab" or any(tag.startswith(prefix) for prefix in ignore_prefixes):
                continue
            counter[tag] += 1

    return [{"tag": tag, "fail_count": count} for tag, count in counter.most_common(8)]


def export_recommendation_snapshot(user_id: int, db: Session) -> list[dict[str, Any]]:
    return [
        {
            "question": QuestionResponse.model_validate(item["question"]).model_dump(mode="json")
            if not isinstance(item.get("question"), dict)
            else item["question"],
            "next_review": item.get("next_review").isoformat() if hasattr(item.get("next_review"), "isoformat") else item.get("next_review"),
        }
        for item in get_recommendations(user_id, db)
    ]


def export_batch_snapshot(db: Session, user_ids: list[int]) -> dict[str, Any]:
    return {
        "generated_at": utc_now_naive().isoformat(),
        "failed_tags": build_failed_tag_counts(db),
        "recommendations": {str(user_id): export_recommendation_snapshot(user_id, db) for user_id in user_ids},
    }

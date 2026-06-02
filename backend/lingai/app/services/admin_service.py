from __future__ import annotations

from datetime import timedelta

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.time import utc_now_naive
from app.models.user import (
    ContentStatusEnum,
    Lesson,
    Question,
    QuestionAttempt,
    SkillProfile,
    Streak,
    User,
)
from app.schemas.schemas import AdminStatsResponse, AdminUserOverview, FailedTagReportItem, UserBan, UserOut, UserUpdateRole
from app.services.analytics_service import build_failed_tag_counts


def get_stats(db: Session) -> AdminStatsResponse:
    week_ago = utc_now_naive() - timedelta(days=7)
    total_attempts = db.query(QuestionAttempt).count()
    correct_attempts = db.query(QuestionAttempt).filter(QuestionAttempt.is_correct.is_(True)).count()
    average_accuracy = round((correct_attempts / total_attempts) * 100, 1) if total_attempts else 0.0
    total_flashcards = (
        db.query(Question)
        .filter(Question.tags.isnot(None), Question.tags.contains("flashcard_vocab"))
        .count()
    )

    return AdminStatsResponse(
        total_users=db.query(User).count(),
        active_users_7d=db.query(User).filter(User.created_at >= week_ago).count(),
        total_questions=db.query(Question).count(),
        total_lessons=db.query(Lesson).count(),
        pending_lessons=db.query(Lesson).filter(Lesson.status == ContentStatusEnum.pending).count(),
        average_accuracy=average_accuracy,
        total_flashcards=total_flashcards,
    )


def list_users(db: Session, current_user: User) -> list[User]:
    return (
        db.query(User)
        .filter(User.id != current_user.id)
        .order_by(User.created_at.desc())
        .all()
    )


def users_overview(db: Session, current_user: User) -> list[AdminUserOverview]:
    users = list_users(db, current_user)

    streak_rows = {
        row.user_id: row.current_streak
        for row in db.query(Streak.user_id, Streak.current_streak).all()
    }

    done_rows = (
        db.query(SkillProfile.user_id, func.coalesce(func.sum(SkillProfile.questions_done), 0))
        .group_by(SkillProfile.user_id)
        .all()
    )
    done_map = {user_id: int(total_done or 0) for user_id, total_done in done_rows}

    level_rows = db.query(SkillProfile.user_id, SkillProfile.current_level).all()
    level_rank = {"A1": 1, "A2": 2, "B1": 3, "B2": 4, "C1": 5, "C2": 6}
    level_map: dict[int, str] = {}
    for user_id, level in level_rows:
        level_value = str(level.value if hasattr(level, "value") else level)
        current = level_map.get(user_id)
        if current is None or level_rank.get(level_value, 0) > level_rank.get(current, 0):
            level_map[user_id] = level_value

    return [
        AdminUserOverview(
            id=user.id,
            full_name=user.username,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            streak=int(streak_rows.get(user.id, 0) or 0),
            cefr_level=level_map.get(user.id, "A1"),
            questions_done=int(done_map.get(user.id, 0) or 0),
            created_at=user.created_at,
        )
        for user in users
    ]


def failed_tags_report(db: Session) -> list[FailedTagReportItem]:
    return [FailedTagReportItem(tag=item["tag"], fail_count=int(item["fail_count"])) for item in build_failed_tag_counts(db)]


def change_role(db: Session, current_user: User, user_id: int, payload: UserUpdateRole) -> User:
    if user_id == current_user.id:
        raise HTTPException(400, "Cannot change your own role")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user


def ban_user(db: Session, current_user: User, user_id: int, payload: UserBan) -> User:
    if user_id == current_user.id:
        raise HTTPException(400, "Cannot update your own active status")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return user


def pending_lessons(db: Session):
    return db.query(Lesson).filter(Lesson.status == ContentStatusEnum.pending).all()

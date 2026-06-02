from __future__ import annotations

from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import ContentStatusEnum, Lesson, LevelEnum, SkillEnum, User
from app.schemas.schemas import LessonCreate, LessonModerate


def list_lessons(
    db: Session,
    current_user: User,
    skill: Optional[SkillEnum] = None,
    level: Optional[LevelEnum] = None,
) -> list[Lesson]:
    query = db.query(Lesson)
    if current_user.role == "student":
        query = query.filter(Lesson.status == ContentStatusEnum.approved)
    elif current_user.role == "creator":
        query = query.filter(Lesson.creator_id == current_user.id)

    if skill:
        query = query.filter(Lesson.skill == skill)
    if level:
        query = query.filter(Lesson.level == level)
    return query.order_by(Lesson.created_at.desc()).all()


def get_lesson(db: Session, lesson_id: int) -> Lesson:
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(404, "Lesson not found")
    return lesson


def create_lesson(db: Session, current_user: User, payload: LessonCreate) -> Lesson:
    lesson = Lesson(**payload.model_dump(), creator_id=current_user.id)
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


def update_lesson(db: Session, current_user: User, lesson_id: int, payload: LessonCreate) -> Lesson:
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(404, "Lesson not found")
    if lesson.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Not your lesson")
    for key, value in payload.model_dump().items():
        setattr(lesson, key, value)
    db.commit()
    db.refresh(lesson)
    return lesson


def delete_lesson(db: Session, current_user: User, lesson_id: int) -> None:
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(404, "Lesson not found")
    if lesson.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Not your lesson")
    db.delete(lesson)
    db.commit()


def moderate_lesson(db: Session, lesson_id: int, payload: LessonModerate) -> Lesson:
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(404, "Lesson not found")
    lesson.status = payload.status
    db.commit()
    db.refresh(lesson)
    return lesson

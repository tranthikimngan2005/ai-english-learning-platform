from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import LevelEnum, SkillEnum, User
from app.schemas.schemas import LessonCreate, LessonModerate, LessonOut
from app.services.lesson_service import (
    create_lesson as create_lesson_service,
    delete_lesson as delete_lesson_service,
    get_lesson as get_lesson_service,
    list_lessons as list_lessons_service,
    moderate_lesson as moderate_lesson_service,
    update_lesson as update_lesson_service,
)

router = APIRouter(prefix="/api/lessons", tags=["Lessons"])


@router.get("", response_model=list[LessonOut])
def list_lessons(
    skill: Optional[SkillEnum] = Query(None),
    level: Optional[LevelEnum] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_lessons_service(db, current_user, skill=skill, level=level)


@router.get("/{lesson_id}", response_model=LessonOut)
def get_lesson(lesson_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return get_lesson_service(db, lesson_id)


@router.post("", response_model=LessonOut, status_code=201)
def create_lesson(
    payload: LessonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("creator", "admin")),
):
    return create_lesson_service(db, current_user, payload)


@router.put("/{lesson_id}", response_model=LessonOut)
def update_lesson(
    lesson_id: int,
    payload: LessonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("creator", "admin")),
):
    return update_lesson_service(db, current_user, lesson_id, payload)


@router.delete("/{lesson_id}", status_code=204)
def delete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("creator", "admin")),
):
    delete_lesson_service(db, current_user, lesson_id)


@router.patch("/{lesson_id}/moderate", response_model=LessonOut)
def moderate_lesson(
    lesson_id: int,
    payload: LessonModerate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    return moderate_lesson_service(db, lesson_id, payload)

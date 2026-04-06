from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_role
from app.models.user import User, Question, Lesson, ContentStatusEnum
from app.schemas.schemas import UserOut, UserUpdateRole, UserBan, AdminStatsResponse

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/stats", response_model=AdminStatsResponse)
def get_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    week_ago = datetime.utcnow() - timedelta(days=7)
    return AdminStatsResponse(
        total_users=db.query(User).count(),
        active_users_7d=db.query(User).filter(User.created_at >= week_ago).count(),
        total_questions=db.query(Question).count(),
        pending_questions=db.query(Question).filter(Question.status == ContentStatusEnum.pending).count(),
        total_lessons=db.query(Lesson).count(),
        pending_lessons=db.query(Lesson).filter(Lesson.status == ContentStatusEnum.pending).count(),
    )


@router.get("/users", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.patch("/users/{user_id}/role", response_model=UserOut)
def change_role(
    user_id: int,
    payload: UserUpdateRole,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/ban", response_model=UserOut)
def ban_user(
    user_id: int,
    payload: UserBan,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return user


@router.get("/content/pending/questions", response_model=list)
def pending_questions(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    return db.query(Question).filter(Question.status == ContentStatusEnum.pending).all()


@router.get("/content/pending/lessons", response_model=list)
def pending_lessons(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    return db.query(Lesson).filter(Lesson.status == ContentStatusEnum.pending).all()

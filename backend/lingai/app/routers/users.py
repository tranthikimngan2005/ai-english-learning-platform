from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.schemas import UserOut, DashboardResponse, SkillProfileOut
from app.services.user_service import get_dashboard as get_dashboard_service, get_progress as get_progress_service

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/me/dashboard", response_model=DashboardResponse)
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_dashboard_service(db, current_user)


@router.get("/me/progress", response_model=list[SkillProfileOut])
def get_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_progress_service(db, current_user)

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_role
from app.models.user import User
from app.schemas.schemas import (
    AdminStatsResponse,
    AdminUserOverview,
    FailedTagReportItem,
    UserBan,
    UserOut,
    UserUpdateRole,
)
from app.services.admin_service import (
    ban_user as ban_user_service,
    change_role as change_role_service,
    failed_tags_report as failed_tags_report_service,
    get_stats as get_stats_service,
    list_users as list_users_service,
    pending_lessons as pending_lessons_service,
    users_overview as users_overview_service,
)
from app.services.analytics_service import refresh_batch_snapshot

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/stats", response_model=AdminStatsResponse)
def get_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    return get_stats_service(db)


@router.get("/users", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    return list_users_service(db, current_user)


@router.get("/users/overview", response_model=list[AdminUserOverview])
def users_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    return users_overview_service(db, current_user)


@router.get("/reports/failed-tags", response_model=list[FailedTagReportItem])
def failed_tags_report(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    return failed_tags_report_service(db)


@router.patch("/users/{user_id}/role", response_model=UserOut)
def change_role(
    user_id: int,
    payload: UserUpdateRole,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    return change_role_service(db, current_user, user_id, payload)


@router.patch("/users/{user_id}/ban", response_model=UserOut)
def ban_user(
    user_id: int,
    payload: UserBan,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    return ban_user_service(db, current_user, user_id, payload)


@router.get("/content/pending/lessons", response_model=list)
def pending_lessons(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    return pending_lessons_service(db)


@router.post("/refresh-recommendations")
def refresh_recommendations(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    """Load the configured batch snapshot from disk (Databricks export) and return it.

    This is a manual admin operation useful for testing or one-off refreshes.
    """
    snap = refresh_batch_snapshot()
    if snap is None:
        return {"status": "missing_or_invalid_snapshot"}
    return {"status": "ok", "snapshot": snap}

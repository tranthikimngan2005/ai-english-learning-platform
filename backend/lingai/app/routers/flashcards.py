from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.schemas.schemas import FlashcardManageIn, FlashcardManageOut, FlashcardOut
from app.services.flashcard_service import (
    create_manage_flashcard as create_manage_flashcard_service,
    delete_manage_flashcard as delete_manage_flashcard_service,
    list_library as list_library_service,
    list_manage_flashcards as list_manage_flashcards_service,
    match_game as match_game_service,
    update_manage_flashcard as update_manage_flashcard_service,
)

router = APIRouter(prefix="/api/flashcards", tags=["Flashcards"])


@router.get("", response_model=list[FlashcardOut])
def library(
    category: str | None = Query(None),
    difficulty: str | None = Query(None),
    random: bool = Query(False),
    shuffle: bool = Query(False),
    limit: int | None = Query(None, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_library_service(db, current_user, category=category, difficulty=difficulty, random=random, shuffle=shuffle, limit=limit)


@router.get("/match", response_model=list[FlashcardOut])
def match_game(
    category: str | None = Query(None),
    difficulty: str | None = Query(None),
    random: bool = Query(True),
    shuffle: bool = Query(False),
    limit: int = Query(8, ge=2, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return match_game_service(db, current_user, category=category, difficulty=difficulty, random=random, shuffle=shuffle, limit=limit)


@router.get("/manage", response_model=list[FlashcardManageOut])
def list_manage_flashcards(
    category: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("creator", "admin")),
):
    return list_manage_flashcards_service(db, current_user, category=category)


@router.post("/manage", response_model=FlashcardManageOut, status_code=201)
def create_manage_flashcard(
    payload: FlashcardManageIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("creator", "admin")),
):
    return create_manage_flashcard_service(db, current_user, payload)


@router.put("/manage/{flashcard_id}", response_model=FlashcardManageOut)
def update_manage_flashcard(
    flashcard_id: int,
    payload: FlashcardManageIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("creator", "admin")),
):
    return update_manage_flashcard_service(db, current_user, flashcard_id, payload)


@router.delete("/manage/{flashcard_id}", status_code=204)
def delete_manage_flashcard(
    flashcard_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("creator", "admin")),
):
    delete_manage_flashcard_service(db, current_user, flashcard_id)

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.schemas import RegisterRequest, TokenResponse
from app.services.identity import authenticate_user, build_token_response, register_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    user = register_user(db, payload.username, payload.email, payload.password)
    token = build_token_response(user)
    return TokenResponse(access_token=token, user_id=user.id, username=user.username, role=user.role)


@router.post("/login", response_model=TokenResponse)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form.username, form.password)
    token = build_token_response(user)
    return TokenResponse(access_token=token, user_id=user.id, username=user.username, role=user.role)

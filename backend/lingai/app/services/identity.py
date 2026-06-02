from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import LevelEnum, SkillEnum, SkillProfile, Streak, User


def _init_user_data(db: Session, user: User) -> None:
    for skill in SkillEnum:
        db.add(SkillProfile(user_id=user.id, skill=skill, current_level=LevelEnum.A1))
    db.add(Streak(user_id=user.id, current_streak=0, longest_streak=0))
    db.commit()


def register_user(db: Session, username: str, email: str, password: str) -> User:
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        username=username,
        email=email,
        hashed_password=hash_password(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    _init_user_data(db, user)
    return user


def authenticate_user(db: Session, identifier: str, password: str) -> User:
    user = (
        db.query(User).filter(User.email == identifier).first()
        or db.query(User).filter(User.username == identifier).first()
    )
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is banned")
    return user


def build_token_response(user: User):
    token = create_access_token({"sub": user.id})
    return token
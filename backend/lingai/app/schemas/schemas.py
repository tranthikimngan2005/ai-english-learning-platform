"""
Pydantic schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, field_validator
from app.models.user import RoleEnum, SkillEnum, LevelEnum, QuestionTypeEnum, ContentStatusEnum, ReviewResultEnum


# ──────────────────────────────────────────────
# Auth
# ──────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    role: RoleEnum


# ──────────────────────────────────────────────
# User
# ──────────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    role: RoleEnum
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdateRole(BaseModel):
    role: RoleEnum


class UserBan(BaseModel):
    is_active: bool


# ──────────────────────────────────────────────
# Skill Profile
# ──────────────────────────────────────────────

class SkillProfileOut(BaseModel):
    skill: SkillEnum
    current_level: LevelEnum
    questions_done: int
    questions_correct: int
    accuracy: float

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────
# Lesson
# ──────────────────────────────────────────────

class LessonCreate(BaseModel):
    title: str
    skill: SkillEnum
    level: LevelEnum
    content: str
    audio_url: Optional[str] = None


class LessonOut(BaseModel):
    id: int
    title: str
    skill: SkillEnum
    level: LevelEnum
    content: str
    audio_url: Optional[str]
    status: ContentStatusEnum
    creator_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class LessonModerate(BaseModel):
    status: ContentStatusEnum


# ──────────────────────────────────────────────
# Question
# ──────────────────────────────────────────────

class QuestionCreate(BaseModel):
    lesson_id: Optional[int] = None
    skill: SkillEnum
    level: LevelEnum
    q_type: QuestionTypeEnum
    content: str
    options: Optional[List[str]] = None   # MCQ choices
    correct_answer: str
    explanation: Optional[str] = None
    ai_prompt: Optional[str] = None
    audio_url: Optional[str] = None


class QuestionOut(BaseModel):
    id: int
    lesson_id: Optional[int]
    skill: SkillEnum
    level: LevelEnum
    q_type: QuestionTypeEnum
    content: str
    options: Optional[List[str]]
    correct_answer: str
    explanation: Optional[str]
    audio_url: Optional[str]
    status: ContentStatusEnum
    creator_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class QuestionModerate(BaseModel):
    status: ContentStatusEnum


# ──────────────────────────────────────────────
# Practice / Attempt
# ──────────────────────────────────────────────

class SubmitAnswerRequest(BaseModel):
    question_id: int
    user_answer: str


class SubmitAnswerResponse(BaseModel):
    is_correct: bool
    correct_answer: str
    explanation: Optional[str]
    ai_feedback: Optional[str]
    xp_gained: int


class PracticeSessionRequest(BaseModel):
    skill: SkillEnum
    count: int = 10


class PracticeSessionResponse(BaseModel):
    questions: List[QuestionOut]


# ──────────────────────────────────────────────
# Spaced Repetition
# ──────────────────────────────────────────────

class ReviewCardOut(BaseModel):
    id: int
    question_id: int
    interval_days: int
    ease_factor: float
    repetitions: int
    due_date: datetime
    question: QuestionOut

    model_config = {"from_attributes": True}


class ReviewSubmitRequest(BaseModel):
    card_id: int
    result: ReviewResultEnum   # again | hard | good | easy


class ReviewSubmitResponse(BaseModel):
    card_id: int
    next_due_date: datetime
    interval_days: int


# ──────────────────────────────────────────────
# Streak
# ──────────────────────────────────────────────

class StreakOut(BaseModel):
    current_streak: int
    longest_streak: int
    last_active_date: Optional[datetime]

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────
# Progress / Dashboard
# ──────────────────────────────────────────────

class DashboardResponse(BaseModel):
    streak: StreakOut
    skill_profiles: List[SkillProfileOut]
    due_reviews: int
    total_questions_done: int


# ──────────────────────────────────────────────
# AI Chat
# ──────────────────────────────────────────────

class ChatMessageIn(BaseModel):
    content: str
    system_prompt: Optional[str] = None


class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────
# Admin Analytics
# ──────────────────────────────────────────────

class AdminStatsResponse(BaseModel):
    total_users: int
    active_users_7d: int
    total_questions: int
    total_lessons: int
    pending_lessons: int

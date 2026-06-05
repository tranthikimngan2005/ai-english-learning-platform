from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import Base, engine, get_db
from app.core.security import get_current_user
from app.models.user import User
from app.routers import auth, users, lessons, questions, review, chat, admin, flashcards
from app.services.recommendation import get_recommendations

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Pengwin Backend",
    description="English learning platform API — skills, practice, spaced repetition, AI chat",
    version="1.0.0",
)

# 🌟 CẤU HÌNH CORS ĐỒNG BỘ: Cho phép tên miền Vercel truy cập kèm theo mã bảo mật Token (Credentials)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://ai-english-learning-platform-neon.vercel.app"
    ],  # Cho phép chính xác domain Frontend local và production gọi vào
    allow_credentials=True,   # BẮT BUỘC PHẢI LÀ TRUE để hệ thống xác thực Token không bị sập nguồn lỗi 500
    allow_methods=["*"],      # Cho phép tất cả các phương thức GET, POST, PUT, DELETE
    allow_headers=["*"],      # Cho phép tất cả các loại Header truyền lên (bao gồm Authorization)
)

# Đăng ký các Router hệ thống
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(lessons.router)
app.include_router(questions.router)
app.include_router(review.router)
app.include_router(flashcards.router)
app.include_router(chat.router)
app.include_router(admin.router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "app": "Pengwin API v1.0"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}


@app.get("/api/recommendations", tags=["Recommendations"])
def recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Compatibility endpoint for dashboard recommendation refresh."""
    return get_recommendations(current_user.id, db)
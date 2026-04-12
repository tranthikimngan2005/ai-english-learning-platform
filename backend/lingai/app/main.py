from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base, engine
from app.routers import auth, users, lessons, questions, review, chat, admin

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Pengwin Backend",
    description="English learning platform API — skills, practice, spaced repetition, AI chat",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(lessons.router)
app.include_router(questions.router)
app.include_router(review.router)
app.include_router(chat.router)
app.include_router(admin.router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "app": "Pengwin API v1.0"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}

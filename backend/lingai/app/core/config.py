import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

BASE_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DB_URL = f"sqlite:///{(BASE_DIR / 'lingai.db').as_posix()}"

# Lấy link DATABASE_URL từ môi trường Render
_raw_db_url = os.getenv("DATABASE_URL", DEFAULT_DB_URL)

# 🌟 CỰC KỲ QUAN TRỌNG: Render trả về "postgres://..." nhưng SQLAlchemy bắt buộc phải là "postgresql://"
if _raw_db_url.startswith("postgres://"):
    _raw_db_url = _raw_db_url.replace("postgres://", "postgresql://", 1)

class Settings(BaseSettings):
    APP_NAME: str = "Pengwin"
    SECRET_KEY: str = "change-this-in-production-use-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Gán giá trị đã được chuẩn hóa vào đây
    DATABASE_URL: str = _raw_db_url
    
    FRONTEND_ORIGINS: str = os.getenv("FRONTEND_ORIGINS", "http://localhost:3000")
    LLM_PROVIDER: str = "groq"  # groq | gemini | openai
    LLM_API_KEY: Optional[str] = None
    LLM_BASE_URL: str = "https://api.groq.com/openai/v1"
    LLM_MODEL: str = "llama-3.1-8b-instant"
    LLM_TIMEOUT_SECONDS: int = 30

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
    )

settings = Settings()
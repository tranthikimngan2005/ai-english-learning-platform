from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "LingAI"
    SECRET_KEY: str = "change-this-in-production-use-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    DATABASE_URL: str = "sqlite:///./lingai.db"

    class Config:
        env_file = ".env"

settings = Settings()

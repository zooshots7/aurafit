import os
from pydantic_settings import BaseSettings

DEFAULT_UPLOAD_DIR = "/tmp/aurafit-uploads" if os.getenv("VERCEL") else "uploads"


class Settings(BaseSettings):
    mock_mode: bool = True
    anthropic_api_key: str = ""
    cors_origins: str = "http://localhost:3000"
    database_url: str = "postgresql+asyncpg://aurafit:aurafit@localhost:5432/aurafit"
    upload_dir: str = DEFAULT_UPLOAD_DIR

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

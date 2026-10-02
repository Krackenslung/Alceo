import os

from dotenv import load_dotenv

load_dotenv()


def _list(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


class Config:
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "")
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "")
    GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
    GOOGLE_CLIENT_ID: str = os.environ.get("GOOGLE_CLIENT_ID", "")
    CORS_ORIGINS: list[str] = _list(os.environ.get("CORS_ORIGINS", "http://localhost:5173"))
    TOKEN_MAX_AGE_SECONDS: int = int(os.environ.get("TOKEN_MAX_AGE_SECONDS", "604800"))
    MIN_AGE: int = int(os.environ.get("MIN_AGE", "16"))

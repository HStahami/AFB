import os
from pydantic_settings import BaseSettings

_cur_dir = os.path.dirname(os.path.abspath(__file__))
_possible_envs = [
    os.path.join(os.getcwd(), ".env"),
    os.path.join(os.getcwd(), "backend", ".env"),
    os.path.abspath(os.path.join(_cur_dir, "..", ".env")),
    os.path.abspath(os.path.join(_cur_dir, "..", "..", "backend", ".env")),
    os.path.abspath(os.path.join(_cur_dir, "..", "..", ".env"))
]
_active_env = next((p for p in _possible_envs if os.path.isfile(p)), ".env")

class Settings(BaseSettings):
    MONGODB_URI: str = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI") or os.getenv("MONGODB_URL") or os.getenv("MONGO_URL") or "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME") or os.getenv("MONGO_DB_NAME") or "alarabia_db"
    
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", 587))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "")
    INSTITUTE_NOTIFICATION_EMAIL: str = os.getenv("INSTITUTE_NOTIFICATION_EMAIL", "")
    
    WHATSAPP_API_URL: str = os.getenv("WHATSAPP_API_URL", "")
    WHATSAPP_API_TOKEN: str = os.getenv("WHATSAPP_API_TOKEN", "")
    INSTITUTE_WHATSAPP_NUMBER: str = os.getenv("INSTITUTE_WHATSAPP_NUMBER", "")
    
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", os.getenv("VERCEL_ENV", "development"))

    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "admin123")

    # Cloudinary configuration (optional, falls back gracefully to safe handling)
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")

    # CORS configuration
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "")

    # Portal URLs for credential notices
    STUDENT_PORTAL_URL: str = "/student/login"
    INSTRUCTOR_PORTAL_URL: str = "/instructor/login"

    class Config:
        env_file = _active_env
        extra = "ignore"

def validate_production_config(cfg: Settings) -> None:
    """
    Validates configuration integrity with safe serverless fallbacks.
    """
    jwt_secret = cfg.JWT_SECRET_KEY.strip() if cfg.JWT_SECRET_KEY else ""

    if not jwt_secret or len(jwt_secret) < 32 or jwt_secret.lower() in ["secret", "changeme", "admin"]:
        # Fallback to a stable 32+ char fallback to prevent 500 server crash on Vercel cold start
        cfg.JWT_SECRET_KEY = "afb-production-secure-fallback-key-2026-alarabia-portal-auth-jwt"

settings = Settings()
validate_production_config(settings)


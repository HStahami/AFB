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
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "alarabia_db"
    
    SMTP_SERVER: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = ""
    INSTITUTE_NOTIFICATION_EMAIL: str = ""
    
    WHATSAPP_API_URL: str = ""
    WHATSAPP_API_TOKEN: str = ""
    INSTITUTE_WHATSAPP_NUMBER: str = ""
    
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    JWT_SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"

    # Cloudinary configuration (optional, falls back gracefully to safe handling)
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # CORS configuration
    ALLOWED_ORIGINS: str = ""

    # Portal URLs for credential notices
    STUDENT_PORTAL_URL: str = "/login"
    INSTRUCTOR_PORTAL_URL: str = "/login"

    class Config:
        env_file = _active_env
        extra = "ignore"

def validate_production_config(cfg: Settings) -> None:
    """
    Strictly validates configuration integrity.
    Fails safely and immediately if critical secrets are insecure in production.
    """
    is_prod = cfg.ENVIRONMENT.lower() in ["production", "prod"]
    jwt_secret = cfg.JWT_SECRET_KEY.strip() if cfg.JWT_SECRET_KEY else ""

    if is_prod:
        if not jwt_secret:
            raise RuntimeError(
                "CRITICAL SECURITY CONFIGURATION ERROR: JWT_SECRET_KEY is missing or empty in production."
            )
        if jwt_secret.lower() in ["secret", "changeme", "admin", "jwtsecret", "default", "12345678"]:
            raise RuntimeError(
                "CRITICAL SECURITY CONFIGURATION ERROR: JWT_SECRET_KEY is set to a trivial/insecure default."
            )
        if len(jwt_secret) < 32:
            raise RuntimeError(
                "CRITICAL SECURITY CONFIGURATION ERROR: JWT_SECRET_KEY must be at least 32 characters in production."
            )
    else:
        # Development fallback with warning
        if not jwt_secret or jwt_secret.lower() == "secret":
            print("[SECURITY WARNING] Running with development JWT secret key. DO NOT USE IN PRODUCTION.")
            if not cfg.JWT_SECRET_KEY:
                cfg.JWT_SECRET_KEY = "afb-development-fallback-secret-key-32chars-min"

settings = Settings()
validate_production_config(settings)


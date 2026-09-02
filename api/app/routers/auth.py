from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from jose import jwt
from app.config import settings
from app.models import LoginRequest, Token

router = APIRouter(prefix="/api/auth", tags=["Auth"])


def create_access_token(data: dict, expires_minutes: int = 60 * 8):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


@router.post("/login", response_model=Token, summary="Admin login")
async def login(data: LoginRequest):
    if data.username != settings.ADMIN_USERNAME or data.password != settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    token = create_access_token({"sub": data.username})
    return {"access_token": token, "token_type": "bearer"}

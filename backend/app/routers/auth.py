from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, status
from app.config import settings
from app.database import get_db
from app.models import LoginRequest, Token, UserResponse, ChangePasswordRequest
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])


async def _resolve_user_response(db, user: dict) -> UserResponse:
    """Helper to enrich UserResponse with linked entity IDs and onboarding status."""
    user_id = user["_id"]
    role = user.get("role", "student")
    student_id = None
    instructor_id = None

    student_code = user.get("student_code")
    if role == "student":
        student = await db.students.find_one({"user_id": user_id})
        if not student:
            student = await db.students.find_one({"email": user.get("email")})
        if student:
            student_id = str(student["_id"])
            if not student_code:
                student_code = student.get("student_code")
    elif role == "instructor":
        instructor = await db.instructors.find_one({"user_id": user_id})
        if not instructor:
            instructor = await db.instructors.find_one({"email": user.get("email")})
        if instructor:
            instructor_id = str(instructor["_id"])

    first_login = user.get("first_login", False)
    profile_completed = user.get("profile_completed", True)

    if first_login:
        onboarding_status = "first_login_required"
    elif not profile_completed:
        onboarding_status = "profile_completion_required"
    else:
        onboarding_status = "completed"

    return UserResponse(
        id=str(user["_id"]),
        username=user.get("username", ""),
        email=user.get("email", ""),
        role=role,
        status=user.get("status", "active"),
        first_login=first_login,
        profile_completed=profile_completed,
        student_code=student_code,
        student_id=student_id,
        instructor_id=instructor_id,
        onboarding_status=onboarding_status,
        created_at=user.get("created_at")
    )


@router.post("/login", response_model=Token, summary="Multi-role User & Admin login")
async def login(data: LoginRequest):
    """
    Unified login endpoint for Admin, Instructor, and Student.
    Authenticates against MongoDB `users` collection using Argon2id.
    Supports login via username, email, or student_code.
    """
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service unavailable. Please try again later."
        )

    identifier = data.username.strip()
    identifier_lower = identifier.lower()

    # Query by username, email, or student_code (case-insensitive)
    import re
    safe_regex = re.escape(identifier)
    user = await db.users.find_one({
        "$or": [
            {"username": {"$regex": f"^{safe_regex}$", "$options": "i"}},
            {"email": {"$regex": f"^{safe_regex}$", "$options": "i"}},
            {"student_code": {"$regex": f"^{safe_regex}$", "$options": "i"}},
            {"username": identifier},
            {"username": identifier_lower},
            {"email": identifier},
            {"email": identifier_lower},
            {"student_code": identifier}
        ]
    })

    # Bootstrap fallback for Admin if users collection is empty
    if not user and (identifier_lower == settings.ADMIN_USERNAME.lower() or identifier_lower == "admin"):
        if data.password == settings.ADMIN_PASSWORD:
            admin_doc = {
                "username": settings.ADMIN_USERNAME.strip().lower(),
                "email": (settings.EMAIL_FROM or "admin@alarabia.edu").strip().lower(),
                "password_hash": hash_password(settings.ADMIN_PASSWORD),
                "role": "admin",
                "status": "active",
                "first_login": False,
                "profile_completed": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            res = await db.users.insert_one(admin_doc)
            user = admin_doc
            user["_id"] = res.inserted_id

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    # Verify password with Argon2id
    if not verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    # Verify status
    if user.get("status", "active") != "active" or user.get("is_active") is False:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact administration."
        )


    # Update last login timestamp
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login_at": datetime.utcnow()}}
    )

    token_data = {
        "sub": str(user["_id"]),
        "role": user.get("role", "student"),
        "email": user.get("email", "")
    }
    token = create_access_token(token_data)
    user_response = await _resolve_user_response(db, user)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_response
    }


@router.get("/me", response_model=UserResponse, summary="Get current authenticated user profile")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return the profile of the currently authenticated user."""
    db = get_db()
    user = await db.users.find_one({"_id": current_user["_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")
    return await _resolve_user_response(db, user)


@router.post("/change-password", summary="Change current user password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    """Allow an authenticated user to change their password."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    user = await db.users.find_one({"_id": current_user["_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(data.old_password, user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    new_hash = hash_password(data.new_password)
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "password_hash": new_hash,
                "first_login": False,
                "updated_at": datetime.utcnow()
            }
        }
    )
    return {"message": "Password changed successfully."}

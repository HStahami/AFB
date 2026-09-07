from typing import List, Optional
from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import get_db
from app.core.security import decode_access_token

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    """
    Dependency that validates the Bearer JWT token, fetches the user
    from the database, and verifies the account is active.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = credentials.credentials
    payload = decode_access_token(token)

    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, expired, or malformed authentication token.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user_id = payload["sub"]
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service unavailable."
        )

    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identifier in token.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account does not exist or has been removed.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if user.get("status", "active") != "active" or user.get("is_active") is False:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive or disabled."
        )


    # Sanitize: strip out password hash before passing user downstream
    sanitized_user = {k: v for k, v in user.items() if k != "password_hash"}
    sanitized_user["id"] = str(user["_id"])
    sanitized_user["_id"] = user["_id"]
    return sanitized_user


def require_roles(allowed_roles: List[str]):
    """
    Factory creating a dependency that checks if the authenticated user
    possesses one of the allowed roles.
    """
    async def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: You do not have permission to access this resource."
            )
        return current_user

    return role_checker


# Role shortcut dependencies
require_admin = require_roles(["admin"])
require_instructor = require_roles(["instructor", "admin"])
require_student = require_roles(["student", "admin"])


async def get_student_context(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Ensures the user is a student or admin, and resolves their linked student record.
    """
    db = get_db()
    if current_user.get("role") == "student":
        student = await db.students.find_one({"user_id": current_user["_id"]})
        if not student:
            student = await db.students.find_one({"email": current_user.get("email")})
        if not student and current_user.get("student_code"):
            student = await db.students.find_one({"student_code": current_user["student_code"]})
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found for this account."
            )
        current_user["student_id"] = student["_id"]
        current_user["student_record"] = student
    return current_user


async def get_instructor_context(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Ensures the user is an instructor or admin, and resolves their linked instructor record.
    """
    db = get_db()
    if current_user.get("role") == "instructor":
        instructor = await db.instructors.find_one({"user_id": current_user["_id"]})
        if not instructor:
            instructor = await db.instructors.find_one({"email": current_user.get("email")})
        if not instructor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Instructor profile not found for this account."
            )
        current_user["instructor_id"] = instructor["_id"]
        current_user["instructor_record"] = instructor
    return current_user


async def verify_student_access(current_user: dict, target_student_id: ObjectId, db) -> bool:
    """
    Enforces resource-level access control for student data:
    - Admin: full access
    - Student: access ONLY if target_student_id matches their own student ID
    - Instructor: access ONLY if assigned to target student via an active enrollment
    """
    role = current_user.get("role")
    if role == "admin":
        return True

    target_oid = target_student_id if isinstance(target_student_id, ObjectId) else ObjectId(target_student_id)

    if role == "student":
        student = await db.students.find_one({"user_id": current_user["_id"]})
        if not student or student["_id"] != target_oid:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You are not authorized to access another student's records."
            )
        return True

    if role == "instructor":
        instructor = await db.instructors.find_one({"user_id": current_user["_id"]})
        if not instructor:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Instructor profile not linked."
            )
        # Check if enrollment exists between this instructor and target student
        has_enrollment = await db.enrollments.find_one({
            "instructor_id": instructor["_id"],
            "student_id": target_oid
        })
        # Or legacy instructor check on student record
        legacy_assigned = await db.students.find_one({
            "_id": target_oid,
            "$or": [
                {"instructor_id": instructor["_id"]},
                {"instructor": instructor.get("name")}
            ]
        })
        if not has_enrollment and not legacy_assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: This student is not assigned to your classes."
            )
        return True

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied: Unauthorized role."
    )

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, status
from app.database import get_db
from app.core.dependencies import get_current_user, verify_student_access
from app.services.reporting_service import get_student_progress_summary

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/me", summary="Get dynamic progress report for current student")
@router.get("/my-report", summary="Get dynamic progress report for current student")
async def get_my_report(current_user: dict = Depends(get_current_user)):
    """
    Computes real-time progress for the logged-in student:
    enrollments, task completion rate, attendance statistics, assessments average.
    """
    db = get_db()
    if current_user.get("role") != "student" and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied: Student account required.")

    student = await db.students.find_one({"user_id": current_user["_id"]})
    if not student:
        student = await db.students.find_one({"email": current_user.get("email")})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    rep = await get_student_progress_summary(db, student["_id"])
    rep["student_name"] = f"{student.get('first_name', '')} {student.get('last_name', '')}".strip() or student.get("name", "Student")
    rep["student_code"] = student.get("student_code", "")
    return rep


@router.get("/student/{student_id}", summary="Get dynamic progress report for a student (Admin or Assigned Instructor)")
async def get_student_report(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Computes real-time progress for a given student.
    Enforces resource authorization: Admin has full access, Instructor only if assigned.
    """
    db = get_db()
    try:
        student_oid = ObjectId(student_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid student ID format.")

    await verify_student_access(current_user, student_oid, db)
    return await get_student_progress_summary(db, student_oid)

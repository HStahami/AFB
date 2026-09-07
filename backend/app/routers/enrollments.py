from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, status
from app.database import get_db
from app.models import EnrollmentCreate, EnrollmentUpdate, EnrollmentResponse
from app.core.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/api/enrollments", tags=["Enrollments"])


def _format_enrollment(doc: dict) -> dict:
    doc["id"] = str(doc["_id"])
    doc["_id"] = str(doc["_id"])
    if doc.get("student_id"):
        doc["student_id"] = str(doc["student_id"])
    if doc.get("module_id"):
        doc["module_id"] = str(doc["module_id"])
    if doc.get("instructor_id"):
        doc["instructor_id"] = str(doc["instructor_id"])
    if doc.get("slot_id"):
        doc["slot_id"] = str(doc["slot_id"])
    return doc


@router.post("/", summary="Create a new student enrollment (Admin Only)")
async def create_enrollment(
    data: EnrollmentCreate,
    admin_user: dict = Depends(require_admin)
):
    db = get_db()
    try:
        student_oid = ObjectId(data.student_id)
        student = await db.students.find_one({"_id": student_oid})
        if not student:
            raise HTTPException(status_code=404, detail="Student not found.")

        module_oid = ObjectId(data.module_id) if data.module_id else None
        instructor_oid = ObjectId(data.instructor_id) if data.instructor_id else None
        slot_oid = ObjectId(data.slot_id) if data.slot_id else None

        doc = {
            "student_id": student_oid,
            "module_id": module_oid,
            "instructor_id": instructor_oid,
            "slot_id": slot_oid,
            "status": data.status or "active",
            "start_date": data.start_date or datetime.utcnow(),
            "end_date": data.end_date,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        res = await db.enrollments.insert_one(doc)
        doc["_id"] = res.inserted_id
        return _format_enrollment(doc)
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR creating enrollment: {e}")
        raise HTTPException(status_code=500, detail="Could not create enrollment.")


@router.get("/", summary="List enrollments (Scoped by user role)")
async def list_enrollments(current_user: dict = Depends(get_current_user)):
    db = get_db()
    role = current_user.get("role")
    query = {}

    if role == "admin":
        pass  # sees all
    elif role == "student":
        student = await db.students.find_one({"user_id": current_user["_id"]})
        if not student:
            student = await db.students.find_one({"email": current_user.get("email")})
        if not student:
            return []
        query["student_id"] = student["_id"]
    elif role == "instructor":
        instructor = await db.instructors.find_one({"user_id": current_user["_id"]})
        if not instructor:
            instructor = await db.instructors.find_one({"email": current_user.get("email")})
        if not instructor:
            return []
        query["instructor_id"] = instructor["_id"]
    else:
        return []

    enrollments = []
    async for doc in db.enrollments.find(query).sort("created_at", -1):
        enrollments.append(_format_enrollment(doc))
    return enrollments


@router.get("/{id}", summary="Get a specific enrollment by ID")
async def get_enrollment(id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        enr_oid = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid enrollment ID.")

    doc = await db.enrollments.find_one({"_id": enr_oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Enrollment not found.")

    role = current_user.get("role")
    if role == "student":
        student = await db.students.find_one({"user_id": current_user["_id"]})
        if not student or doc.get("student_id") != student["_id"]:
            raise HTTPException(status_code=403, detail="Access denied.")
    elif role == "instructor":
        instructor = await db.instructors.find_one({"user_id": current_user["_id"]})
        if not instructor or doc.get("instructor_id") != instructor["_id"]:
            raise HTTPException(status_code=403, detail="Access denied.")

    return _format_enrollment(doc)


@router.patch("/{id}", summary="Update enrollment (Admin Only)")
async def update_enrollment(
    id: str,
    data: EnrollmentUpdate,
    admin_user: dict = Depends(require_admin)
):
    db = get_db()
    try:
        enr_oid = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid enrollment ID.")

    update_fields = {k: v for k, v in data.model_dump().items() if v is not None}
    if "module_id" in update_fields and update_fields["module_id"]:
        update_fields["module_id"] = ObjectId(update_fields["module_id"])
    if "instructor_id" in update_fields and update_fields["instructor_id"]:
        update_fields["instructor_id"] = ObjectId(update_fields["instructor_id"])
    if "slot_id" in update_fields and update_fields["slot_id"]:
        update_fields["slot_id"] = ObjectId(update_fields["slot_id"])

    update_fields["updated_at"] = datetime.utcnow()

    res = await db.enrollments.update_one({"_id": enr_oid}, {"$set": update_fields})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Enrollment not found.")
    return {"message": "Enrollment updated successfully."}

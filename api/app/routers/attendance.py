from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, status, Query
from app.database import get_db
from app.models import AttendanceCreate, AttendanceResponse
from app.core.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])


def _clean_doc(doc):
    """Recursively converts all ObjectId instances in dict or list to string."""
    if isinstance(doc, dict):
        cleaned = {}
        for k, v in doc.items():
            if k == "_id" or isinstance(v, ObjectId):
                cleaned[k] = str(v)
            elif isinstance(v, list):
                cleaned[k] = [_clean_doc(item) for item in v]
            elif isinstance(v, dict):
                cleaned[k] = _clean_doc(v)
            else:
                cleaned[k] = v
        if "_id" in cleaned and "id" not in cleaned:
            cleaned["id"] = cleaned["_id"]
        return cleaned
    elif isinstance(doc, list):
        return [_clean_doc(item) for item in doc]
    elif isinstance(doc, ObjectId):
        return str(doc)
    return doc


async def _format_attendance(doc: dict, db=None) -> dict:
    doc["id"] = str(doc["_id"])
    doc["_id"] = str(doc["_id"])
    student_oid = doc.get("student_id")
    if student_oid:
        doc["student_id"] = str(student_oid)
    if doc.get("instructor_id"):
        doc["instructor_id"] = str(doc["instructor_id"])
    if doc.get("slot_id"):
        doc["slot_id"] = str(doc["slot_id"])
    if doc.get("enrollment_id"):
        doc["enrollment_id"] = str(doc["enrollment_id"])
    if doc.get("module_id"):
        doc["module_id"] = str(doc["module_id"])

    if db is not None and student_oid and "student_name" not in doc:
        student = await db.students.find_one({"_id": student_oid if isinstance(student_oid, ObjectId) else ObjectId(student_oid)})
        if student:
            doc["student_name"] = f"{student.get('first_name', '')} {student.get('last_name', '')}".strip()
            doc["student_code"] = student.get("student_code", "")
        else:
            doc["student_name"] = "Student"
            doc["student_code"] = ""

    return _clean_doc(doc)


@router.post("/", summary="Record attendance (Instructor or Admin)")
async def record_attendance(
    data: AttendanceCreate,
    current_user: dict = Depends(require_roles(["instructor", "admin"]))
):
    db = get_db()
    valid_statuses = ["present", "absent", "late", "excused"]
    if data.status.lower() not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {valid_statuses}")

    try:
        student_oid = ObjectId(data.student_id)
        student = await db.students.find_one({"_id": student_oid})
        if not student:
            raise HTTPException(status_code=404, detail="Student not found.")

        # Determine instructor_id and verify assignment authorization
        inst_oid = None
        if current_user.get("role") == "instructor":
            instructor = await db.instructors.find_one({"user_id": current_user["_id"]})
            if not instructor:
                instructor = await db.instructors.find_one({"email": current_user.get("email")})
            if not instructor:
                raise HTTPException(status_code=403, detail="Instructor profile not linked.")
            inst_oid = instructor["_id"]

            student_assigned = bool(await db.students.find_one({
                "_id": student_oid,
                "instructor_id": inst_oid
            }))
            enrollment_assigned = bool(await db.enrollments.find_one({
                "student_id": student_oid,
                "instructor_id": inst_oid,
                "status": "active"
            }))

            if not (student_assigned or enrollment_assigned):
                raise HTTPException(
                    status_code=403,
                    detail="Access denied: You are not authorized to record attendance for this student."
                )
        else:
            inst_oid = current_user["_id"]

        enrollment_oid = None
        if data.enrollment_id:
            try:
                enrollment_oid = ObjectId(data.enrollment_id)
            except Exception:
                enrollment_oid = str(data.enrollment_id)

        slot_oid = None
        if data.slot_id:
            try:
                slot_oid = ObjectId(data.slot_id)
            except Exception:
                slot_oid = str(data.slot_id)

        attendance_filter = {
            "student_id": student_oid,
            "date": data.date,
            "slot_id": slot_oid
        }
        update_doc = {
            "$set": {
                "instructor_id": inst_oid,
                "enrollment_id": enrollment_oid,
                "slot_id": slot_oid,
                "status": data.status.lower(),
                "remarks": data.remarks,
                "updated_at": datetime.utcnow()
            },
            "$setOnInsert": {
                "created_at": datetime.utcnow()
            }
        }
        await db.attendance.update_one(attendance_filter, update_doc, upsert=True)

        doc = await db.attendance.find_one(attendance_filter)
        return await _format_attendance(doc, db)
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR recording attendance: {e}")
        raise HTTPException(status_code=500, detail="Could not record attendance.")


@router.post("/bulk", summary="Record attendance in bulk (Instructor or Admin)")
async def record_attendance_bulk(
    records: List[AttendanceCreate],
    current_user: dict = Depends(require_roles(["instructor", "admin"]))
):
    db = get_db()
    valid_statuses = ["present", "absent", "late", "excused"]

    # Determine instructor_id
    inst_oid = None
    is_instructor = current_user.get("role") == "instructor"
    if is_instructor:
        instructor = await db.instructors.find_one({"user_id": current_user["_id"]})
        if not instructor:
            instructor = await db.instructors.find_one({"email": current_user.get("email")})
        if not instructor:
            raise HTTPException(status_code=403, detail="Instructor profile not linked.")
        inst_oid = instructor["_id"]
    else:
        inst_oid = current_user["_id"]

    saved_count = 0
    errors = []
    for item in records:
        if item.status.lower() not in valid_statuses:
            errors.append(f"Invalid status {item.status} for student {item.student_id}")
            continue
        try:
            student_oid = ObjectId(item.student_id)

            if is_instructor:
                student_assigned = bool(await db.students.find_one({
                    "_id": student_oid,
                    "instructor_id": inst_oid
                }))
                enrollment_assigned = bool(await db.enrollments.find_one({
                    "student_id": student_oid,
                    "instructor_id": inst_oid,
                    "status": "active"
                }))
                if not (student_assigned or enrollment_assigned):
                    errors.append(f"Unauthorized: Student {item.student_id} is not assigned to you.")
                    continue

            enrollment_oid = None
            if item.enrollment_id:
                try:
                    enrollment_oid = ObjectId(item.enrollment_id)
                except Exception:
                    enrollment_oid = str(item.enrollment_id)

            slot_oid = None
            if item.slot_id:
                try:
                    slot_oid = ObjectId(item.slot_id)
                except Exception:
                    slot_oid = str(item.slot_id)

            attendance_filter = {
                "student_id": student_oid,
                "date": item.date,
                "slot_id": slot_oid
            }
            update_doc = {
                "$set": {
                    "instructor_id": inst_oid,
                    "enrollment_id": enrollment_oid,
                    "slot_id": slot_oid,
                    "status": item.status.lower(),
                    "remarks": item.remarks,
                    "updated_at": datetime.utcnow()
                },
                "$setOnInsert": {
                    "created_at": datetime.utcnow()
                }
            }
            await db.attendance.update_one(attendance_filter, update_doc, upsert=True)
            saved_count += 1
        except Exception as err:
            errors.append(f"Error saving {item.student_id}: {str(err)}")

    return {"message": "Bulk attendance processed", "saved_count": saved_count, "errors": errors}



@router.get("/my-records", summary="Get current logged-in student's attendance records")
async def get_my_attendance_records(current_user: dict = Depends(get_current_user)):
    return await list_attendance(current_user=current_user)


@router.get("/", summary="List attendance records (Scoped by role with filters)")
async def list_attendance(
    date: Optional[str] = None,
    student_id: Optional[str] = None,
    slot_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    role = current_user.get("role")
    query = {}

    if role == "admin":
        pass
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

    if date and isinstance(date, str):
        query["date"] = date
    if student_id and isinstance(student_id, str):
        try:
            query["student_id"] = ObjectId(student_id)
        except Exception:
            pass
    if slot_id and isinstance(slot_id, str):
        try:
            query["slot_id"] = ObjectId(slot_id)
        except Exception:
            pass

    records = []
    async for doc in db.attendance.find(query).sort("date", -1):
        records.append(await _format_attendance(doc, db))
    return records

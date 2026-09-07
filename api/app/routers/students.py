from bson import ObjectId
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status
from app.database import get_db
from app.models import StudentProfileUpdate
from app.core.dependencies import get_current_user, require_admin, verify_student_access
from app.services.email_service import send_email
from app.services.notification_service import create_notification
from app.services.reporting_service import get_student_progress_summary

router = APIRouter(prefix="/api/students", tags=["Students"])


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


@router.get("/", summary="Get all students (Admin Only)")
async def get_all_students(admin_user: dict = Depends(require_admin)):
    db = get_db()
    if db is None:
        return []
    try:
        students = []
        async for doc in db.students.find().sort("approved_at", -1):
            students.append(_clean_doc(doc))
        return students
    except Exception as e:
        print(f"ERROR fetching students: {e}")
        return []



@router.get("/profile", summary="Get current logged-in student's own profile")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """Allows authenticated student to retrieve their own full profile."""
    if current_user.get("role") != "student" and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied: Student account required.")

    db = get_db()
    student = await db.students.find_one({"user_id": current_user["_id"]})
    if not student:
        student = await db.students.find_one({"email": current_user.get("email")})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    return _clean_doc(student)


@router.patch("/profile", summary="Update current logged-in student's own profile")
async def update_my_profile(
    data: StudentProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Student updates their own profile fields.
    Security: Sensitive fields (role, email, student_code, status) cannot be edited here.
    Completing profile sets `profile_completed = True`.
    """
    if current_user.get("role") != "student" and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied: Student account required.")

    db = get_db()
    student = await db.students.find_one({"user_id": current_user["_id"]})
    if not student:
        student = await db.students.find_one({"email": current_user.get("email")})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    update_dict["profile_completed"] = True

    await db.students.update_one(
        {"_id": student["_id"]},
        {"$set": update_dict}
    )

    # Mark profile_completed = True on user record as well
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"profile_completed": True, "updated_at": datetime.utcnow()}}
    )

    return {"message": "Profile updated successfully. Onboarding completed!"}


@router.get("/{student_id}/profile", summary="Get student profile by ID (Admin or Assigned Instructor)")
async def get_student_profile(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieves student profile.
    Enforces resource-level check: Admin has full access, Instructor only if assigned.
    """
    db = get_db()
    try:
        target_oid = ObjectId(student_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid student ID format.")

    await verify_student_access(current_user, target_oid, db)

    student = await db.students.find_one({"_id": target_oid})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    return _clean_doc(student)


@router.patch("/{student_id}/assign", summary="Assign slot and instructor to a student (Admin Only)")
async def assign_slot_instructor(
    student_id: str,
    slot: str,
    instructor: str,
    admin_user: dict = Depends(require_admin)
):
    """
    Assigns slot and instructor to a student:
    - Maintains legacy `slot` and `instructor` string fields for UI compatibility.
    - Resolves and sets relational `slot_id` and `instructor_id`.
    - Creates or updates an active enrollment in `db.enrollments`.
    - Dispatches notifications.
    """
    db = get_db()
    try:
        student_oid = ObjectId(student_id)
        doc = await db.students.find_one({"_id": student_oid})
        if not doc:
            raise HTTPException(status_code=404, detail="Student not found")

        inst_oid = None
        slot_oid = None

        # Relational resolution
        inst_doc = await db.instructors.find_one({"name": instructor})
        if inst_doc:
            inst_oid = inst_doc["_id"]

        slot_parts = [p.strip() for p in (slot.split("—") if "—" in slot else slot.split("-"))]
        if len(slot_parts) == 2:
            slot_doc = await db.slots.find_one({"days": slot_parts[0], "time": slot_parts[1]})
            if slot_doc:
                slot_oid = slot_doc["_id"]

        update_fields = {
            "slot": slot,
            "instructor": instructor,
            "instructor_id": inst_oid,
            "slot_id": slot_oid,
            "updated_at": datetime.utcnow()
        }

        await db.students.update_one(
            {"_id": student_oid},
            {"$set": update_fields}
        )

        # Sync with relational enrollments collection
        existing_enrollment = await db.enrollments.find_one({"student_id": student_oid})
        if existing_enrollment:
            await db.enrollments.update_one(
                {"_id": existing_enrollment["_id"]},
                {
                    "$set": {
                        "instructor_id": inst_oid,
                        "slot_id": slot_oid,
                        "status": "active",
                        "updated_at": datetime.utcnow()
                    }
                }
            )
        else:
            await db.enrollments.insert_one({
                "student_id": student_oid,
                "instructor_id": inst_oid,
                "slot_id": slot_oid,
                "module_id": None,
                "status": "active",
                "start_date": datetime.utcnow(),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })

        # Send notification to student
        if doc.get("user_id"):
            await create_notification(
                db=db,
                recipient_user_id=doc["user_id"],
                title="Class Schedule & Instructor Assigned",
                message=f"You have been assigned to Instructor {instructor} for slot: {slot}.",
                notification_type="schedule",
                related_entity_type="student",
                related_entity_id=student_id
            )

        # Send assignment email
        subject = "Your Class Details - AlArabia Fi Buyutikum"
        body = f"""Dear {doc['first_name']} {doc['last_name']},

Great news! Your class details have been finalized.

Student ID: {doc.get('student_code', 'N/A')}
Your Slot: {slot}
Your Instructor: {instructor}

Please make sure you are available at the scheduled time. Your instructor will contact you shortly with further details.

JazakAllah Khair,
AlArabia Fi Buyutikum Team
"""
        send_email(doc['email'], subject, body)
        return {"message": "Slot and instructor assigned, enrollment updated, email sent to student."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR assigning slot/instructor: {e}")
        raise HTTPException(status_code=500, detail="Could not assign slot/instructor.")


@router.get("/dashboard-summary", summary="Get comprehensive student dashboard data")
async def get_student_dashboard_summary(current_user: dict = Depends(get_current_user)):
    """
    Returns real-time data for the student dashboard:
    - Overall progress & metrics from reporting service
    - Active course & enrollment details
    - Assigned instructor info
    - Timetable slot info
    - Upcoming tasks
    - Recent submissions with grades
    - Recent attendance logs
    - Unread notification count
    """
    if current_user.get("role") not in ["student", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied: Student account required.")

    db = get_db()
    student = await db.students.find_one({"user_id": current_user["_id"]})
    if not student:
        student = await db.students.find_one({"email": current_user.get("email")})
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found.")

    student_oid = student["_id"]

    # 1. Progress Report Metrics
    progress_summary = await get_student_progress_summary(db, student_oid)

    # 2. Resolve Active Course / Enrollment
    enrollment = await db.enrollments.find_one({"student_id": student_oid, "status": "active"})

    # Resolve Module
    module = None
    module_oid = enrollment.get("module_id") if enrollment else student.get("module_id")
    if module_oid:
        try:
            module = await db.modules.find_one({"_id": module_oid if isinstance(module_oid, ObjectId) else ObjectId(module_oid)})
        except Exception:
            pass
    if not module:
        module = await db.modules.find_one()

    # Resolve Instructor
    instructor = None
    inst_oid = enrollment.get("instructor_id") if enrollment else student.get("instructor_id")
    if inst_oid:
        try:
            instructor = await db.instructors.find_one({"_id": inst_oid if isinstance(inst_oid, ObjectId) else ObjectId(inst_oid)})
        except Exception:
            pass
    if not instructor and student.get("instructor"):
        instructor = await db.instructors.find_one({"name": student["instructor"]})

    # Resolve Slot
    slot = None
    slot_oid = enrollment.get("slot_id") if enrollment else student.get("slot_id")
    if slot_oid:
        try:
            slot = await db.slots.find_one({"_id": slot_oid if isinstance(slot_oid, ObjectId) else ObjectId(slot_oid)})
        except Exception:
            pass

    # Format module info
    module_data = None
    if module:
        module_data = {
            "id": str(module["_id"]),
            "title": module.get("title", "Course Module"),
            "description": module.get("description", ""),
            "image": module.get("image", "")
        }

    # Format instructor info
    instructor_data = None
    if instructor:
        instructor_data = {
            "id": str(instructor["_id"]),
            "name": instructor.get("name", "Instructor"),
            "email": instructor.get("email", ""),
            "about": instructor.get("about", instructor.get("bio", "")),
            "specialization": instructor.get("specialization", instructor.get("specialty", "")),
            "avatar": instructor.get("avatar", "")
        }
    elif student.get("instructor"):
        instructor_data = {
            "id": "",
            "name": student["instructor"],
            "email": "",
            "about": "Qualified Arabic Instructor",
            "specialization": "Arabic Language",
            "avatar": ""
        }

    # Format slot info
    slot_data = None
    if slot:
        slot_data = {
            "id": str(slot["_id"]),
            "days": slot.get("days", "Weekly"),
            "time": slot.get("time", "Scheduled Time"),
            "schedule_days": slot.get("schedule_days", []),
            "status": slot.get("status", "Active")
        }
    elif student.get("slot"):
        slot_data = {
            "id": "",
            "days": student["slot"],
            "time": "",
            "schedule_days": [],
            "status": "Active"
        }

    # 3. Upcoming Tasks
    upcoming_tasks = []
    task_filter = {"status": "published"}
    if module:
        task_filter["module_id"] = module["_id"]

    async for t in db.tasks.find(task_filter).sort("due_date", 1).limit(5):
        sub = await db.submissions.find_one({"task_id": t["_id"], "student_id": student_oid})
        upcoming_tasks.append({
            "id": str(t["_id"]),
            "title": t.get("title"),
            "description": t.get("description", ""),
            "due_date": t.get("due_date").isoformat() if t.get("due_date") else None,
            "is_submitted": sub is not None,
            "submission_status": sub.get("status") if sub else "pending"
        })

    # 4. Recent Submissions & Grades
    recent_submissions = []
    async for sub in db.submissions.find({"student_id": student_oid}).sort("submitted_at", -1).limit(5):
        task = await db.tasks.find_one({"_id": sub["task_id"]})
        assessment = await db.assessments.find_one({"submission_id": sub["_id"]})
        recent_submissions.append({
            "id": str(sub["_id"]),
            "task_id": str(sub["task_id"]),
            "task_title": task.get("title", "Task") if task else "Task",
            "submitted_at": sub.get("submitted_at").isoformat() if sub.get("submitted_at") else None,
            "status": sub.get("status", "submitted"),
            "score": assessment.get("score") if assessment else None,
            "grade": assessment.get("grade") if assessment else None,
            "feedback": assessment.get("feedback") if assessment else None
        })

    # 5. Recent Attendance Logs
    recent_attendance = []
    async for att in db.attendance.find({"student_id": student_oid}).sort("date", -1).limit(5):
        recent_attendance.append({
            "id": str(att["_id"]),
            "date": att.get("date"),
            "status": att.get("status"),
            "remarks": att.get("remarks")
        })

    # 6. Unread Notifications Count
    unread_notifs = await db.notifications.count_documents({
        "recipient_user_id": current_user["_id"],
        "is_read": False
    })

    return {
        "student": {
            "id": str(student_oid),
            "student_code": student.get("student_code", ""),
            "name": f"{student.get('first_name', '')} {student.get('last_name', '')}".strip(),
            "email": student.get("email", ""),
            "status": student.get("status", "Active")
        },
        "progress": progress_summary,
        "course": module_data,
        "instructor": instructor_data,
        "slot": slot_data,
        "upcoming_tasks": upcoming_tasks,
        "recent_submissions": recent_submissions,
        "recent_attendance": recent_attendance,
        "unread_notifications": unread_notifs,
        "total_enrolled_courses": progress_summary.get("enrollments_count", 0),
        "pending_tasks": len(upcoming_tasks),
        "attendance_rate": progress_summary.get("attendance", {}).get("attendance_rate", 100.0),
        "enrolled_courses": [module_data] if module_data else []
    }


@router.get("/my-courses", summary="Get enrolled courses/modules for current student")
async def get_student_courses(current_user: dict = Depends(get_current_user)):
    """
    Returns full details on modules and classes in which the student is enrolled.
    """
    if current_user.get("role") not in ["student", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied: Student account required.")

    db = get_db()
    student = await db.students.find_one({"user_id": current_user["_id"]})
    if not student:
        student = await db.students.find_one({"email": current_user.get("email")})
    if not student:
        return []

    student_oid = student["_id"]
    courses = []

    # Check relational enrollments
    async for enr in db.enrollments.find({"student_id": student_oid}):
        module = None
        if enr.get("module_id"):
            module = await db.modules.find_one({"_id": enr["module_id"]})
        if not module:
            module = await db.modules.find_one()

        instructor = None
        if enr.get("instructor_id"):
            instructor = await db.instructors.find_one({"_id": enr["instructor_id"]})
        if not instructor and student.get("instructor"):
            instructor = await db.instructors.find_one({"name": student["instructor"]})

        slot = None
        if enr.get("slot_id"):
            slot = await db.slots.find_one({"_id": enr["slot_id"]})

        mod_id = module["_id"] if module else None
        tasks_count = await db.tasks.count_documents({"module_id": mod_id}) if mod_id else 0
        resources_count = await db.resources.count_documents({"module_id": mod_id}) if mod_id else 0

        mod_title = module.get("title", "Standard Arabic Course") if module else "Standard Arabic Course"
        courses.append({
            "enrollment_id": str(enr["_id"]),
            "module_title": mod_title,
            "title": mod_title,
            "module_id": str(module["_id"]) if module else "",
            "status": enr.get("status", "active"),
            "start_date": enr.get("start_date").isoformat() if enr.get("start_date") else None,
            "module": {
                "id": str(module["_id"]) if module else "",
                "title": mod_title,
                "description": module.get("description", "") if module else "",
                "image": module.get("image", "") if module else ""
            },
            "instructor": {
                "id": str(instructor["_id"]) if instructor else "",
                "name": instructor.get("name", student.get("instructor", "Assigned Instructor")) if instructor else student.get("instructor", "Assigned Instructor"),
                "email": instructor.get("email", "") if instructor else "",
                "about": instructor.get("about", instructor.get("bio", "")) if instructor else "",
                "specialization": instructor.get("specialization", instructor.get("specialty", "")) if instructor else "",
                "avatar": instructor.get("avatar", "") if instructor else ""
            },
            "slot": {
                "id": str(slot["_id"]) if slot else "",
                "days": slot.get("days", student.get("slot", "Weekly Sessions")) if slot else student.get("slot", "Weekly Sessions"),
                "time": slot.get("time", "") if slot else "",
                "schedule_days": slot.get("schedule_days", []) if slot else []
            },
            "tasks_count": tasks_count,
            "resources_count": resources_count
        })

    # If no enrollments in db.enrollments yet, construct from student record directly
    if not courses and (student.get("slot") or student.get("instructor")):
        module = await db.modules.find_one()
        instructor = await db.instructors.find_one({"name": student.get("instructor")}) if student.get("instructor") else None
        leg_title = module.get("title", "AlArabia Arabic Program") if module else "AlArabia Arabic Program"
        courses.append({
            "enrollment_id": "legacy",
            "module_title": leg_title,
            "title": leg_title,
            "module_id": str(module["_id"]) if module else "default",
            "status": "active",
            "start_date": student.get("approved_at", datetime.utcnow()).isoformat() if student.get("approved_at") else None,
            "module": {
                "id": str(module["_id"]) if module else "default",
                "title": leg_title,
                "description": module.get("description", "Comprehensive Classical & Modern Standard Arabic") if module else "",
                "image": module.get("image", "") if module else ""
            },
            "instructor": {
                "id": str(instructor["_id"]) if instructor else "",
                "name": instructor.get("name", student.get("instructor", "Assigned Instructor")) if instructor else student.get("instructor", "Assigned Instructor"),
                "email": instructor.get("email", "") if instructor else "",
                "about": instructor.get("about", "") if instructor else "",
                "specialization": instructor.get("specialization", "") if instructor else "",
                "avatar": instructor.get("avatar", "") if instructor else ""
            },
            "slot": {
                "id": "",
                "days": student.get("slot", "Regular Session"),
                "time": "",
                "schedule_days": []
            },
            "tasks_count": await db.tasks.count_documents({}),
            "resources_count": await db.resources.count_documents({})
        })

    return courses

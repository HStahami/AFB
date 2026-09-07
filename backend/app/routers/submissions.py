from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, status, Query
from app.database import get_db
from app.models import SubmissionCreate, SubmissionResponse
from app.core.dependencies import get_current_user, require_roles
from app.services.notification_service import create_notification

router = APIRouter(prefix="/api/submissions", tags=["Submissions"])


async def _format_submission(doc: dict, db=None) -> dict:
    doc["id"] = str(doc["_id"])
    doc["_id"] = str(doc["_id"])
    task_oid = doc.get("task_id")
    student_oid = doc.get("student_id")

    if task_oid:
        doc["task_id"] = str(task_oid)
    if student_oid:
        doc["student_id"] = str(student_oid)
    if doc.get("enrollment_id"):
        doc["enrollment_id"] = str(doc["enrollment_id"])

    # Enrich with task title and student name if db is available
    if db is not None:
        if task_oid and "task_title" not in doc:
            task = await db.tasks.find_one({"_id": task_oid if isinstance(task_oid, ObjectId) else ObjectId(task_oid)})
            if task:
                doc["task_title"] = task.get("title", "Task")
                if task.get("module_id"):
                    mod = await db.modules.find_one({"_id": task["module_id"]})
                    doc["module_title"] = mod.get("title", "Module") if mod else "Module"
            else:
                doc["task_title"] = "Task"

        if student_oid and "student_name" not in doc:
            student = await db.students.find_one({"_id": student_oid if isinstance(student_oid, ObjectId) else ObjectId(student_oid)})
            if student:
                doc["student_name"] = f"{student.get('first_name', '')} {student.get('last_name', '')}".strip()
                doc["student_code"] = student.get("student_code", "")
            else:
                doc["student_name"] = "Student"
                doc["student_code"] = ""

        # Enrich assessment feedback if available
        try:
            sub_id_lookup = doc["_id"] if isinstance(doc["_id"], ObjectId) else ObjectId(doc["_id"])
            assessment = await db.assessments.find_one({
                "$or": [
                    {"submission_id": str(sub_id_lookup)},
                    {"submission_id": sub_id_lookup}
                ]
            })
            if assessment:
                doc["score"] = assessment.get("score")
                doc["grade"] = assessment.get("grade")
                doc["feedback"] = assessment.get("feedback")
                doc["assessed_at"] = assessment.get("assessed_at").isoformat() if assessment.get("assessed_at") else None
        except Exception:
            pass

    return doc


@router.post("/", summary="Submit task response (Student Only)")
async def create_submission(
    data: SubmissionCreate,
    current_user: dict = Depends(require_roles(["student", "admin"]))
):
    db = get_db()
    try:
        task_oid = ObjectId(data.task_id)
        task = await db.tasks.find_one({"_id": task_oid})
        if not task:
            raise HTTPException(status_code=404, detail="Task not found.")

        student = await db.students.find_one({"user_id": current_user["_id"]})
        if not student:
            student = await db.students.find_one({"email": current_user.get("email")})
        if not student:
            raise HTTPException(status_code=403, detail="Student record not linked.")

        # Duplicate submission check
        existing_sub = await db.submissions.find_one({
            "task_id": task_oid,
            "student_id": student["_id"]
        })
        if existing_sub:
            raise HTTPException(
                status_code=400,
                detail="You have already submitted for this task. Multiple submissions are not permitted."
            )

        attachments = list(data.attachment_urls or [])
        if data.file_url and data.file_url not in attachments:
            attachments.append(data.file_url)

        sub_doc = {
            "task_id": task_oid,
            "student_id": student["_id"],
            "submitted_at": datetime.utcnow(),
            "content": data.content,
            "attachment_urls": attachments,
            "file_url": data.file_url or (attachments[0] if attachments else None),
            "status": "submitted",
            "feedback": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        res = await db.submissions.insert_one(sub_doc)
        sub_id = res.inserted_id
        sub_doc["_id"] = sub_id

        # Notify instructor if known
        if task.get("instructor_id"):
            inst = await db.instructors.find_one({"_id": task["instructor_id"]})
            if inst and inst.get("user_id"):
                await create_notification(
                    db=db,
                    recipient_user_id=inst["user_id"],
                    title="New Student Submission",
                    message=f"Student {student.get('first_name', '')} {student.get('last_name', '')} submitted task '{task.get('title')}'.",
                    notification_type="submission",
                    related_entity_type="submission",
                    related_entity_id=str(sub_id)
                )

        return await _format_submission(sub_doc, db)
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR creating submission: {e}")
        raise HTTPException(status_code=500, detail="Could not submit task.")


@router.get("/", summary="List submissions (Scoped by role with filters)")
async def list_submissions(
    task_id: Optional[str] = None,
    status: Optional[str] = None,
    student_id: Optional[str] = None,
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
        # Find tasks created by this instructor
        task_ids = [t["_id"] async for t in db.tasks.find({"instructor_id": instructor["_id"]})]
        query["task_id"] = {"$in": task_ids}
    else:
        return []

    if task_id and isinstance(task_id, str):
        try:
            query["task_id"] = ObjectId(task_id)
        except Exception:
            pass

    if status and isinstance(status, str):
        query["status"] = status.lower()

    if student_id and isinstance(student_id, str):
        try:
            query["student_id"] = ObjectId(student_id)
        except Exception:
            pass

    submissions = []
    async for doc in db.submissions.find(query).sort("submitted_at", -1):
        submissions.append(await _format_submission(doc, db))
    return submissions


@router.get("/my-submissions", summary="List current student's submissions")
async def get_my_submissions(current_user: dict = Depends(get_current_user)):
    return await list_submissions(current_user=current_user)


@router.get("/{id}", summary="Get submission by ID")
async def get_submission(id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        sub_oid = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid submission ID.")

    sub = await db.submissions.find_one({"_id": sub_oid})
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found.")

    role = current_user.get("role")
    if role == "student":
        student = await db.students.find_one({"user_id": current_user["_id"]})
        if not student or sub.get("student_id") != student["_id"]:
            raise HTTPException(status_code=403, detail="Access denied: Cannot view another student's submission.")
    elif role == "instructor":
        instructor = await db.instructors.find_one({"user_id": current_user["_id"]})
        if not instructor:
            instructor = await db.instructors.find_one({"email": current_user.get("email")})
        if not instructor:
            raise HTTPException(status_code=403, detail="Instructor profile not linked.")
        inst_oid = instructor["_id"]

        task = await db.tasks.find_one({"_id": sub.get("task_id")})
        task_owned = bool(task and task.get("instructor_id") == inst_oid)
        student_assigned = bool(await db.students.find_one({
            "_id": sub.get("student_id"),
            "instructor_id": inst_oid
        }))
        enrollment_assigned = bool(await db.enrollments.find_one({
            "student_id": sub.get("student_id"),
            "instructor_id": inst_oid,
            "status": "active"
        }))

        if not (task_owned or student_assigned or enrollment_assigned):
            raise HTTPException(
                status_code=403,
                detail="Access denied: You are not authorized to view submissions for this task or student."
            )

    return await _format_submission(sub, db)

from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, status
from app.database import get_db
from app.models import AssessmentCreate, AssessmentResponse
from app.core.dependencies import get_current_user, require_roles
from app.services.notification_service import create_notification

router = APIRouter(prefix="/api/assessments", tags=["Assessments"])


def _format_assessment(doc: dict) -> dict:
    doc["id"] = str(doc["_id"])
    doc["_id"] = str(doc["_id"])
    if doc.get("submission_id"):
        doc["submission_id"] = str(doc["submission_id"])
    if doc.get("task_id"):
        doc["task_id"] = str(doc["task_id"])
    if doc.get("student_id"):
        doc["student_id"] = str(doc["student_id"])
    if doc.get("instructor_id"):
        doc["instructor_id"] = str(doc["instructor_id"])
    return doc


@router.post("/", summary="Grade / Assess a student submission (Instructor or Admin)")
async def create_assessment(
    data: AssessmentCreate,
    current_user: dict = Depends(require_roles(["instructor", "admin"]))
):
    db = get_db()
    try:
        sub_oid = ObjectId(data.submission_id)
        sub = await db.submissions.find_one({"_id": sub_oid})
        if not sub:
            raise HTTPException(status_code=404, detail="Submission not found.")

        # Determine instructor_id and verify assignment authorization
        inst_oid = None
        if current_user.get("role") == "instructor":
            instructor = await db.instructors.find_one({"user_id": current_user["_id"]})
            if not instructor:
                instructor = await db.instructors.find_one({"email": current_user.get("email")})
            if not instructor:
                raise HTTPException(status_code=403, detail="Instructor profile not linked.")
            inst_oid = instructor["_id"]

            # Verify instructor is authorized to grade this submission
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
                    detail="Access denied: You are not authorized to grade submissions for this task or student."
                )
        else:
            inst_oid = current_user["_id"]

        assessment_doc = {
            "submission_id": sub_oid,
            "task_id": sub.get("task_id"),
            "student_id": sub.get("student_id"),
            "instructor_id": inst_oid,
            "score": data.score,
            "grade": data.grade,
            "feedback": data.feedback,
            "assessed_at": datetime.utcnow(),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        res = await db.assessments.insert_one(assessment_doc)
        assessment_id = res.inserted_id
        assessment_doc["_id"] = assessment_id

        # Update submission status to reviewed
        await db.submissions.update_one(
            {"_id": sub_oid},
            {"$set": {"status": "reviewed", "feedback": data.feedback, "updated_at": datetime.utcnow()}}
        )

        # Notify student
        student = await db.students.find_one({"_id": sub["student_id"]})
        if student and student.get("user_id"):
            grade_info = f"Grade: {data.grade}" if data.grade else f"Score: {data.score}"
            await create_notification(
                db=db,
                recipient_user_id=student["user_id"],
                title="Your Submission has been Graded",
                message=f"Feedback: {data.feedback or 'Good job!'} ({grade_info})",
                notification_type="assessment",
                related_entity_type="assessment",
                related_entity_id=str(assessment_id)
            )

        return _format_assessment(assessment_doc)
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR creating assessment: {e}")
        raise HTTPException(status_code=500, detail="Could not create assessment.")


@router.get("/", summary="List assessments (Scoped by role)")
async def list_assessments(current_user: dict = Depends(get_current_user)):
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

    assessments = []
    async for doc in db.assessments.find(query).sort("assessed_at", -1):
        assessments.append(_format_assessment(doc))
    return assessments

from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, status
from app.database import get_db
from app.models import TaskCreate, TaskUpdate, TaskResponse
from app.core.dependencies import get_current_user, require_roles
from app.services.notification_service import create_notification

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


def _format_task(doc: dict) -> dict:
    doc["id"] = str(doc["_id"])
    doc["_id"] = str(doc["_id"])
    if doc.get("module_id"):
        doc["module_id"] = str(doc["module_id"])
    if doc.get("instructor_id"):
        doc["instructor_id"] = str(doc["instructor_id"])
    if doc.get("enrollment_id"):
        doc["enrollment_id"] = str(doc["enrollment_id"])
    return doc


@router.post("/", summary="Create an assignment/task (Instructor or Admin)")
async def create_task(
    data: TaskCreate,
    current_user: dict = Depends(require_roles(["instructor", "admin"]))
):
    db = get_db()
    try:
        module_oid = ObjectId(data.module_id)
        module = await db.modules.find_one({"_id": module_oid})
        if not module:
            raise HTTPException(status_code=404, detail="Module not found.")

        # Determine instructor_id
        inst_oid = None
        if current_user.get("role") == "instructor":
            instructor = await db.instructors.find_one({"user_id": current_user["_id"]})
            if not instructor:
                instructor = await db.instructors.find_one({"email": current_user.get("email")})
            if not instructor:
                raise HTTPException(status_code=403, detail="Instructor profile not linked.")
            inst_oid = instructor["_id"]
        elif data.instructor_id:
            inst_oid = ObjectId(data.instructor_id)

        enrollment_oid = ObjectId(data.enrollment_id) if data.enrollment_id else None

        task_doc = {
            "module_id": module_oid,
            "instructor_id": inst_oid,
            "enrollment_id": enrollment_oid,
            "title": data.title,
            "description": data.description,
            "instructions": data.instructions,
            "due_date": data.due_date,
            "status": data.status or "published",
            "attachments": data.attachments or [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        res = await db.tasks.insert_one(task_doc)
        task_id = res.inserted_id
        task_doc["_id"] = task_id

        # Notify enrolled students
        enrollment_filter = {"status": "active"}
        if enrollment_oid:
            enrollment_filter["_id"] = enrollment_oid
        else:
            enrollment_filter["module_id"] = module_oid

        async for enr in db.enrollments.find(enrollment_filter):
            student = await db.students.find_one({"_id": enr["student_id"]})
            if student and student.get("user_id"):
                await create_notification(
                    db=db,
                    recipient_user_id=student["user_id"],
                    title=f"New Task Assigned: {data.title}",
                    message=f"A new task has been published for your module: {data.description[:100]}",
                    notification_type="task",
                    related_entity_type="task",
                    related_entity_id=str(task_id)
                )

        return _format_task(task_doc)
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR creating task: {e}")
        raise HTTPException(status_code=500, detail="Could not create task.")


@router.get("/", summary="List tasks (Scoped to user enrollments/assignments)")
async def list_tasks(
    module_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    role = current_user.get("role")
    query = {}

    if module_id:
        try:
            query["module_id"] = ObjectId(module_id)
        except Exception:
            pass

    if role == "admin":
        pass  # Admin sees all
    elif role == "instructor":
        instructor = await db.instructors.find_one({"user_id": current_user["_id"]})
        if not instructor:
            instructor = await db.instructors.find_one({"email": current_user.get("email")})
        if not instructor:
            return []
        query["instructor_id"] = instructor["_id"]
    elif role == "student":
        student = await db.students.find_one({"user_id": current_user["_id"]})
        if not student:
            student = await db.students.find_one({"email": current_user.get("email")})
        if not student:
            return []
        # Find enrolled modules from enrollments and student record
        module_ids = []
        async for enr in db.enrollments.find({"student_id": student["_id"], "status": "active"}):
            if enr.get("module_id"):
                module_ids.append(enr["module_id"])
        for m in student.get("modules", []) + student.get("module_ids", []):
            try:
                m_oid = ObjectId(m) if not isinstance(m, ObjectId) else m
                if m_oid not in module_ids:
                    module_ids.append(m_oid)
            except Exception:
                pass
        
        # Student sees published tasks strictly for their authorized enrolled modules
        if not module_ids:
            return []

        enrolled_ids = [enr["_id"] async for enr in db.enrollments.find({"student_id": student["_id"], "status": "active"})]
        query = {
            "status": {"$in": ["published", None]},
            "$or": [
                {"module_id": {"$in": module_ids}},
                {"enrollment_id": {"$in": enrolled_ids}}
            ]
        }
    else:
        return []

    tasks = []
    student_record = None
    if role == "student":
        student_record = await db.students.find_one({"user_id": current_user["_id"]})
        if not student_record:
            student_record = await db.students.find_one({"email": current_user.get("email")})

    async for doc in db.tasks.find(query).sort("created_at", -1):
        formatted = _format_task(doc)
        if doc.get("module_id"):
            mod = await db.modules.find_one({"_id": doc["module_id"]})
            formatted["module_title"] = mod.get("title") if mod else "Course Module"
        else:
            formatted["module_title"] = "Course Module"

        if student_record:
            sub = await db.submissions.find_one({"task_id": doc["_id"], "student_id": student_record["_id"]})
            if sub:
                formatted["is_submitted"] = True
                formatted["submission_id"] = str(sub["_id"])
                formatted["submission_status"] = sub.get("status", "submitted")
                formatted["submission_content"] = sub.get("content", "")
                formatted["submitted_at"] = sub.get("submitted_at").isoformat() if sub.get("submitted_at") else None
                ass = await db.assessments.find_one({"submission_id": sub["_id"]})
                if ass:
                    formatted["score"] = ass.get("score")
                    formatted["grade"] = ass.get("grade")
                    formatted["feedback"] = ass.get("feedback")
            else:
                formatted["is_submitted"] = False
                formatted["submission_status"] = "pending"

        tasks.append(formatted)
    return tasks


@router.get("/{id}", summary="Get task by ID")
async def get_task(id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        task_oid = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid task ID.")

    task = await db.tasks.find_one({"_id": task_oid})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    # Scoping check for student role
    if current_user.get("role") == "student":
        student = await db.students.find_one({"user_id": current_user["_id"]})
        if not student:
            student = await db.students.find_one({"email": current_user.get("email")})
        if not student:
            raise HTTPException(status_code=403, detail="Student profile not linked.")

        st_module_ids = []
        async for enr in db.enrollments.find({"student_id": student["_id"], "status": "active"}):
            if enr.get("module_id"):
                st_module_ids.append(enr["module_id"])
            if task.get("enrollment_id") and enr["_id"] == task["enrollment_id"]:
                st_module_ids.append(task.get("module_id"))
        for m in student.get("modules", []) + student.get("module_ids", []):
            try:
                st_module_ids.append(ObjectId(m) if not isinstance(m, ObjectId) else m)
            except Exception:
                pass

        task_mod_id = task.get("module_id")
        if task_mod_id and task_mod_id not in st_module_ids:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You are not enrolled in the module for this task."
            )

    formatted = _format_task(task)
    if task.get("module_id"):
        mod = await db.modules.find_one({"_id": task["module_id"]})
        formatted["module_title"] = mod.get("title") if mod else "Course Module"

    if current_user.get("role") == "student":
        student = await db.students.find_one({"user_id": current_user["_id"]})
        if not student:
            student = await db.students.find_one({"email": current_user.get("email")})
        if student:
            sub = await db.submissions.find_one({"task_id": task_oid, "student_id": student["_id"]})
            if sub:
                formatted["is_submitted"] = True
                formatted["submission_id"] = str(sub["_id"])
                formatted["submission_status"] = sub.get("status", "submitted")
                formatted["submission_content"] = sub.get("content", "")
                formatted["submitted_at"] = sub.get("submitted_at").isoformat() if sub.get("submitted_at") else None
                ass = await db.assessments.find_one({"submission_id": sub["_id"]})
                if ass:
                    formatted["score"] = ass.get("score")
                    formatted["grade"] = ass.get("grade")
                    formatted["feedback"] = ass.get("feedback")
            else:
                formatted["is_submitted"] = False
                formatted["submission_status"] = "pending"

    return formatted


@router.delete("/{id}", summary="Delete task (Instructor or Admin)")
async def delete_task(
    id: str,
    current_user: dict = Depends(require_roles(["instructor", "admin"]))
):
    db = get_db()
    try:
        task_oid = ObjectId(id)
        task = await db.tasks.find_one({"_id": task_oid})
        if not task:
            raise HTTPException(status_code=404, detail="Task not found.")

        # If instructor, check ownership
        if current_user.get("role") == "instructor":
            instructor = await db.instructors.find_one({"user_id": current_user["_id"]})
            if not instructor or task.get("instructor_id") != instructor["_id"]:
                raise HTTPException(status_code=403, detail="Access denied: Cannot delete other instructors' tasks.")

        await db.tasks.delete_one({"_id": task_oid})
        return {"message": "Task deleted successfully."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR deleting task: {e}")
        raise HTTPException(status_code=500, detail="Could not delete task.")

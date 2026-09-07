from typing import Dict, Any, List
from bson import ObjectId


async def get_student_progress_summary(db, student_id: ObjectId) -> Dict[str, Any]:
    """
    Dynamically computes real-time academic progress for a student:
    - Active enrollments
    - Task completion rate
    - Attendance percentage
    - Assessment score average & grade distribution
    """
    if db is None:
        return {}

    student_oid = student_id if isinstance(student_id, ObjectId) else ObjectId(student_id)

    # 1. Fetch Student Enrollments
    enrollments = []
    module_ids = []
    async for enr in db.enrollments.find({"student_id": student_oid}):
        enr["_id"] = str(enr["_id"])
        enr["student_id"] = str(enr["student_id"])
        if enr.get("module_id"):
            module_ids.append(enr["module_id"])
            enr["module_id"] = str(enr["module_id"])
        if enr.get("instructor_id"):
            enr["instructor_id"] = str(enr["instructor_id"])
        if enr.get("slot_id"):
            enr["slot_id"] = str(enr["slot_id"])
        enrollments.append(enr)

    # 2. Tasks & Submissions Analysis
    task_filter = {}
    if module_ids:
        task_filter["module_id"] = {"$in": module_ids}
    
    total_tasks = await db.tasks.count_documents(task_filter) if module_ids else 0
    
    # Count submitted tasks
    submissions_count = await db.submissions.count_documents({
        "student_id": student_oid,
        "status": {"$in": ["submitted", "reviewed", "returned"]}
    })
    task_completion_rate = round((submissions_count / total_tasks * 100), 1) if total_tasks > 0 else 0.0

    # 3. Attendance Analysis
    total_attendance = await db.attendance.count_documents({"student_id": student_oid})
    present_count = await db.attendance.count_documents({"student_id": student_oid, "status": "present"})
    late_count = await db.attendance.count_documents({"student_id": student_oid, "status": "late"})
    excused_count = await db.attendance.count_documents({"student_id": student_oid, "status": "excused"})
    absent_count = await db.attendance.count_documents({"student_id": student_oid, "status": "absent"})

    attended_count = present_count + late_count + excused_count
    attendance_rate = round((attended_count / total_attendance * 100), 1) if total_attendance > 0 else 0.0

    # 4. Assessment & Grade Analysis
    scores: List[float] = []
    grades: List[str] = []
    async for ass in db.assessments.find({"student_id": student_oid}):
        if ass.get("score") is not None:
            try:
                scores.append(float(ass["score"]))
            except (ValueError, TypeError):
                pass
        if ass.get("grade"):
            grades.append(str(ass["grade"]))

    avg_score = round(sum(scores) / len(scores), 2) if scores else None

    # Overall progress index calculation (weighted combination)
    has_activity = (total_tasks > 0 or total_attendance > 0 or len(scores) > 0)
    if not has_activity:
        overall_progress = 0.0
    else:
        att_rate_calc = attendance_rate if total_attendance > 0 else 100.0
        score_calc = avg_score if avg_score is not None else 85.0
        overall_progress = round(
            (task_completion_rate * 0.5) + (att_rate_calc * 0.3) + (score_calc * 0.2),
            1
        )


    return {
        "student_id": str(student_oid),
        "enrollments_count": len(enrollments),
        "enrollments": enrollments,
        "tasks": {
            "total_assigned": total_tasks,
            "total_submitted": submissions_count,
            "completion_rate": task_completion_rate
        },
        "attendance": {
            "total_sessions": total_attendance,
            "present": present_count,
            "late": late_count,
            "excused": excused_count,
            "absent": absent_count,
            "attendance_rate": attendance_rate
        },
        "assessments": {
            "total_graded": len(scores),
            "average_score": avg_score,
            "grades_recorded": grades
        },
        "overall_progress_score": overall_progress
    }

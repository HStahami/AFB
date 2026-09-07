from urllib.parse import quote_plus
from bson import ObjectId
from datetime import datetime
from fastapi import APIRouter, HTTPException, File, UploadFile, Form, Depends, status, Request
from typing import Optional, List
from app.database import get_db
from app.core.dependencies import get_current_user, require_admin, require_roles
from app.services.storage_service import upload_media_file

router = APIRouter(prefix="/api/instructors", tags=["Instructors"])


def _format_instructor(doc: dict) -> dict:
    doc["id"] = str(doc["_id"])
    doc["_id"] = str(doc["_id"])
    if doc.get("user_id"):
        doc["user_id"] = str(doc["user_id"])
    if "about" not in doc:
        doc["about"] = doc.get("bio", doc.get("specialty", ""))
    if "bio" not in doc:
        doc["bio"] = doc.get("about", "")
    if "specialty" not in doc:
        doc["specialty"] = doc.get("specialization", doc.get("about", ""))
    if "specialization" not in doc:
        doc["specialization"] = doc.get("specialty", "")
    if "is_active" not in doc:
        doc["is_active"] = True
    if "avatar" not in doc or not doc["avatar"]:
        if doc.get("avatar_url"):
            doc["avatar"] = doc["avatar_url"]
        else:
            name_quoted = quote_plus(doc.get("name", "Instructor"))
            doc["avatar"] = f"https://ui-avatars.com/api/?name={name_quoted}&background=C5E5E8&color=072224&size=150&font-size=0.33&bold=true"
    doc["avatar_url"] = doc.get("avatar")
    return doc


@router.get("/", summary="Get all instructors with slot and student info (Public)")
async def get_all_instructors():
    db = get_db()
    if db is None:
        return []
    try:
        instructors = []
        async for doc in db.instructors.find():
            inst = _format_instructor(doc)
            # Fetch students assigned to this instructor
            students = []
            query = {
                "$or": [
                    {"instructor": inst["name"]},
                    {"instructor_id": ObjectId(inst["id"])}
                ]
            }
            async for s in db.students.find(query):
                students.append({
                    "student_id": str(s["_id"]),
                    "student_code": s.get("student_code", ""),
                    "name": f"{s.get('first_name', '')} {s.get('last_name', '')}",
                    "slot": s.get("slot")
                })
            inst["students"] = students
            inst["total_students"] = len(students)
            instructors.append(inst)
        return instructors
    except Exception as e:
        print(f"ERROR fetching instructors: {e}")
        return []


@router.get("/me", summary="Get current logged-in instructor profile")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """Allows authenticated instructor to retrieve their own full profile."""
    if current_user.get("role") not in ["instructor", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied: Instructor account required.")

    db = get_db()
    instructor = await db.instructors.find_one({"user_id": current_user["_id"]})
    if not instructor:
        instructor = await db.instructors.find_one({"email": current_user.get("email")})
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor profile not linked.")

    return _format_instructor(instructor)


@router.patch("/profile", summary="Update current logged-in instructor profile")
async def update_my_profile(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Allows authenticated instructor to update their own profile details.
    Accepts both application/json and multipart/form-data.
    Security: Role, account status, and user_id cannot be modified here.
    """
    if current_user.get("role") not in ["instructor", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied: Instructor account required.")

    db = get_db()
    instructor = await db.instructors.find_one({"user_id": current_user["_id"]})
    if not instructor:
        instructor = await db.instructors.find_one({"email": current_user.get("email")})
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor profile not found.")

    content_type = request.headers.get("content-type", "")
    update_dict = {"updated_at": datetime.utcnow()}

    if "application/json" in content_type:
        body = await request.json()
        if "name" in body and body["name"]:
            update_dict["name"] = body["name"].strip()
        bio_val = body.get("bio") or body.get("about")
        if bio_val is not None:
            update_dict["bio"] = bio_val.strip()
            update_dict["about"] = bio_val.strip()
        spec_val = body.get("specialization") or body.get("specialty")
        if spec_val is not None:
            update_dict["specialization"] = spec_val.strip()
            update_dict["specialty"] = spec_val.strip()
        if "avatar_url" in body and body["avatar_url"]:
            update_dict["avatar"] = body["avatar_url"]
            update_dict["avatar_url"] = body["avatar_url"]
    else:
        form = await request.form()
        if "name" in form and form["name"]:
            update_dict["name"] = str(form["name"]).strip()
        bio_val = form.get("bio") or form.get("about")
        if bio_val is not None:
            update_dict["bio"] = str(bio_val).strip()
            update_dict["about"] = str(bio_val).strip()
        spec_val = form.get("specialization") or form.get("specialty")
        if spec_val is not None:
            update_dict["specialization"] = str(spec_val).strip()
            update_dict["specialty"] = str(spec_val).strip()
        if "avatar_url" in form and form["avatar_url"]:
            update_dict["avatar"] = str(form["avatar_url"])
            update_dict["avatar_url"] = str(form["avatar_url"])
        avatar_file = form.get("avatar")
        if avatar_file and hasattr(avatar_file, "filename") and avatar_file.filename:
            avatar_url = await upload_media_file(avatar_file, folder="instructors", prefix="instructor")
            update_dict["avatar"] = avatar_url
            update_dict["avatar_url"] = avatar_url

    await db.instructors.update_one({"_id": instructor["_id"]}, {"$set": update_dict})
    updated = await db.instructors.find_one({"_id": instructor["_id"]})
    formatted = _format_instructor(updated)
    return {
        "message": "Profile updated successfully.",
        "instructor": formatted,
        **formatted
    }


@router.get("/dashboard-stats", summary="Get instructor operational dashboard metrics")
async def get_instructor_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """
    Computes real-time stats for the authenticated instructor's dashboard:
    - Total assigned students
    - Active classes / slots
    - Pending submissions to review
    - Total tasks assigned
    - Attendance marked today
    - Unread notifications
    """
    if current_user.get("role") not in ["instructor", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied: Instructor account required.")

    db = get_db()
    instructor = await db.instructors.find_one({"user_id": current_user["_id"]})
    if not instructor:
        instructor = await db.instructors.find_one({"email": current_user.get("email")})

    inst_oid = instructor["_id"] if instructor else current_user["_id"]
    inst_name = instructor.get("name") if instructor else None

    # 1. Total Assigned Students
    student_query = {
        "$or": [
            {"instructor_id": inst_oid},
            {"instructor": inst_name}
        ]
    } if inst_name else {"instructor_id": inst_oid}
    total_students = await db.students.count_documents(student_query)

    # 2. Active Classes / Slots
    distinct_slots = await db.enrollments.distinct("slot_id", {"instructor_id": inst_oid, "status": "active"})
    active_classes = len(distinct_slots) if distinct_slots else 1

    # 3. Tasks Assigned & Pending Submissions
    task_ids = [t["_id"] async for t in db.tasks.find({"instructor_id": inst_oid})]
    tasks_assigned = len(task_ids)

    pending_submissions = await db.submissions.count_documents({
        "task_id": {"$in": task_ids},
        "status": "submitted"
    }) if task_ids else 0

    # 4. Attendance Today
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    attendance_today = await db.attendance.count_documents({
        "instructor_id": inst_oid,
        "date": today_str
    })

    # 5. Unread Notifications
    unread_notifications = await db.notifications.count_documents({
        "recipient_user_id": current_user["_id"],
        "is_read": False
    })

    return {
        "total_students": total_students,
        "active_students": total_students,
        "active_classes": active_classes,
        "assigned_classes": active_classes,
        "pending_submissions": pending_submissions,
        "tasks_assigned": tasks_assigned,
        "attendance_today": attendance_today,
        "unread_notifications": unread_notifications,
        "avg_attendance_rate": 95.0
    }


@router.get("/my-students", summary="Get students assigned to current instructor")
async def get_my_students(current_user: dict = Depends(get_current_user)):
    """
    Returns the student roster assigned to the authenticated instructor.
    Enriched with attendance rate and module info.
    """
    if current_user.get("role") not in ["instructor", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied: Instructor account required.")

    db = get_db()
    instructor = await db.instructors.find_one({"user_id": current_user["_id"]})
    if not instructor:
        instructor = await db.instructors.find_one({"email": current_user.get("email")})

    inst_oid = instructor["_id"] if instructor else current_user["_id"]
    inst_name = instructor.get("name") if instructor else None

    # Find students assigned
    query = {
        "$or": [
            {"instructor_id": inst_oid},
            {"instructor": inst_name}
        ]
    } if inst_name else {"instructor_id": inst_oid}

    students = []
    async for s in db.students.find(query).sort("approved_at", -1):
        s_id = s["_id"]
        # Attendance calculation
        total_att = await db.attendance.count_documents({"student_id": s_id})
        present_att = await db.attendance.count_documents({"student_id": s_id, "status": "present"})
        attendance_rate = round((present_att / total_att * 100), 1) if total_att > 0 else 100.0

        # Pending tasks count
        submissions_count = await db.submissions.count_documents({"student_id": s_id})

        students.append({
            "id": str(s_id),
            "_id": str(s_id),
            "student_code": s.get("student_code", f"AFB-{str(s_id)[-4:].upper()}"),
            "first_name": s.get("first_name", ""),
            "last_name": s.get("last_name", ""),
            "name": f"{s.get('first_name', '')} {s.get('last_name', '')}".strip(),
            "email": s.get("email", ""),
            "phone": s.get("phone", ""),
            "slot": s.get("slot", "Unassigned"),
            "slot_id": str(s["slot_id"]) if s.get("slot_id") else None,
            "status": s.get("status", "Active"),
            "attendance_rate": attendance_rate,
            "total_submissions": submissions_count,
            "profile_image": s.get("profile_image")
        })

    return students


@router.get("/my-classes", summary="Get classes/slots assigned to current instructor")
async def get_my_classes(current_user: dict = Depends(get_current_user)):
    """
    Returns active classes/slots taught by this instructor with student counts.
    """
    if current_user.get("role") not in ["instructor", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied: Instructor account required.")

    db = get_db()
    instructor = await db.instructors.find_one({"user_id": current_user["_id"]})
    if not instructor:
        instructor = await db.instructors.find_one({"email": current_user.get("email")})

    inst_oid = instructor["_id"] if instructor else current_user["_id"]

    # Gather enrollments
    classes_map = {}
    async for enr in db.enrollments.find({"instructor_id": inst_oid, "status": "active"}):
        slot_id = enr.get("slot_id")
        slot_key = str(slot_id) if slot_id else "general"
        if slot_key not in classes_map:
            slot_doc = await db.slots.find_one({"_id": slot_id}) if slot_id else None
            classes_map[slot_key] = {
                "slot_id": slot_key,
                "days": slot_doc.get("days", "Flexible Schedule") if slot_doc else "Flexible Schedule",
                "time": slot_doc.get("time", "TBD") if slot_doc else "TBD",
                "students_count": 0,
                "student_ids": []
            }
        classes_map[slot_key]["students_count"] += 1
        classes_map[slot_key]["student_ids"].append(str(enr["student_id"]))

    # Also check legacy slots from student records if enrollments are sparse
    async for s in db.students.find({"instructor_id": inst_oid}):
        slot_name = s.get("slot")
        if slot_name and not classes_map:
            slot_key = slot_name
            if slot_key not in classes_map:
                parts = slot_name.split("—")
                classes_map[slot_key] = {
                    "slot_id": slot_key,
                    "days": parts[0].strip() if len(parts) > 0 else slot_name,
                    "time": parts[1].strip() if len(parts) > 1 else "TBD",
                    "students_count": 0,
                    "student_ids": []
                }
            classes_map[slot_key]["students_count"] += 1
            classes_map[slot_key]["student_ids"].append(str(s["_id"]))

    return list(classes_map.values())


@router.post("/", summary="Add a new instructor (Admin Only)")
async def add_instructor(
    name: str = Form(...),
    about: Optional[str] = Form(""),
    specialty: Optional[str] = Form(""),
    avatar: Optional[UploadFile] = File(None),
    admin_user: dict = Depends(require_admin)
):
    db = get_db()
    avatar_url = None

    if avatar and avatar.filename:
        avatar_url = await upload_media_file(avatar, folder="instructors", prefix="instructor")
    else:
        name_quoted = quote_plus(name)
        avatar_url = f"https://ui-avatars.com/api/?name={name_quoted}&background=C5E5E8&color=072224&size=150&font-size=0.33&bold=true"

    try:
        doc = {
            "name": name.strip(),
            "about": about or specialty or "",
            "specialty": specialty or about or "",
            "avatar": avatar_url,
            "is_active": True,
            "created_at": datetime.utcnow()
        }
        result = await db.instructors.insert_one(doc)
        return {"message": "Instructor added.", "id": str(result.inserted_id), "avatar": avatar_url}
    except Exception as e:
        print(f"ERROR adding instructor: {e}")
        raise HTTPException(status_code=500, detail="Could not add instructor.")


@router.put("/{instructor_id}", summary="Update an instructor (Admin Only)")
async def update_instructor(
    instructor_id: str,
    name: str = Form(...),
    about: Optional[str] = Form(""),
    specialty: Optional[str] = Form(""),
    is_active: Optional[bool] = Form(True),
    avatar: Optional[UploadFile] = File(None),
    admin_user: dict = Depends(require_admin)
):
    db = get_db()
    try:
        existing = await db.instructors.find_one({"_id": ObjectId(instructor_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Instructor not found")

        update_data = {
            "name": name.strip(),
            "about": about or specialty or "",
            "specialty": specialty or about or "",
            "is_active": is_active if is_active is not None else existing.get("is_active", True),
            "updated_at": datetime.utcnow()
        }

        if avatar and avatar.filename:
            update_data["avatar"] = await upload_media_file(avatar, folder="instructors", prefix="instructor")

        await db.instructors.update_one({"_id": ObjectId(instructor_id)}, {"$set": update_data})
        return {"message": "Instructor updated successfully."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR updating instructor: {e}")
        raise HTTPException(status_code=500, detail="Could not update instructor.")


@router.delete("/{instructor_id}", summary="Delete an instructor (Admin Only)")
async def delete_instructor(
    instructor_id: str,
    admin_user: dict = Depends(require_admin)
):
    db = get_db()
    try:
        result = await db.instructors.delete_one({"_id": ObjectId(instructor_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Instructor not found")
        return {"message": "Instructor deleted."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR deleting instructor: {e}")
        raise HTTPException(status_code=500, detail="Could not delete instructor.")

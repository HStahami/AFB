import re
from urllib.parse import quote_plus
from bson import ObjectId
from datetime import timezone, datetime
from fastapi import APIRouter, HTTPException, File, UploadFile, Form, Depends, status, Request
from typing import Optional, List
from app.database import get_db
from app.core.dependencies import get_current_user, require_admin, require_roles
from app.core.security import hash_password
from app.services.storage_service import upload_media_file
from app.services.credential_service import generate_secure_temporary_password, send_instructor_credentials

router = APIRouter(prefix="/api/instructors", tags=["Instructors"])


def _format_instructor(doc: dict) -> dict:
    doc["id"] = str(doc["_id"])
    doc["_id"] = str(doc["_id"])
    if doc.get("user_id"):
        doc["user_id"] = str(doc["user_id"])
    doc["email"] = doc.get("email", "")
    doc["username"] = doc.get("username", "")
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

    formatted = _format_instructor(instructor)
    if not formatted.get("email") and current_user.get("email"):
        formatted["email"] = current_user.get("email")
    return formatted


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
    update_dict = {"updated_at": datetime.now(timezone.utc)}

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
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
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
    async for enr in db.enrollments.find({"instructor_id": inst_oid, "status": {"$in": ["active", "Active"]}}):
        slot_id = enr.get("slot_id")
        slot_key = str(slot_id) if slot_id else "general"
        if slot_key not in classes_map:
            slot_doc = await db.slots.find_one({"_id": slot_id}) if slot_id else None
            classes_map[slot_key] = {
                "slot_id": slot_key,
                "days": slot_doc.get("days", "Flexible Schedule") if slot_doc else "Flexible Schedule",
                "time": slot_doc.get("time", "TBD") if slot_doc else "TBD",
                "is_live": bool(slot_doc.get("is_live", False)) if slot_doc else False,
                "live_started_at": slot_doc["live_started_at"].isoformat() if (slot_doc and slot_doc.get("live_started_at")) else None,
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
                slot_doc = await db.slots.find_one({"$or": [{"days": parts[0].strip()}, {"days": slot_name}]})
                classes_map[slot_key] = {
                    "slot_id": str(slot_doc["_id"]) if slot_doc else slot_key,
                    "days": parts[0].strip() if len(parts) > 0 else slot_name,
                    "time": parts[1].strip() if len(parts) > 1 else (slot_doc.get("time", "TBD") if slot_doc else "TBD"),
                    "is_live": bool(slot_doc.get("is_live", False)) if slot_doc else False,
                    "live_started_at": slot_doc["live_started_at"].isoformat() if (slot_doc and slot_doc.get("live_started_at")) else None,
                    "students_count": 0,
                    "student_ids": []
                }
            classes_map[slot_key]["students_count"] += 1
            classes_map[slot_key]["student_ids"].append(str(s["_id"]))

    # If no specific slot assigned yet, provide active slots from catalog
    if not classes_map:
        async for s_doc in db.slots.find({"status": "Active"}).sort("created_at", 1).limit(5):
            s_id = str(s_doc["_id"])
            classes_map[s_id] = {
                "slot_id": s_id,
                "days": s_doc.get("days", "Class Session"),
                "time": s_doc.get("time", "TBD"),
                "is_live": bool(s_doc.get("is_live", False)),
                "live_started_at": s_doc["live_started_at"].isoformat() if s_doc.get("live_started_at") else None,
                "students_count": 0,
                "student_ids": []
            }

    if not classes_map:
        classes_map["general"] = {
            "slot_id": "general",
            "days": "General Classroom",
            "time": "Open Live Session",
            "is_live": False,
            "live_started_at": None,
            "students_count": 0,
            "student_ids": []
        }

    return list(classes_map.values())


@router.post("/", summary="Add a new instructor (Admin Only)")
async def add_instructor(
    name: str = Form(...),
    email: str = Form(...),
    about: Optional[str] = Form(""),
    specialty: Optional[str] = Form(""),
    avatar: Optional[UploadFile] = File(None),
    admin_user: dict = Depends(require_admin)
):
    db = get_db()
    email_clean = email.strip().lower()

    if not email_clean or "@" not in email_clean:
        raise HTTPException(status_code=400, detail="A valid instructor email address is required.")

    # 1. Prevent duplicate email in users and instructors
    existing_user = await db.users.find_one({"email": email_clean})
    if existing_user:
        raise HTTPException(status_code=400, detail=f"An account with email '{email_clean}' already exists.")

    existing_instructor = await db.instructors.find_one({"email": email_clean})
    if existing_instructor:
        raise HTTPException(status_code=400, detail=f"An instructor with email '{email_clean}' already exists.")

    # 2. Upload avatar or generate fallback avatar
    avatar_url = None
    if avatar and avatar.filename:
        avatar_url = await upload_media_file(avatar, folder="instructors", prefix="instructor")
    else:
        name_quoted = quote_plus(name.strip())
        avatar_url = f"https://ui-avatars.com/api/?name={name_quoted}&background=C5E5E8&color=072224&size=150&font-size=0.33&bold=true"

    # 3. Generate unique username
    base_user = re.sub(r'[^a-zA-Z0-9]', '', name.strip().lower())
    if len(base_user) < 3:
        base_user = email_clean.split("@")[0]
        base_user = re.sub(r'[^a-zA-Z0-9]', '', base_user)
    if not base_user:
        base_user = "instructor"

    candidate_username = base_user
    counter = 1
    while await db.users.find_one({"username": candidate_username}):
        candidate_username = f"{base_user}{counter}"
        counter += 1

    username = candidate_username

    # 4. Generate cryptographically strong temporary password & hash with Argon2id
    temp_password = generate_secure_temporary_password(10)
    pwd_hash = hash_password(temp_password)

    try:
        # 5. Provision user record in db.users
        user_doc = {
            "username": username,
            "email": email_clean,
            "password_hash": pwd_hash,
            "role": "instructor",
            "status": "active",
            "first_login": True,
            "profile_completed": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        res_user = await db.users.insert_one(user_doc)
        user_id = res_user.inserted_id

        # 6. Save instructor profile linked to user_id
        doc = {
            "user_id": user_id,
            "name": name.strip(),
            "email": email_clean,
            "username": username,
            "about": about or specialty or "",
            "specialty": specialty or about or "",
            "avatar": avatar_url,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        }
        result = await db.instructors.insert_one(doc)
        inst_id = result.inserted_id

        # 7. Dispatch official credentials email
        email_sent = False
        try:
            email_sent = send_instructor_credentials(
                instructor_name=name.strip(),
                instructor_email=email_clean,
                username=username,
                temp_password=temp_password
            )
        except Exception as mail_err:
            print(f"[INSTRUCTOR ADD] Note: Email delivery notice: {mail_err}")

        return {
            "message": "Instructor added and login credentials dispatched to email.",
            "id": str(inst_id),
            "user_id": str(user_id),
            "username": username,
            "email": email_clean,
            "avatar": avatar_url,
            "email_sent": email_sent
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR adding instructor: {e}")
        raise HTTPException(status_code=500, detail="Could not add instructor.")


@router.put("/{instructor_id}", summary="Update an instructor (Admin Only)")
async def update_instructor(
    instructor_id: str,
    name: str = Form(...),
    email: Optional[str] = Form(None),
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

        email_clean = email.strip().lower() if email else existing.get("email")

        # If email is modified, ensure no collision
        if email_clean and email_clean != existing.get("email"):
            if await db.users.find_one({"email": email_clean, "_id": {"$ne": existing.get("user_id")}}):
                raise HTTPException(status_code=400, detail="Another account is already using this email.")
            if await db.instructors.find_one({"email": email_clean, "_id": {"$ne": ObjectId(instructor_id)}}):
                raise HTTPException(status_code=400, detail="Another instructor is already using this email.")

        update_data = {
            "name": name.strip(),
            "about": about or specialty or "",
            "specialty": specialty or about or "",
            "is_active": is_active if is_active is not None else existing.get("is_active", True),
            "updated_at": datetime.now(timezone.utc)
        }
        if email_clean:
            update_data["email"] = email_clean

        if avatar and avatar.filename:
            update_data["avatar"] = await upload_media_file(avatar, folder="instructors", prefix="instructor")

        await db.instructors.update_one({"_id": ObjectId(instructor_id)}, {"$set": update_data})

        # Synchronize linked account in db.users
        user_id = existing.get("user_id")
        user_updates = {
            "updated_at": datetime.now(timezone.utc),
            "status": "active" if update_data["is_active"] else "inactive"
        }
        if email_clean:
            user_updates["email"] = email_clean

        if user_id:
            await db.users.update_one({"_id": user_id}, {"$set": user_updates})
        elif existing.get("email"):
            await db.users.update_one({"email": existing.get("email"), "role": "instructor"}, {"$set": user_updates})

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
        existing = await db.instructors.find_one({"_id": ObjectId(instructor_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Instructor not found")

        # Remove linked user account
        user_id = existing.get("user_id")
        if user_id:
            await db.users.delete_one({"_id": user_id})
        elif existing.get("email"):
            await db.users.delete_one({"email": existing.get("email"), "role": "instructor"})

        result = await db.instructors.delete_one({"_id": ObjectId(instructor_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Instructor not found")
        return {"message": "Instructor deleted."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR deleting instructor: {e}")
        raise HTTPException(status_code=500, detail="Could not delete instructor.")


@router.post("/{instructor_id}/resend-credentials", summary="Resend login credentials to instructor (Admin Only)")
async def resend_instructor_credentials_api(
    instructor_id: str,
    admin_user: dict = Depends(require_admin)
):
    db = get_db()
    try:
        existing = await db.instructors.find_one({"_id": ObjectId(instructor_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Instructor not found")

        email = existing.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Instructor does not have a configured email address.")

        email_clean = email.strip().lower()
        temp_password = generate_secure_temporary_password(10)
        pwd_hash = hash_password(temp_password)

        user_id = existing.get("user_id")
        user = None
        if user_id:
            user = await db.users.find_one({"_id": user_id})
        if not user:
            user = await db.users.find_one({"email": email_clean})

        username = existing.get("username")
        if user:
            username = user.get("username", username or email_clean.split("@")[0])
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {
                    "password_hash": pwd_hash,
                    "first_login": True,
                    "status": "active",
                    "updated_at": datetime.now(timezone.utc)
                }}
            )
        else:
            # Provision user account if missing
            base_user = re.sub(r'[^a-zA-Z0-9]', '', existing.get("name", "instructor").lower()) or email_clean.split("@")[0]
            candidate_username = base_user
            counter = 1
            while await db.users.find_one({"username": candidate_username}):
                candidate_username = f"{base_user}{counter}"
                counter += 1
            username = candidate_username

            res_user = await db.users.insert_one({
                "username": username,
                "email": email_clean,
                "password_hash": pwd_hash,
                "role": "instructor",
                "status": "active",
                "first_login": True,
                "profile_completed": True,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            })
            await db.instructors.update_one(
                {"_id": existing["_id"]},
                {"$set": {"user_id": res_user.inserted_id, "username": username}}
            )

        sent = send_instructor_credentials(
            instructor_name=existing.get("name", "Instructor"),
            instructor_email=email_clean,
            username=username or email_clean,
            temp_password=temp_password
        )

        return {
            "message": f"Login credentials successfully sent to {email_clean}.",
            "email_sent": bool(sent),
            "email": email_clean
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR resending instructor credentials: {e}")
        raise HTTPException(status_code=500, detail="Could not resend credentials.")

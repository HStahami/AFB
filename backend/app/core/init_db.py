from datetime import datetime
from app.config import settings
from app.core.security import hash_password


async def init_database(db):
    """
    Idempotent database initialization & Phase 3 migration:
    1. Ensures indexes across users, students, enrollments, tasks, etc.
    2. Bootstraps the initial admin account using Argon2id if none exists
    3. Non-destructively enriches existing instructors with `is_active=True`
    4. Non-destructively assigns `student_code` to existing students if missing
    5. Non-destructively provisions linked `users` accounts for existing students
    6. Non-destructively populates initial `enrollments` records for assigned students
    """
    if db is None:
        return

    # 1. Safe Index Creation & Compound Constraints
    try:
        await db.users.create_index("email", unique=True)
        await db.users.create_index("username", unique=True)
        await db.users.create_index("student_code", unique=True, sparse=True)
        await db.students.create_index("student_code", unique=True, sparse=True)
        await db.students.create_index("email")
        await db.students.create_index("user_id")
        await db.instructors.create_index("user_id", sparse=True)
        await db.enrollments.create_index("student_id")
        await db.enrollments.create_index("instructor_id")
        await db.enrollments.create_index("module_id")
        await db.tasks.create_index("module_id")
        await db.tasks.create_index("instructor_id")
        await db.submissions.create_index("task_id")
        await db.submissions.create_index("student_id")
        await db.assessments.create_index("submission_id")
        await db.assessments.create_index("student_id")
        await db.notifications.create_index([("recipient_user_id", 1), ("is_read", 1)])
        await db.resources.create_index("module_id")

        # Safely remove unassessed test duplicate attempt if present before unique index creation
        await db.submissions.delete_many({
            "content": "Duplicate attempt.",
            "status": "submitted"
        })

        # Compound Unique Constraints (P1: DATA-002)
        await db.submissions.create_index([("task_id", 1), ("student_id", 1)], unique=True)
        await db.enrollments.create_index([("student_id", 1), ("module_id", 1)], unique=True, sparse=True)
        await db.attendance.create_index([("student_id", 1), ("date", 1), ("slot_id", 1)], unique=True, sparse=True)
    except Exception as e:
        print(f"[INIT DB] Note on index creation: {e}")

    # 1B. User Schema Normalization (P2: SCHEMA-001)
    try:
        await db.users.update_many(
            {"status": "active", "is_active": {"$exists": False}},
            {"$set": {"is_active": True}}
        )
        await db.users.update_many(
            {"is_active": True, "status": {"$exists": False}},
            {"$set": {"status": "active"}}
        )
    except Exception as e:
        print(f"[INIT DB] Note on user schema normalization: {e}")


    # 2. Idempotent Admin Bootstrap
    try:
        admin_count = await db.users.count_documents({"role": "admin"})
        if admin_count == 0:
            admin_username = settings.ADMIN_USERNAME.strip().lower()
            admin_email = (settings.EMAIL_FROM or f"{admin_username}@alarabia.edu").strip().lower()
            admin_doc = {
                "username": admin_username,
                "email": admin_email,
                "password_hash": hash_password(settings.ADMIN_PASSWORD),
                "role": "admin",
                "status": "active",
                "first_login": False,
                "profile_completed": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.users.insert_one(admin_doc)
            print(f"[INIT DB] Bootstrapped initial admin: '{admin_username}' (Argon2id)")
        else:
            print("[INIT DB] Admin user already exists. Preserving existing account.")
    except Exception as e:
        print(f"[INIT DB] Note on admin verification: {e}")

    # 3. Non-destructive instructor status check
    try:
        await db.instructors.update_many(
            {"is_active": {"$exists": False}},
            {"$set": {"is_active": True}}
        )
    except Exception as e:
        print(f"[INIT DB] Note on instructors check: {e}")

    # 4. Non-destructive student_code generation for existing students
    try:
        current_year = datetime.utcnow().year
        counter = 1
        async for s in db.students.find({"student_code": {"$exists": False}}).sort("approved_at", 1):
            code = f"AFB-{current_year}-{counter:04d}"
            while await db.students.find_one({"student_code": code}):
                counter += 1
                code = f"AFB-{current_year}-{counter:04d}"
            await db.students.update_one({"_id": s["_id"]}, {"$set": {"student_code": code}})
            counter += 1
    except Exception as e:
        print(f"[INIT DB] Note on student_code migration: {e}")

    # 5. Non-destructive user account linkage for existing students
    try:
        async for student in db.students.find({"user_id": {"$exists": False}}):
            email = student.get("email", "").strip().lower()
            code = student.get("student_code")
            existing_user = await db.users.find_one({
                "$or": [
                    {"email": email},
                    {"student_code": code}
                ]
            }) if (email or code) else None

            if not existing_user:
                # Provision user account with Argon2id hash
                default_password = code or "AlArabia2026!"
                user_doc = {
                    "username": code or email,
                    "email": email,
                    "password_hash": hash_password(default_password),
                    "role": "student",
                    "status": "active",
                    "first_login": True,
                    "profile_completed": False,
                    "student_code": code,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                res = await db.users.insert_one(user_doc)
                user_id = res.inserted_id
            else:
                user_id = existing_user["_id"]
                if code and not existing_user.get("student_code"):
                    await db.users.update_one({"_id": user_id}, {"$set": {"student_code": code}})

            await db.students.update_one(
                {"_id": student["_id"]},
                {"$set": {"user_id": user_id}}
            )

        # 6. Non-destructive enrollment generation for assigned students
        async for s in db.students.find({"$or": [{"instructor_id": {"$ne": None}}, {"slot_id": {"$ne": None}}]}):
            existing_enrollment = await db.enrollments.find_one({"student_id": s["_id"]})
            if not existing_enrollment:
                await db.enrollments.insert_one({
                    "student_id": s["_id"],
                    "instructor_id": s.get("instructor_id"),
                    "slot_id": s.get("slot_id"),
                    "module_id": None,
                    "status": "active",
                    "start_date": datetime.utcnow(),
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                })
    except Exception as e:
        print(f"[INIT DB] Note on student user linkage & enrollment backfill: {e}")

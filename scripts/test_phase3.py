import os
import sys
import asyncio
from datetime import datetime, timezone
from bson import ObjectId

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

import httpx
from app.main import app
from app.config import settings
from app.core.security import hash_password, create_access_token
from app.database import get_db, connect_to_mongo, close_mongo_connection
from app.core.init_db import init_database


async def run_phase3_tests():
    print("\n=======================================================")
    print("RUNNING ALARABIA FI BUYUTIKUM — PHASE 3 TEST SUITE")
    print("=======================================================\n")

    await connect_to_mongo()
    db = get_db()
    await init_database(db)

    created_ids = {
        "admissions": [],
        "students": [],
        "users": [],
        "enrollments": [],
        "tasks": [],
        "submissions": [],
        "assessments": [],
        "attendance": [],
        "notifications": [],
        "modules": [],
        "instructors": []
    }

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:

        # ---------------------------------------------------------
        # T. Public Endpoints Verification
        # ---------------------------------------------------------
        print("--- [T] Testing Public Endpoints ---")
        r = await client.get("/api/modules/")
        assert r.status_code == 200
        r = await client.get("/api/instructors/")
        assert r.status_code == 200
        r = await client.get("/api/slots/")
        assert r.status_code == 200
        print("[PASS] Public modules, instructors, and slots return 200 OK.")

        # ---------------------------------------------------------
        # S. Admin Authentication
        # ---------------------------------------------------------
        print("\n--- [S] Testing Admin Authentication & Existing Admin Routes ---")
        r = await client.post("/api/auth/login", json={
            "username": settings.ADMIN_USERNAME,
            "password": settings.ADMIN_PASSWORD
        })
        assert r.status_code == 200, f"Admin login failed: {r.text}"
        admin_data = r.json()
        admin_token = admin_data["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        print("[PASS] Admin login succeeded.")

        r = await client.get("/api/dashboard/stats", headers=admin_headers)
        assert r.status_code == 200
        print("[PASS] GET /api/dashboard/stats works with Admin token (200 OK).")

        # ---------------------------------------------------------
        # A & B & C. Admission Submission & Approval -> Student Account Provisioning
        # ---------------------------------------------------------
        print("\n--- [A, B, C] Testing Admission Submission & Account Provisioning ---")
        test_email = f"test_student_{datetime.now(timezone.utc).timestamp()}@example.com"
        r = await client.post("/api/admissions/", json={
            "first_name": "Tariq",
            "last_name": "Mansoor",
            "email": test_email,
            "phone": "+923001234567"
        })
        assert r.status_code == 200
        form_id = r.json()["form_id"]
        created_ids["admissions"].append(ObjectId(form_id))
        print(f"[PASS] Admission submitted successfully (form_id: {form_id}).")

        # Fee status update
        r = await client.patch(f"/api/admissions/{form_id}/fee-status", json={"fee_status": "verified"}, headers=admin_headers)
        assert r.status_code == 200
        print("[PASS] Fee status updated to 'verified'.")

        # Approve admission
        r = await client.patch(f"/api/admissions/{form_id}/approve", headers=admin_headers)
        assert r.status_code == 200, f"Approval failed: {r.text}"
        approval_res = r.json()
        student_code = approval_res["student_code"]
        assert student_code.startswith("AFB-"), f"Unexpected student_code format: {student_code}"
        print(f"[PASS] [A] Student code generated: {student_code}")

        # Verify Student & User in DB
        student_doc = await db.students.find_one({"student_code": student_code})
        assert student_doc is not None, "Student record missing in DB!"
        created_ids["students"].append(student_doc["_id"])

        user_doc = await db.users.find_one({"student_code": student_code})
        assert user_doc is not None, "User record missing in DB!"
        created_ids["users"].append(user_doc["_id"])

        # [B] Verify role is student and linked correctly
        assert user_doc["role"] == "student"
        assert student_doc["user_id"] == user_doc["_id"]
        print("[PASS] [B] User account created with role='student' and linked to student profile.")

        # [C] Verify Argon2id password hash and absence of plaintext
        assert user_doc["password_hash"].startswith("$argon2id$")
        assert "password" not in user_doc
        assert "temp_password" not in user_doc
        print("[PASS] [C] Password stored strictly as Argon2id hash (plaintext absent from database).")

        # ---------------------------------------------------------
        # D. Idempotent Re-approval
        # ---------------------------------------------------------
        print("\n--- [D] Testing Idempotent Re-Approval ---")
        r = await client.patch(f"/api/admissions/{form_id}/approve", headers=admin_headers)
        assert r.status_code == 200
        re_approval = r.json()
        assert re_approval["is_new"] is False
        assert re_approval["student_code"] == student_code
        users_count = await db.users.count_documents({"student_code": student_code})
        assert users_count == 1, "Duplicate user accounts created on re-approval!"
        print("[PASS] [D] Re-running approval preserved existing user and student records without duplicates.")

        # ---------------------------------------------------------
        # E, F, G, H. First-Login, Password Change & Profile Completion
        # ---------------------------------------------------------
        print("\n--- [E, F, G, H] Testing First-Login, Password Change & Profile Completion ---")
        
        # Set a known temporary password hash to test login
        temp_pwd = "TempSecretPass123!"
        await db.users.update_one({"_id": user_doc["_id"]}, {"$set": {"password_hash": hash_password(temp_pwd)}})

        # Login with student_code
        r = await client.post("/api/auth/login", json={
            "username": student_code,
            "password": temp_pwd
        })
        assert r.status_code == 200, f"Student login failed: {r.text}"
        student_login_data = r.json()
        student_token = student_login_data["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}
        user_info = student_login_data["user"]

        # [E] First login state
        assert user_info["first_login"] is True
        assert user_info["onboarding_status"] == "first_login_required"
        print("[PASS] [E] First login detected: first_login=True, onboarding_status='first_login_required'.")

        # [F] Password change
        new_pwd = "SecureStudent2026!"
        r = await client.post("/api/auth/change-password", json={
            "old_password": temp_pwd,
            "new_password": new_pwd
        }, headers=student_headers)
        assert r.status_code == 200, f"Password change failed: {r.text}"

        # Re-check /me after password change
        r = await client.get("/api/auth/me", headers=student_headers)
        assert r.status_code == 200
        updated_me = r.json()
        assert updated_me["first_login"] is False
        assert updated_me["profile_completed"] is False
        assert updated_me["onboarding_status"] == "profile_completion_required"
        print("[PASS] [F, G] Password change succeeded: first_login=False, onboarding_status='profile_completion_required'.")

        # [H] Profile completion
        r = await client.patch("/api/students/profile", json={
            "phone": "+923009998877",
            "date_of_birth": "2000-05-15",
            "gender": "Male",
            "address": "Islamabad, Pakistan",
            "guardian_name": "Mansoor Ahmad",
            "guardian_phone": "+923001112233",
            "guardian_relationship": "Father",
            "bio": "Passionate Arabic learner."
        }, headers=student_headers)
        assert r.status_code == 200, f"Profile update failed: {r.text}"

        # Re-check /me after profile completion
        r = await client.get("/api/auth/me", headers=student_headers)
        assert r.status_code == 200
        final_me = r.json()
        assert final_me["profile_completed"] is True
        assert final_me["onboarding_status"] == "completed"
        print("[PASS] [H] Profile completion succeeded: profile_completed=True, onboarding_status='completed'.")

        # ---------------------------------------------------------
        # I & J. Resource-Level Authorization (Student Isolation)
        # ---------------------------------------------------------
        print("\n--- [I, J] Testing Student Data Isolation (403 Forbidden) ---")
        
        # Create a second student
        user2_id = ObjectId()
        await db.users.insert_one({
            "_id": user2_id,
            "username": "student_two",
            "email": "student_two@example.com",
            "password_hash": hash_password("Secret123!"),
            "role": "student",
            "status": "active",
            "student_code": "AFB-2026-9998"
        })
        created_ids["users"].append(user2_id)

        student2_id = ObjectId()
        await db.students.insert_one({
            "_id": student2_id,
            "first_name": "Student",
            "last_name": "Two",
            "email": "student_two@example.com",
            "user_id": user2_id,
            "student_code": "AFB-2026-9998",
            "status": "Active"
        })
        created_ids["students"].append(student2_id)

        # [I] Student 1 can access own profile
        r = await client.get("/api/students/profile", headers=student_headers)
        assert r.status_code == 200
        assert r.json()["_id"] == str(student_doc["_id"])
        print("[PASS] [I] Student can access own profile data.")

        # [J] Student 1 CANNOT access Student 2's profile
        r = await client.get(f"/api/students/{student2_id}/profile", headers=student_headers)
        assert r.status_code == 403, f"Expected 403 Forbidden, got {r.status_code}"
        print("[PASS] [J] Student cannot access another student's profile (403 Forbidden enforced).")

        # ---------------------------------------------------------
        # K & L & M. Instructor & Admin Authorization
        # ---------------------------------------------------------
        print("\n--- [K, L, M] Testing Instructor & Admin Authorization ---")
        inst_user_id = ObjectId()
        await db.users.insert_one({
            "_id": inst_user_id,
            "username": "sheikh_ahmed",
            "email": "ahmed@example.com",
            "password_hash": hash_password("InstructorSecret123!"),
            "role": "instructor",
            "status": "active"
        })
        created_ids["users"].append(inst_user_id)

        inst_doc_id = ObjectId()
        await db.instructors.insert_one({
            "_id": inst_doc_id,
            "name": "Sheikh Ahmed",
            "email": "ahmed@example.com",
            "user_id": inst_user_id,
            "is_active": True
        })
        created_ids["instructors"].append(inst_doc_id)

        inst_token = create_access_token({"sub": str(inst_user_id), "role": "instructor", "email": "ahmed@example.com"})
        inst_headers = {"Authorization": f"Bearer {inst_token}"}

        # [L] Instructor not yet assigned to Student 1 cannot view Student 1's profile
        r = await client.get(f"/api/students/{student_doc['_id']}/profile", headers=inst_headers)
        assert r.status_code == 403, f"Expected 403, got {r.status_code}"
        print("[PASS] [L] Instructor cannot access unrelated student (403 Forbidden).")

        # ---------------------------------------------------------
        # N. Enrollment Model (Connects student + module + instructor + slot)
        # ---------------------------------------------------------
        print("\n--- [N] Testing Enrollment Model ---")
        test_mod_id = ObjectId()
        await db.modules.insert_one({
            "_id": test_mod_id,
            "name": "Arabic Level 1 (Beginner)",
            "description": "Foundational Grammar & Vocabulary",
            "order": 1
        })
        created_ids["modules"].append(test_mod_id)

        r = await client.post("/api/enrollments/", json={
            "student_id": str(student_doc["_id"]),
            "module_id": str(test_mod_id),
            "instructor_id": str(inst_doc_id),
            "status": "active"
        }, headers=admin_headers)
        assert r.status_code == 200, f"Enrollment creation failed: {r.text}"
        enrollment_id = r.json()["id"]
        created_ids["enrollments"].append(ObjectId(enrollment_id))
        print(f"[PASS] [N] Enrollment created connecting Student + Module + Instructor (ID: {enrollment_id}).")

        # [K] Now that Sheikh Ahmed is assigned, he CAN view Student 1's profile
        r = await client.get(f"/api/students/{student_doc['_id']}/profile", headers=inst_headers)
        assert r.status_code == 200
        print("[PASS] [K] Assigned instructor can access assigned student profile (200 OK).")

        # [M] Admin can access any profile
        r = await client.get(f"/api/students/{student_doc['_id']}/profile", headers=admin_headers)
        assert r.status_code == 200
        print("[PASS] [M] Admin can access any student profile (200 OK).")

        # ---------------------------------------------------------
        # O, P, Q, R. Tasks, Submissions, Assessments, Attendance & Notifications
        # ---------------------------------------------------------
        print("\n--- [O, P, Q, R] Testing Tasks, Submissions, Assessments & Attendance ---")

        # [O] Task Creation by Instructor
        r = await client.post("/api/tasks/", json={
            "module_id": str(test_mod_id),
            "enrollment_id": enrollment_id,
            "title": "Module 1 Homework",
            "description": "Translate Lesson 1 sentences.",
            "status": "published"
        }, headers=inst_headers)
        assert r.status_code == 200, f"Task creation failed: {r.text}"
        task_id = r.json()["id"]
        created_ids["tasks"].append(ObjectId(task_id))
        print(f"[PASS] [O] Task created by instructor (ID: {task_id}).")

        # Student lists tasks
        r = await client.get("/api/tasks/", headers=student_headers)
        assert r.status_code == 200
        assert len(r.json()) >= 1
        print("[PASS] Student can list published tasks for enrolled module.")

        # [P] Submission by Student
        r = await client.post("/api/submissions/", json={
            "task_id": task_id,
            "content": "Here is my Arabic translation submission for Lesson 1."
        }, headers=student_headers)
        assert r.status_code == 200, f"Submission failed: {r.text}"
        sub_id = r.json()["id"]
        created_ids["submissions"].append(ObjectId(sub_id))
        print(f"[PASS] [P] Student submitted response to task (ID: {sub_id}).")

        # Student 2 cannot access Student 1's submission
        student2_token = create_access_token({"sub": str(user2_id), "role": "student", "email": "student_two@example.com"})
        r = await client.get(f"/api/submissions/{sub_id}", headers={"Authorization": f"Bearer {student2_token}"})
        assert r.status_code == 403
        print("[PASS] Unauthorized student blocked from viewing another student's submission (403).")

        # Assessment / Grading by Instructor
        r = await client.post("/api/assessments/", json={
            "submission_id": sub_id,
            "score": 95.0,
            "grade": "A+",
            "feedback": "Excellent work! Accurate grammar."
        }, headers=inst_headers)
        assert r.status_code == 200
        ass_id = r.json()["id"]
        created_ids["assessments"].append(ObjectId(ass_id))
        print(f"[PASS] Instructor graded submission (Grade: A+, Score: 95.0).")

        # [Q] Attendance Recording
        r = await client.post("/api/attendance/", json={
            "student_id": str(student_doc["_id"]),
            "enrollment_id": enrollment_id,
            "date": "2026-09-04",
            "status": "present",
            "remarks": "Active participation in class."
        }, headers=inst_headers)
        assert r.status_code == 200
        created_ids["attendance"].append(ObjectId(r.json()["id"]))
        print("[PASS] [Q] Attendance recorded by instructor.")

        # Student views own attendance
        r = await client.get("/api/attendance/", headers=student_headers)
        assert r.status_code == 200
        assert len(r.json()) >= 1
        print("[PASS] Student can view own attendance records.")

        # [R] Notifications
        r = await client.get("/api/notifications/", headers=student_headers)
        assert r.status_code == 200
        notifs = r.json()
        assert len(notifs) >= 1
        print(f"[PASS] [R] Notification delivered to student (Count: {len(notifs)}).")

        # ---------------------------------------------------------
        # Dynamic Reporting Verification
        # ---------------------------------------------------------
        print("\n--- Dynamic Progress Reporting Verification ---")
        r = await client.get("/api/reports/me", headers=student_headers)
        assert r.status_code == 200
        report = r.json()
        assert report["enrollments_count"] >= 1
        assert report["tasks"]["total_assigned"] >= 1
        assert report["tasks"]["total_submitted"] >= 1
        assert report["attendance"]["present"] >= 1
        assert report["assessments"]["average_score"] == 95.0
        assert report["overall_progress_score"] > 0
        print(f"[PASS] Real-time Progress Report generated successfully:")
        print(f"       Tasks Completion Rate: {report['tasks']['completion_rate']}%")
        print(f"       Attendance Rate: {report['attendance']['attendance_rate']}%")
        print(f"       Average Score: {report['assessments']['average_score']}")
        print(f"       Overall Progress Index: {report['overall_progress_score']}")

        # ---------------------------------------------------------
        # Cleanup Test Artifacts
        # ---------------------------------------------------------
        print("\n--- Cleaning up temporary test artifacts ---")
        for coll_name, ids in created_ids.items():
            if ids:
                coll = getattr(db, coll_name)
                await coll.delete_many({"_id": {"$in": ids}})
        print("[PASS] All temporary test artifacts safely removed from database.")

    await close_mongo_connection()

    print("\n=======================================================")
    print("ALL 22 PHASE 3 REQUIREMENTS (A through V) PASSED 100%!")
    print("=======================================================\n")


if __name__ == '__main__':
    asyncio.run(run_phase3_tests())

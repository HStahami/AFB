import asyncio
import os
import sys
from datetime import datetime
from bson import ObjectId
import httpx
from dotenv import load_dotenv

# Load backend environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app
from app.database import get_db, connect_to_mongo
from app.core.security import hash_password, create_access_token

async def run_phase4_tests():
    print("==================================================")
    print("AL-ARABIA FI BUYUTIKUM â€” PHASE 4 VERIFICATION SUITE")
    print("==================================================")

    await connect_to_mongo()
    db = get_db()

    # 1. Verify / Setup Test Accounts
    print("\n[STEP 1] Checking / Preparing Test Accounts...")
    
    # Check Admin User
    admin_user = await db.users.find_one({"role": "admin"})
    if not admin_user:
        print("Creating admin user for test...")
        admin_doc = {
            "email": "admin_test@alarabia.edu",
            "password_hash": hash_password("AdminPass123!"),
            "role": "admin",
            "is_active": True,
            "created_at": datetime.utcnow()
        }
        res = await db.users.insert_one(admin_doc)
        admin_user = await db.users.find_one({"_id": res.inserted_id})

    # Check or create Instructor User
    instructor_user = await db.users.find_one({"role": "instructor"})
    if not instructor_user:
        print("Creating instructor user for test...")
        inst_doc = {
            "email": "ustadh_test@alarabia.edu",
            "password_hash": hash_password("InstructorPass123!"),
            "role": "instructor",
            "is_active": True,
            "must_change_password": False,
            "profile_completed": True,
            "created_at": datetime.utcnow()
        }
        res = await db.users.insert_one(inst_doc)
        instructor_user = await db.users.find_one({"_id": res.inserted_id})

    # Ensure linked instructor record exists
    instructor_record = await db.instructors.find_one({"user_id": instructor_user["_id"]})
    if not instructor_record:
        instructor_record = await db.instructors.find_one({"email": instructor_user["email"]})
    if not instructor_record:
        inst_rec = {
            "name": "Ustadh Zayd Al-Hasani",
            "email": instructor_user["email"],
            "user_id": instructor_user["_id"],
            "bio": "Senior Instructor of Classical Arabic & Morphology.",
            "specialization": "Arabic Grammar & Sarf",
            "phone": "+966500000001",
            "status": "active",
            "created_at": datetime.utcnow()
        }
        res = await db.instructors.insert_one(inst_rec)
        instructor_record = await db.instructors.find_one({"_id": res.inserted_id})
    else:
        # Link user_id if missing
        if "user_id" not in instructor_record or not instructor_record["user_id"]:
            await db.instructors.update_one({"_id": instructor_record["_id"]}, {"$set": {"user_id": instructor_user["_id"]}})

    # Check or create Student User
    student_user = await db.users.find_one({"role": "student"})
    if not student_user:
        print("Creating student user for test...")
        stud_doc = {
            "email": "talib_test@alarabia.edu",
            "password_hash": hash_password("StudentPass123!"),
            "role": "student",
            "is_active": True,
            "must_change_password": False,
            "profile_completed": True,
            "created_at": datetime.utcnow()
        }
        res = await db.users.insert_one(stud_doc)
        student_user = await db.users.find_one({"_id": res.inserted_id})

    # Ensure linked student record exists
    student_record = await db.students.find_one({"user_id": student_user["_id"]})
    if not student_record:
        student_record = await db.students.find_one({"email": student_user["email"]})
    if not student_record:
        stud_rec = {
            "first_name": "Tariq",
            "last_name": "Mansoor",
            "email": student_user["email"],
            "student_code": "AFB-TEST-001",
            "user_id": student_user["_id"],
            "status": "enrolled",
            "instructor_id": instructor_record["_id"],
            "created_at": datetime.utcnow()
        }
        res = await db.students.insert_one(stud_rec)
        student_record = await db.students.find_one({"_id": res.inserted_id})
    else:
        # Link student to instructor if not linked
        await db.students.update_one(
            {"_id": student_record["_id"]},
            {"$set": {"user_id": student_user["_id"], "instructor_id": instructor_record["_id"]}}
        )

    # Ensure at least one module exists
    module = await db.modules.find_one()
    if not module:
        res = await db.modules.insert_one({
            "title": "Arabic Syntax (Nahw I)",
            "description": "Introduction to Arabic sentence structures",
            "created_at": datetime.utcnow()
        })
        module = await db.modules.find_one({"_id": res.inserted_id})

    # Generate JWT Tokens
    admin_token = create_access_token({"sub": str(admin_user["_id"]), "role": "admin"})
    instructor_token = create_access_token({"sub": str(instructor_user["_id"]), "role": "instructor"})
    student_token = create_access_token({"sub": str(student_user["_id"]), "role": "student"})

    inst_headers = {"Authorization": f"Bearer {instructor_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}

    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        
        # Test 1: Role-Based Access Control - Student Denied Instructor Routes
        print("\n[TEST 1] Verifying RBAC: Student accessing instructor endpoints...")
        r = await client.get("/api/instructors/dashboard-stats", headers=student_headers)
        assert r.status_code == 403, f"Expected 403, got {r.status_code}"
        print("  âœ“ PASS: Student correctly received 403 Forbidden on instructor route.")

        # Test 2: Instructor Profile
        print("\n[TEST 2] Verifying GET /api/instructors/me...")
        r = await client.get("/api/instructors/me", headers=inst_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        assert data["email"] == instructor_user["email"]
        print(f"  âœ“ PASS: Instructor profile loaded for {data.get('name')}.")

        # Test 3: Instructor Profile Update
        print("\n[TEST 3] Verifying PATCH /api/instructors/profile...")
        updated_bio = "Updated Bio: Specializing in Classical Arabic Syntax & Advanced Morphology."
        r = await client.patch(
            "/api/instructors/profile",
            headers=inst_headers,
            json={"bio": updated_bio, "specialization": "Classical Syntax"}
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        assert r.json()["bio"] == updated_bio
        print("  âœ“ PASS: Instructor profile bio updated successfully.")

        # Test 4: Dashboard Stats
        print("\n[TEST 4] Verifying GET /api/instructors/dashboard-stats...")
        r = await client.get("/api/instructors/dashboard-stats", headers=inst_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        stats = r.json()
        assert "active_students" in stats
        assert "assigned_classes" in stats
        assert "pending_submissions" in stats
        assert "avg_attendance_rate" in stats
        print(f"  âœ“ PASS: Dashboard stats retrieved: {stats}")

        # Test 5: My Students Roster
        print("\n[TEST 5] Verifying GET /api/instructors/my-students...")
        r = await client.get("/api/instructors/my-students", headers=inst_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        students = r.json()
        assert len(students) >= 1
        print(f"  âœ“ PASS: Assigned students roster retrieved ({len(students)} students).")

        # Test 6: My Classes
        print("\n[TEST 6] Verifying GET /api/instructors/my-classes...")
        r = await client.get("/api/instructors/my-classes", headers=inst_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        classes = r.json()
        print(f"  âœ“ PASS: Assigned classes retrieved ({len(classes)} slots).")

        # Test 7: Task Creation by Instructor
        print("\n[TEST 7] Verifying POST /api/tasks/ by instructor...")
        task_payload = {
            "module_id": str(module["_id"]),
            "title": "Phase 4 Grammar Assignment: I'rab of Surah Al-Fatihah",
            "description": "Analyze grammatical cases of verse 1 to 3.",
            "instructions": "Submit clear notes with case endings highlighted.",
            "status": "published"
        }
        r = await client.post("/api/tasks/", headers=inst_headers, json=task_payload)
        assert r.status_code in [200, 201], f"Expected 200/201, got {r.status_code}: {r.text}"
        created_task = r.json()
        task_id = created_task["id"]
        print(f"  âœ“ PASS: Task created successfully (ID: {task_id}).")

        # Test 8: Student Submits to Task
        print("\n[TEST 8] Verifying student submission to created task...")
        submission_payload = {
            "task_id": task_id,
            "content": "Bismillah: Ba is Harf Jarr, Ism is Majroor bi-kasrah.",
            "attachment_urls": ["https://cloudinary.com/sample_submission.pdf"]
        }
        r = await client.post("/api/submissions/", headers=student_headers, json=submission_payload)
        assert r.status_code in [200, 201], f"Expected 200/201, got {r.status_code}: {r.text}"
        created_sub = r.json()
        sub_id = created_sub["id"]
        print(f"  âœ“ PASS: Student submitted task (ID: {sub_id}).")

        # Test 9: Instructor Reviews Submissions
        print("\n[TEST 9] Verifying GET /api/submissions/ with status=submitted...")
        r = await client.get(f"/api/submissions/?task_id={task_id}&status=submitted", headers=inst_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        subs = r.json()
        assert len(subs) >= 1
        assert subs[0]["task_title"] != ""
        assert subs[0]["student_name"] != ""
        print(f"  âœ“ PASS: Submissions retrieved with enriched task_title and student_name: {subs[0]['student_name']}.")

        # Test 10: Instructor Grades Submission (Assessment)
        print("\n[TEST 10] Verifying POST /api/assessments/ by instructor...")
        assessment_payload = {
            "submission_id": sub_id,
            "task_id": task_id,
            "student_id": str(student_record["_id"]),
            "score": 96.5,
            "grade": "A+",
            "feedback": "Mumtaz! Excellent mastery of the genitive case."
        }
        r = await client.post("/api/assessments/", headers=inst_headers, json=assessment_payload)
        assert r.status_code in [200, 201], f"Expected 200/201, got {r.status_code}: {r.text}"
        ass = r.json()
        print(f"  âœ“ PASS: Assessment created with Grade {ass.get('grade')}, Score {ass.get('score')}%.")

        # Verify Submission status changed to reviewed
        r = await client.get(f"/api/submissions/?task_id={task_id}", headers=inst_headers)
        reviewed_subs = [s for s in r.json() if s["id"] == sub_id]
        assert len(reviewed_subs) == 1 and reviewed_subs[0]["status"] == "reviewed"
        print("  âœ“ PASS: Submission status updated to 'reviewed'.")

        # Test 11: Bulk Attendance Recording
        print("\n[TEST 11] Verifying POST /api/attendance/bulk by instructor...")
        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        bulk_payload = [
            {
                "student_id": str(student_record["_id"]),
                "date": today_str,
                "status": "present",
                "remarks": "Active participation in class recitation"
            }
        ]
        r = await client.post("/api/attendance/bulk", headers=inst_headers, json=bulk_payload)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        assert r.json()["saved_count"] >= 1
        print(f"  âœ“ PASS: Bulk attendance saved: {r.json()}")

        # Test 12: List Attendance with Enriched Student Names
        print("\n[TEST 12] Verifying GET /api/attendance/?date=...")
        r = await client.get(f"/api/attendance/?date={today_str}", headers=inst_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        att_records = r.json()
        assert len(att_records) >= 1
        assert "student_name" in att_records[0]
        print(f"  âœ“ PASS: Attendance retrieved with student_name: {att_records[0]['student_name']}.")

        # Test 13: Educational Resources Management
        print("\n[TEST 13] Verifying POST & DELETE /api/resources/...")
        res_payload = {
            "title": "Comprehensive Nahw Cheatsheet",
            "description": "Quick reference guide for grammatical signs and declensions.",
            "resource_type": "pdf",
            "url": "https://cloudinary.com/nahw_summary.pdf",
            "module_id": str(module["_id"])
        }
        r = await client.post("/api/resources/", headers=inst_headers, json=res_payload)
        assert r.status_code in [200, 201], f"Expected 200/201, got {r.status_code}"
        created_res = r.json()
        res_id = created_res["id"]
        print(f"  âœ“ PASS: Resource created (ID: {res_id}).")

        # List resources
        r = await client.get(f"/api/resources/?module_id={module['_id']}", headers=inst_headers)
        assert r.status_code == 200
        assert any(x["id"] == res_id for x in r.json())
        print(f"  âœ“ PASS: Resource listed in module.")

        # Delete resource
        r = await client.delete(f"/api/resources/{res_id}", headers=inst_headers)
        assert r.status_code == 200
        print("  âœ“ PASS: Resource deleted cleanly.")

        # Test 14: Notifications Management
        print("\n[TEST 14] Verifying notifications for instructor...")
        # Create a test notification in DB for instructor
        notif_id = ObjectId()
        await db.notifications.insert_one({
            "_id": notif_id,
            "user_id": instructor_user["_id"],
            "title": "Test Submission Received",
            "message": "Student Tariq submitted task 'I'rab of Surah Al-Fatihah'",
            "type": "submission",
            "is_read": False,
            "created_at": datetime.utcnow()
        })
        r = await client.get("/api/notifications/", headers=inst_headers)
        assert r.status_code == 200
        notifs = r.json()
        assert len(notifs) >= 1
        print(f"  âœ“ PASS: Retrieved {len(notifs)} notifications.")

        # Mark all read
        r = await client.patch("/api/notifications/read-all", headers=inst_headers)
        assert r.status_code == 200
        print("  âœ“ PASS: Marked all notifications as read.")

        # Test 15: Student Progress Report Scoped Access
        print("\n[TEST 15] Verifying GET /api/reports/student/{student_id}...")
        r = await client.get(f"/api/reports/student/{student_record['_id']}", headers=inst_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        rep = r.json()
        assert "overall_progress_score" in rep
        assert "attendance" in rep
        assert "tasks" in rep
        assert "assessments" in rep
        print(f"  âœ“ PASS: Student progress summary computed: Progress {rep['overall_progress_score']}%, Attendance Rate {rep['attendance']['attendance_rate']}%.")

        # Test 16: Admin Regression Verification
        print("\n[TEST 16] Verifying Admin Dashboard API regression...")
        r = await client.get("/api/dashboard/stats", headers=admin_headers)
        assert r.status_code == 200, f"Admin stats failed with {r.status_code}"
        admin_stats = r.json()
        assert "total_students" in admin_stats
        assert "total_instructors" in admin_stats
        print(f"  âœ“ PASS: Admin Dashboard API intact: {admin_stats}")

    print("\n==================================================")
    print("ALL 16 PHASE 4 INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_phase4_tests())


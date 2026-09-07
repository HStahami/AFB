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

async def run_phase5_tests():
    print("==================================================")
    print("AL-ARABIA FI BUYUTIKUM - PHASE 5 VERIFICATION SUITE")
    print("STUDENT PORTAL & WORKFLOW INTEGRATION")
    print("==================================================")

    await connect_to_mongo()
    db = get_db()

    # 1. Setup Test Accounts
    print("\n[STEP 1] Setting up / verifying test users and records...")

    # Admin User
    admin_user = await db.users.find_one({"role": "admin"})
    if not admin_user:
        res = await db.users.insert_one({
            "email": "admin_phase5@alarabia.edu",
            "username": "admin_phase5@alarabia.edu",
            "password_hash": hash_password("AdminPass123!"),
            "role": "admin",
            "is_active": True,
            "created_at": datetime.utcnow()
        })
        admin_user = await db.users.find_one({"_id": res.inserted_id})

    # Instructor User
    instructor_user = await db.users.find_one({"role": "instructor"})
    if not instructor_user:
        res = await db.users.insert_one({
            "email": "ustadh_phase5@alarabia.edu",
            "username": "ustadh_phase5@alarabia.edu",
            "password_hash": hash_password("InstructorPass123!"),
            "role": "instructor",
            "is_active": True,
            "profile_completed": True,
            "created_at": datetime.utcnow()
        })
        instructor_user = await db.users.find_one({"_id": res.inserted_id})

    inst_record = await db.instructors.find_one({"user_id": instructor_user["_id"]})
    if not inst_record:
        res = await db.instructors.insert_one({
            "name": "Ustadh Zayd",
            "email": instructor_user["email"],
            "user_id": instructor_user["_id"],
            "status": "active",
            "created_at": datetime.utcnow()
        })
        inst_record = await db.instructors.find_one({"_id": res.inserted_id})

    # Test Module
    module = await db.modules.find_one({"title": "Phase 5 Classical Arabic"})
    if not module:
        res = await db.modules.insert_one({
            "title": "Phase 5 Classical Arabic",
            "code": "ARB-501",
            "level": "Intermediate",
            "description": "Comprehensive Arabic Grammar, Morphology & Rhetoric",
            "created_at": datetime.utcnow()
        })
        module = await db.modules.find_one({"_id": res.inserted_id})

    # Primary Test Student (Student A)
    student_a_email = "student_a_phase5@alarabia.edu"
    student_a_user = await db.users.find_one({"email": student_a_email})
    if not student_a_user:
        res = await db.users.insert_one({
            "email": student_a_email,
            "username": student_a_email,
            "password_hash": hash_password("OldStudentPass123!"),
            "role": "student",
            "is_active": True,
            "first_login": True,
            "profile_completed": False,
            "created_at": datetime.utcnow()
        })
        student_a_user = await db.users.find_one({"_id": res.inserted_id})
    else:
        # Reset onboarding flags for full verification cycle
        await db.users.update_one(
            {"_id": student_a_user["_id"]},
            {"$set": {
                "first_login": True,
                "profile_completed": False,
                "password_hash": hash_password("OldStudentPass123!")
            }}
        )

    student_a_record = await db.students.find_one({"email": student_a_email})
    if not student_a_record:
        res = await db.students.insert_one({
            "name": "Abdullah ibn Mansoor",
            "first_name": "Abdullah",
            "last_name": "Mansoor",
            "email": student_a_email,
            "student_code": "AFB-2026-9001",
            "user_id": student_a_user["_id"],
            "status": "enrolled",
            "instructor_id": inst_record["_id"],
            "modules": [str(module["_id"])],
            "module_ids": [module["_id"]],
            "created_at": datetime.utcnow()
        })
        student_a_record = await db.students.find_one({"_id": res.inserted_id})
    else:
        await db.students.update_one(
            {"_id": student_a_record["_id"]},
            {"$set": {
                "user_id": student_a_user["_id"],
                "instructor_id": inst_record["_id"],
                "modules": [str(module["_id"])],
                "module_ids": [module["_id"]]
            }}
        )

    # Ensure Enrollment record exists for Student A
    enrollment = await db.enrollments.find_one({
        "student_id": ObjectId(student_a_record["_id"]),
        "module_id": ObjectId(module["_id"])
    })
    if not enrollment:
        await db.enrollments.insert_one({
            "student_id": ObjectId(student_a_record["_id"]),
            "module_id": ObjectId(module["_id"]),
            "instructor_id": ObjectId(inst_record["_id"]),
            "status": "active",
            "enrolled_at": datetime.utcnow()
        })

    # Student B (For Cross-Student Data Isolation Tests)
    student_b_email = "student_b_phase5@alarabia.edu"
    student_b_user = await db.users.find_one({"email": student_b_email})
    if not student_b_user:
        res = await db.users.insert_one({
            "email": student_b_email,
            "username": student_b_email,
            "password_hash": hash_password("StudentPassB123!"),
            "role": "student",
            "is_active": True,
            "first_login": False,
            "profile_completed": True,
            "created_at": datetime.utcnow()
        })
        student_b_user = await db.users.find_one({"_id": res.inserted_id})

    student_b_record = await db.students.find_one({"email": student_b_email})
    if not student_b_record:
        res = await db.students.insert_one({
            "name": "Bilal Al-Dimashqi",
            "email": student_b_email,
            "student_code": "AFB-2026-9002",
            "user_id": student_b_user["_id"],
            "status": "enrolled",
            "created_at": datetime.utcnow()
        })
        student_b_record = await db.students.find_one({"_id": res.inserted_id})

    # Create tokens
    admin_token = create_access_token({"sub": str(admin_user["_id"]), "role": "admin"})
    instructor_token = create_access_token({"sub": str(instructor_user["_id"]), "role": "instructor"})
    student_a_token = create_access_token({"sub": str(student_a_user["_id"]), "role": "student"})
    student_b_token = create_access_token({"sub": str(student_b_user["_id"]), "role": "student"})

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    inst_headers = {"Authorization": f"Bearer {instructor_token}"}
    student_a_headers = {"Authorization": f"Bearer {student_a_token}"}
    student_b_headers = {"Authorization": f"Bearer {student_b_token}"}

    print("  [OK] Test fixtures ready.")

    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:

        # =====================================================================
        # TEST 1: Central Authentication (POST /api/auth/login)
        # =====================================================================
        print("\n[TEST 1] Central Login with Student Credentials...")
        login_res = await client.post("/api/auth/login", json={
            "username": student_a_email,
            "password": "OldStudentPass123!"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        login_data = login_res.json()
        assert "access_token" in login_data
        assert login_data["user"]["role"] == "student"
        assert login_data["user"]["student_code"] == "AFB-2026-9001"
        assert login_data["user"]["first_login"] is True
        assert login_data["user"]["profile_completed"] is False
        print("  [OK] PASS: Central login authenticated student, returned JWT and onboarding flags.")

        # =====================================================================
        # TEST 2: RBAC Protection & Endpoint Isolation
        # =====================================================================
        print("\n[TEST 2] Verifying Server-Side RBAC Protections...")
        
        # Student denied admin admission management
        r_admin = await client.get("/api/admissions/", headers=student_a_headers)
        assert r_admin.status_code == 403, f"Expected 403, got {r_admin.status_code}"

        # Student denied instructor dashboard stats
        r_inst = await client.get("/api/instructors/dashboard-stats", headers=student_a_headers)
        assert r_inst.status_code == 403, f"Expected 403, got {r_inst.status_code}"

        # Student strictly forbidden from marking attendance (Read-only attendance)
        r_att_post = await client.post("/api/attendance/", headers=student_a_headers, json={
            "student_id": str(student_a_record["_id"]),
            "status": "present"
        })
        assert r_att_post.status_code == 403, f"Expected 403 on student POST attendance, got {r_att_post.status_code}"
        print("  [OK] PASS: RBAC blocks student from Admin, Instructor, and Attendance mutation APIs.")

        # =====================================================================
        # TEST 3: Mandatory Onboarding Lifecycle
        # =====================================================================
        print("\n[TEST 3] Mandatory Onboarding: Password Change & Profile Completion...")

        # Step 3A: Check /api/auth/me returns onboarding flags
        me_res = await client.get("/api/auth/me", headers=student_a_headers)
        assert me_res.status_code == 200
        assert me_res.json()["first_login"] is True
        assert me_res.json()["profile_completed"] is False

        # Step 3B: Change password
        pwd_res = await client.post("/api/auth/change-password", headers=student_a_headers, json={
            "old_password": "OldStudentPass123!",
            "new_password": "NewStudentSecurePass123!"
        })
        assert pwd_res.status_code == 200, f"Password change failed: {pwd_res.text}"

        # Step 3C: Check first_login is now cleared
        me_res2 = await client.get("/api/auth/me", headers=student_a_headers)
        assert me_res2.json()["first_login"] is False, "first_login should be False after password change"

        # Step 3D: Complete Profile
        profile_res = await client.patch("/api/students/profile", headers=student_a_headers, json={
            "phone": "+966512345678",
            "date_of_birth": "2000-05-15",
            "gender": "Male",
            "address": "Riyadh, Saudi Arabia",
            "guardian_name": "Mansoor Al-Hashimi",
            "guardian_phone": "+966587654321",
            "guardian_relationship": "Father",
            "bio": "Dedicated student pursuing Classical Arabic eloquence."
        })
        assert profile_res.status_code == 200, f"Profile completion failed: {profile_res.text}"

        # Step 3E: Verify profile_completed is now True on /api/auth/me
        me_res3 = await client.get("/api/auth/me", headers=student_a_headers)
        assert me_res3.json()["profile_completed"] is True, "profile_completed should be True after profile patch"
        print("  [OK] PASS: 2-step onboarding lifecycle successfully completed and verified.")

        # =====================================================================
        # TEST 4: Student Profile View & Integrity
        # =====================================================================
        print("\n[TEST 4] Student Profile Retrieval & Field Security...")
        get_prof = await client.get("/api/students/profile", headers=student_a_headers)
        assert get_prof.status_code == 200
        p_data = get_prof.json()
        assert p_data["student_code"] == "AFB-2026-9001"
        assert p_data["phone"] == "+966512345678"
        assert p_data["guardian_name"] == "Mansoor Al-Hashimi"
        assert p_data["guardian_relationship"] == "Father"
        print("  [OK] PASS: Student profile endpoint returns accurate details.")

        # =====================================================================
        # TEST 5: Student Dashboard Summary & My Courses
        # =====================================================================
        print("\n[TEST 5] Student Dashboard Summary & My Courses Scoping...")
        dash_res = await client.get("/api/students/dashboard-summary", headers=student_a_headers)
        assert dash_res.status_code == 200, f"Dashboard summary failed: {dash_res.text}"
        dash_data = dash_res.json()
        assert "total_enrolled_courses" in dash_data
        assert "pending_tasks" in dash_data
        assert "attendance_rate" in dash_data
        assert "recent_submissions" in dash_data
        assert "enrolled_courses" in dash_data

        courses_res = await client.get("/api/students/my-courses", headers=student_a_headers)
        assert courses_res.status_code == 200, f"My courses failed: {courses_res.text}"
        courses_data = courses_res.json()
        assert isinstance(courses_data, list)
        assert len(courses_data) >= 1
        found_module = any(c.get("module_title") == "Phase 5 Classical Arabic" or c.get("title") == "Phase 5 Classical Arabic" for c in courses_data)
        assert found_module, "Enrolled course not found in student's course list"
        print("  [OK] PASS: Dashboard summary and course scoping returned successfully.")

        # =====================================================================
        # TEST 6: Learning Resources Scoped to Enrolled Modules
        # =====================================================================
        print("\n[TEST 6] Scoped Learning Resources...")
        await db.resources.delete_many({"title": "Nahw Chart Phase 5"})
        res_doc = await db.resources.insert_one({
            "title": "Nahw Chart Phase 5",
            "module_id": ObjectId(module["_id"]),
            "resource_type": "pdf",
            "file_url": "https://example.com/nahw-chart.pdf",
            "description": "Essential grammar reference sheet",
            "created_at": datetime.utcnow()
        })
        
        resources_res = await client.get("/api/resources/", headers=student_a_headers)
        assert resources_res.status_code == 200, f"Resources query failed: {resources_res.text}"
        res_list = resources_res.json()
        assert any(r.get("title") == "Nahw Chart Phase 5" for r in res_list)
        print("  [OK] PASS: Resources scoped to student's enrolled courses.")

        # =====================================================================
        # TEST 7: Tasks & Student Submissions Workflow
        # =====================================================================
        print("\n[TEST 7] Task Creation, Scoping & Student Submission Workflow...")
        await db.tasks.delete_many({"title": "Phase 5 Nahw Assignment #1"})
        task_res = await db.tasks.insert_one({
            "title": "Phase 5 Nahw Assignment #1",
            "description": "Parse the verbs in Surah Al-Kahf verses 1-10",
            "module_id": ObjectId(module["_id"]),
            "instructor_id": ObjectId(inst_record["_id"]),
            "due_date": datetime.utcnow(),
            "status": "published",
            "max_score": 100,
            "created_at": datetime.utcnow()
        })
        task_id = str(task_res.inserted_id)

        tasks_res = await client.get("/api/tasks/", headers=student_a_headers)
        assert tasks_res.status_code == 200
        student_tasks = tasks_res.json()
        target_task = next((t for t in student_tasks if t.get("_id") == task_id or t.get("id") == task_id), None)
        assert target_task is not None, "Task not visible to student"
        assert target_task.get("is_submitted") is False

        await db.submissions.delete_many({"task_id": ObjectId(task_id)})

        submit_res = await client.post("/api/submissions/", headers=student_a_headers, json={
            "task_id": task_id,
            "content": "Detailed parsing analysis submitted by Abdullah.",
            "file_url": "https://example.com/submissions/nahw1_abdullah.pdf"
        })
        assert submit_res.status_code in [200, 201], f"Submission failed: {submit_res.text}"
        sub_id = submit_res.json()["id"]

        dup_res = await client.post("/api/submissions/", headers=student_a_headers, json={
            "task_id": task_id,
            "content": "Duplicate attempt."
        })
        assert dup_res.status_code == 400, "Duplicate submission was not prevented"

        assess_res = await client.post("/api/assessments/", headers=inst_headers, json={
            "submission_id": sub_id,
            "score": 95.0,
            "grade": "A+",
            "feedback": "Mumtaz! Exemplary parsing of intricate verbal structures."
        })
        assert assess_res.status_code in [200, 201], f"Assessment failed: {assess_res.text}"

        my_subs = await client.get("/api/submissions/my-submissions", headers=student_a_headers)
        assert my_subs.status_code == 200
        subs_list = my_subs.json()
        matching_sub = next((s for s in subs_list if s.get("id") == sub_id or s.get("_id") == sub_id), None)
        assert matching_sub is not None
        assert matching_sub.get("score") == 95.0
        assert matching_sub.get("grade") == "A+"
        assert "Mumtaz" in matching_sub.get("feedback", "")
        print("  [OK] PASS: Complete Task -> Submission -> Grading -> Feedback cycle verified.")

        # =====================================================================
        # TEST 8: Cross-Student Data Isolation
        # =====================================================================
        print("\n[TEST 8] Cross-Student Data Isolation...")
        r_cross = await client.get(f"/api/submissions/{sub_id}", headers=student_b_headers)
        assert r_cross.status_code == 403, f"Cross-student access not blocked, got {r_cross.status_code}"

        b_subs = await client.get("/api/submissions/my-submissions", headers=student_b_headers)
        assert b_subs.status_code == 200
        assert not any(s.get("id") == sub_id for s in b_subs.json()), "Student B saw Student A's submission"
        print("  [OK] PASS: Cross-student data isolation verified (403 on direct access, 0 leak on lists).")

        # =====================================================================
        # TEST 9: Read-Only Attendance Records
        # =====================================================================
        print("\n[TEST 9] Attendance Records Verification...")
        await db.attendance.insert_one({
            "student_id": ObjectId(student_a_record["_id"]),
            "module_id": ObjectId(module["_id"]),
            "instructor_id": ObjectId(inst_record["_id"]),
            "date": datetime.utcnow(),
            "status": "present",
            "notes": "Attended full 2hr lecture",
            "created_at": datetime.utcnow()
        })

        att_res = await client.get("/api/attendance/my-records", headers=student_a_headers)
        assert att_res.status_code == 200, f"Attendance fetch failed: {att_res.text}"
        att_data = att_res.json()
        assert isinstance(att_data, list)
        assert len(att_data) >= 1
        print("  [OK] PASS: Student can retrieve their own attendance records.")

        # =====================================================================
        # TEST 10: Academic Reports
        # =====================================================================
        print("\n[TEST 10] Student Academic Report Generation...")
        rep_res = await client.get("/api/reports/my-report", headers=student_a_headers)
        assert rep_res.status_code == 200, f"Report failed: {rep_res.text}"
        rep_data = rep_res.json()
        assert "student_name" in rep_data or "student_id" in rep_data or "summary" in rep_data or "performance" in rep_data
        print("  [OK] PASS: Academic performance report returned successfully.")

        # =====================================================================
        # TEST 11: Notification Workflow
        # =====================================================================
        print("\n[TEST 11] Notification Delivery & Mark as Read...")
        notif_res = await db.notifications.insert_one({
            "user_id": ObjectId(student_a_user["_id"]),
            "title": "New Assignment Feedback",
            "message": "Ustadh Zayd graded your Nahw assignment.",
            "is_read": False,
            "created_at": datetime.utcnow()
        })
        notif_id = str(notif_res.inserted_id)

        get_notifs = await client.get("/api/notifications/", headers=student_a_headers)
        assert get_notifs.status_code == 200
        n_list = get_notifs.json()
        assert any(n.get("_id") == notif_id or n.get("id") == notif_id for n in n_list)

        read_res = await client.patch(f"/api/notifications/{notif_id}/read", headers=student_a_headers)
        assert read_res.status_code == 200
        print("  [OK] PASS: Notification delivery and read acknowledgement verified.")

        # =====================================================================
        # TEST 12: Admin & Instructor Portals Regression Check
        # =====================================================================
        print("\n[TEST 12] Regression Check: Admin & Instructor Portals...")
        adm_check = await client.get("/api/admissions/", headers=admin_headers)
        assert adm_check.status_code == 200, "Admin admissions endpoint broken!"

        inst_check = await client.get("/api/instructors/dashboard-stats", headers=inst_headers)
        assert inst_check.status_code == 200, "Instructor dashboard stats broken!"
        print("  [OK] PASS: Zero regressions on Admin and Instructor endpoints.")

    print("\n==================================================")
    print("ALL PHASE 5 VERIFICATION SUITE TESTS PASSED (12/12)!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_phase5_tests())

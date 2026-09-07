import asyncio
import os
import sys
from datetime import datetime
from unittest.mock import patch, AsyncMock
from bson import ObjectId
import httpx
from pymongo.errors import DuplicateKeyError
from dotenv import load_dotenv

# Load backend environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app
from app.database import get_db, connect_to_mongo, close_mongo_connection
from app.core.security import hash_password, create_access_token
from app.config import validate_production_config, Settings
from app.services.whatsapp_service import send_whatsapp_message
from app.services.reporting_service import get_student_progress_summary

async def run_remediation_tests():
    print("=" * 70)
    print("AL-ARABIA FI BUYUTIKUM — PHASE 6 REMEDIATION TEST SUITE")
    print("37-POINT SECURITY, INTEGRITY & RELIABILITY VERIFICATION")
    print("=" * 70)

    await connect_to_mongo()
    db = get_db()
    passed = 0
    failed = 0

    def record_result(test_num, name, success, details=""):
        nonlocal passed, failed
        status = "[PASS]" if success else "[FAIL]"
        if success:
            passed += 1
            print(f"  {status} Test {test_num:02d}: {name} {details}")
        else:
            failed += 1
            print(f"  {status} Test {test_num:02d}: {name} -> FAILED: {details}")

    # =========================================================================
    # 1. JWT SECURITY (Tests 1-4)
    # =========================================================================
    print("\n--- GROUP 1: JWT SECRET SECURITY (SEC-007) ---")

    # Test 1: Missing production JWT secret
    try:
        cfg = Settings(ENVIRONMENT="production", JWT_SECRET_KEY="")
        validate_production_config(cfg)
        record_result(1, "Missing production JWT secret", False, "Should have raised RuntimeError")
    except RuntimeError as e:
        record_result(1, "Missing production JWT secret raises RuntimeError", True, f"({e})")
    except Exception as e:
        record_result(1, "Missing production JWT secret", False, f"Unexpected exception: {e}")

    # Test 2: Weak 'secret' JWT secret
    try:
        cfg = Settings(ENVIRONMENT="production", JWT_SECRET_KEY="secret")
        validate_production_config(cfg)
        record_result(2, "Weak 'secret' JWT secret", False, "Should have raised RuntimeError")
    except RuntimeError as e:
        record_result(2, "Weak 'secret' JWT secret raises RuntimeError", True, f"({e})")
    except Exception as e:
        record_result(2, "Weak 'secret' JWT secret", False, f"Unexpected exception: {e}")

    # Test 3: Valid strong secret
    try:
        strong_key = "a" * 32
        cfg = Settings(ENVIRONMENT="production", JWT_SECRET_KEY=strong_key)
        validate_production_config(cfg)
        record_result(3, "Valid strong secret (>=32 chars)", True, "Accepted successfully")
    except Exception as e:
        record_result(3, "Valid strong secret", False, str(e))

    # Test 4: Tampered token
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        import jose.jwt
        tampered_token = jose.jwt.encode({"sub": "fake-id", "role": "admin"}, "wrong_key_12345678901234567890", algorithm="HS256")
        r = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {tampered_token}"})
        record_result(4, "Tampered token rejected with 401", r.status_code == 401, f"Status: {r.status_code}")

    # =========================================================================
    # FIXTURE SETUP FOR PORTAL TESTS
    # =========================================================================
    print("\n--- Setting up isolated test fixtures ---")

    await db.users.delete_many({"email": {"$regex": "^remed_"}})
    await db.instructors.delete_many({"email": {"$regex": "^remed_"}})
    await db.students.delete_many({"email": {"$regex": "^remed_"}})
    await db.modules.delete_many({"code": {"$regex": "^REMED-"}})

    # Admin User
    admin_user = await db.users.find_one({"role": "admin"})
    admin_token = create_access_token({"sub": str(admin_user["_id"]), "role": "admin"})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Instructor A
    inst_a_res = await db.users.insert_one({
        "username": "remed_inst_a",
        "email": "remed_inst_a@alarabia.edu",
        "password_hash": hash_password("Pass123!"),
        "role": "instructor",
        "is_active": True,
        "status": "active",
        "profile_completed": True,
        "created_at": datetime.utcnow()
    })
    inst_a_rec = await db.instructors.insert_one({
        "name": "Ustadh RemedTest A",
        "email": "remed_inst_a@alarabia.edu",
        "user_id": inst_a_res.inserted_id,
        "is_active": True,
        "created_at": datetime.utcnow()
    })
    inst_a_token = create_access_token({"sub": str(inst_a_res.inserted_id), "role": "instructor"})
    inst_a_headers = {"Authorization": f"Bearer {inst_a_token}"}

    # Instructor B
    inst_b_res = await db.users.insert_one({
        "username": "remed_inst_b",
        "email": "remed_inst_b@alarabia.edu",
        "password_hash": hash_password("Pass123!"),
        "role": "instructor",
        "is_active": True,
        "status": "active",
        "profile_completed": True,
        "created_at": datetime.utcnow()
    })
    inst_b_rec = await db.instructors.insert_one({
        "name": "Ustadh RemedTest B",
        "email": "remed_inst_b@alarabia.edu",
        "user_id": inst_b_res.inserted_id,
        "is_active": True,
        "created_at": datetime.utcnow()
    })
    inst_b_token = create_access_token({"sub": str(inst_b_res.inserted_id), "role": "instructor"})
    inst_b_headers = {"Authorization": f"Bearer {inst_b_token}"}

    # Modules
    mod_a_res = await db.modules.insert_one({
        "title": "Remed Module A",
        "code": "REMED-101",
        "description": "Module A",
        "is_active": True,
        "created_at": datetime.utcnow()
    })
    mod_b_res = await db.modules.insert_one({
        "title": "Remed Module B",
        "code": "REMED-102",
        "description": "Module B",
        "is_active": True,
        "created_at": datetime.utcnow()
    })

    # Student A (assigned to Instructor A, Module A)
    stud_a_user_res = await db.users.insert_one({
        "username": "remed_stud_a",
        "email": "remed_stud_a@alarabia.edu",
        "password_hash": hash_password("Pass123!"),
        "role": "student",
        "student_code": "AFB-REMED-0001",
        "is_active": True,
        "status": "active",
        "profile_completed": True,
        "created_at": datetime.utcnow()
    })
    stud_a_rec = await db.students.insert_one({
        "name": "Remed Student A",
        "email": "remed_stud_a@alarabia.edu",
        "user_id": stud_a_user_res.inserted_id,
        "student_code": "AFB-REMED-0001",
        "instructor_id": inst_a_rec.inserted_id,
        "modules": [str(mod_a_res.inserted_id)],
        "module_ids": [mod_a_res.inserted_id],
        "status": "enrolled",
        "created_at": datetime.utcnow()
    })
    stud_a_token = create_access_token({"sub": str(stud_a_user_res.inserted_id), "role": "student"})
    stud_a_headers = {"Authorization": f"Bearer {stud_a_token}"}

    # Enrollment A
    await db.enrollments.insert_one({
        "student_id": stud_a_rec.inserted_id,
        "instructor_id": inst_a_rec.inserted_id,
        "module_id": mod_a_res.inserted_id,
        "status": "active",
        "enrolled_at": datetime.utcnow()
    })

    # Student B (assigned to Instructor B, Module B)
    stud_b_user_res = await db.users.insert_one({
        "username": "remed_stud_b",
        "email": "remed_stud_b@alarabia.edu",
        "password_hash": hash_password("Pass123!"),
        "role": "student",
        "student_code": "AFB-REMED-0002",
        "is_active": True,
        "status": "active",
        "profile_completed": True,
        "created_at": datetime.utcnow()
    })
    stud_b_rec = await db.students.insert_one({
        "name": "Remed Student B",
        "email": "remed_stud_b@alarabia.edu",
        "user_id": stud_b_user_res.inserted_id,
        "student_code": "AFB-REMED-0002",
        "instructor_id": inst_b_rec.inserted_id,
        "modules": [str(mod_b_res.inserted_id)],
        "module_ids": [mod_b_res.inserted_id],
        "status": "enrolled",
        "created_at": datetime.utcnow()
    })
    stud_b_token = create_access_token({"sub": str(stud_b_user_res.inserted_id), "role": "student"})
    stud_b_headers = {"Authorization": f"Bearer {stud_b_token}"}

    # Enrollment B
    await db.enrollments.insert_one({
        "student_id": stud_b_rec.inserted_id,
        "instructor_id": inst_b_rec.inserted_id,
        "module_id": mod_b_res.inserted_id,
        "status": "active",
        "enrolled_at": datetime.utcnow()
    })

    # Student C (no enrollments at all)
    stud_c_user_res = await db.users.insert_one({
        "username": "remed_stud_c",
        "email": "remed_stud_c@alarabia.edu",
        "password_hash": hash_password("Pass123!"),
        "role": "student",
        "student_code": "AFB-REMED-0003",
        "is_active": True,
        "status": "active",
        "profile_completed": True,
        "created_at": datetime.utcnow()
    })
    stud_c_rec = await db.students.insert_one({
        "name": "Remed Student C",
        "email": "remed_stud_c@alarabia.edu",
        "user_id": stud_c_user_res.inserted_id,
        "student_code": "AFB-REMED-0003",
        "instructor_id": None,
        "modules": [],
        "module_ids": [],
        "status": "enrolled",
        "created_at": datetime.utcnow()
    })
    stud_c_token = create_access_token({"sub": str(stud_c_user_res.inserted_id), "role": "student"})
    stud_c_headers = {"Authorization": f"Bearer {stud_c_token}"}

    # Task A (created by Instructor A for Module A)
    task_a_res = await db.tasks.insert_one({
        "title": "Task A Title",
        "description": "Task A",
        "instructor_id": inst_a_rec.inserted_id,
        "module_id": mod_a_res.inserted_id,
        "max_score": 100,
        "is_published": True,
        "created_at": datetime.utcnow()
    })
    # Task B (created by Instructor B for Module B)
    task_b_res = await db.tasks.insert_one({
        "title": "Task B Title",
        "description": "Task B",
        "instructor_id": inst_b_rec.inserted_id,
        "module_id": mod_b_res.inserted_id,
        "max_score": 100,
        "is_published": True,
        "created_at": datetime.utcnow()
    })

    # Submission A (Student A to Task A)
    sub_a_res = await db.submissions.insert_one({
        "task_id": task_a_res.inserted_id,
        "student_id": stud_a_rec.inserted_id,
        "content": "Student A Submission content",
        "status": "submitted",
        "submitted_at": datetime.utcnow()
    })

    # Submission B (Student B to Task B)
    sub_b_res = await db.submissions.insert_one({
        "task_id": task_b_res.inserted_id,
        "student_id": stud_b_rec.inserted_id,
        "content": "Student B Submission content",
        "status": "submitted",
        "submitted_at": datetime.utcnow()
    })

    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # =====================================================================
        # 2. GRADING IDOR (SEC-001)
        # =====================================================================
        print("\n--- GROUP 2: CROSS-INSTRUCTOR GRADING IDOR (SEC-001) ---")

        # Test 5: Instructor A grades own submission -> 200/201
        res5 = await client.post("/api/assessments/", headers=inst_a_headers, json={
            "submission_id": str(sub_a_res.inserted_id),
            "score": 95,
            "feedback": "Excellent work by Student A"
        })
        record_result(5, "Instructor A grades own submission", res5.status_code in [200, 201], f"Status: {res5.status_code}")

        # Test 6: Instructor A attempts to grade Instructor B's submission -> 403
        res6 = await client.post("/api/assessments/", headers=inst_a_headers, json={
            "submission_id": str(sub_b_res.inserted_id),
            "score": 50,
            "feedback": "Unauthorized attempt"
        })
        record_result(6, "Instructor A blocked from grading Instructor B submission (403)", res6.status_code == 403, f"Status: {res6.status_code}")

        # =====================================================================
        # 3. ATTENDANCE IDOR & MULTI-CLASS COLLISION (SEC-002)
        # =====================================================================
        print("\n--- GROUP 3: ATTENDANCE IDOR & MULTI-CLASS COLLISION (SEC-002) ---")

        # Test 7: Instructor A marks own class/student -> 200
        res7 = await client.post("/api/attendance/", headers=inst_a_headers, json={
            "student_id": str(stud_a_rec.inserted_id),
            "date": "2026-05-15",
            "status": "present",
            "slot_id": "slot_morning"
        })
        record_result(7, "Instructor A marks own student attendance", res7.status_code == 200, f"Status: {res7.status_code}")

        # Test 8: Instructor A marks Instructor B's student -> 403
        res8 = await client.post("/api/attendance/", headers=inst_a_headers, json={
            "student_id": str(stud_b_rec.inserted_id),
            "date": "2026-05-15",
            "status": "present",
            "slot_id": "slot_morning"
        })
        record_result(8, "Instructor A blocked from marking Instructor B student (403)", res8.status_code == 403, f"Status: {res8.status_code}")

        # Test 9: Same student/date/slot update -> exactly one record
        res9 = await client.post("/api/attendance/", headers=inst_a_headers, json={
            "student_id": str(stud_a_rec.inserted_id),
            "date": "2026-05-15",
            "status": "late",
            "slot_id": "slot_morning"
        })
        count_morning = await db.attendance.count_documents({
            "student_id": stud_a_rec.inserted_id,
            "date": "2026-05-15",
            "slot_id": "slot_morning"
        })
        record_result(9, "Same student/date/slot upsert keeps single record", count_morning == 1, f"Count: {count_morning}")

        # Test 10: Same student/date/different slot -> separate records preserved
        res10 = await client.post("/api/attendance/", headers=inst_a_headers, json={
            "student_id": str(stud_a_rec.inserted_id),
            "date": "2026-05-15",
            "status": "present",
            "slot_id": "slot_afternoon"
        })
        count_both = await db.attendance.count_documents({
            "student_id": stud_a_rec.inserted_id,
            "date": "2026-05-15"
        })
        record_result(10, "Same student/date/different slot creates distinct records", count_both == 2, f"Total on date: {count_both}")

        # =====================================================================
        # 4. TASK ISOLATION (SEC-004)
        # =====================================================================
        print("\n--- GROUP 4: STUDENT TASK ISOLATION (SEC-004) ---")

        # Test 11: Student with no enrollment -> []
        res11 = await client.get("/api/tasks/", headers=stud_c_headers)
        data11 = res11.json() if res11.status_code == 200 else None
        record_result(11, "Student with no enrollment receives empty task list []", res11.status_code == 200 and data11 == [], f"Returned: {len(data11) if data11 is not None else 'None'}")

        # Test 12: Student sees own authorized tasks
        res12 = await client.get("/api/tasks/", headers=stud_a_headers)
        data12 = res12.json() if res12.status_code == 200 else []
        task_ids_returned = [t["_id"] for t in data12]
        is_task_a_in = str(task_a_res.inserted_id) in task_ids_returned
        is_task_b_in = str(task_b_res.inserted_id) in task_ids_returned
        record_result(12, "Student A sees only authorized Module A task", is_task_a_in and not is_task_b_in, f"Task A: {is_task_a_in}, Task B: {is_task_b_in}")

        # Test 13: Student cannot access un-enrolled task directly -> 403
        res13 = await client.get(f"/api/tasks/{task_b_res.inserted_id}", headers=stud_a_headers)
        record_result(13, "Direct access to un-enrolled task blocked (403)", res13.status_code == 403, f"Status: {res13.status_code}")

        # =====================================================================
        # 5. ADMIN SERIALIZATION (SEC-005)
        # =====================================================================
        print("\n--- GROUP 5: ADMIN ROSTER SERIALIZATION (SEC-005) ---")

        test_objid_stud = await db.students.insert_one({
            "name": "Serialization Test Student",
            "email": "remed_serial@alarabia.edu",
            "student_code": "AFB-SERIAL-01",
            "module_ids": [ObjectId(), ObjectId()],
            "modules": ["Mod1", "Mod2"],
            "status": "enrolled",
            "created_at": datetime.utcnow()
        })

        # Test 14, 15, 16: Admin endpoint returns 200 with ObjectId arrays handled cleanly
        res_roster = await client.get("/api/students/", headers=admin_headers)
        record_result(14, "Student roster endpoint returns 200", res_roster.status_code == 200, f"Status: {res_roster.status_code}")
        
        roster_data = res_roster.json() if res_roster.status_code == 200 else []
        serial_stud = next((s for s in roster_data if s.get("student_code") == "AFB-SERIAL-01"), None)
        record_result(15, "Student with single/missing module_ids serializes cleanly", serial_stud is not None, f"Found: {serial_stud is not None}")
        
        has_string_modules = serial_stud and isinstance(serial_stud.get("module_ids"), list) and all(isinstance(x, str) for x in serial_stud.get("module_ids", []))
        record_result(16, "ObjectId array in module_ids converted to string array cleanly", bool(has_string_modules), f"module_ids: {serial_stud.get('module_ids') if serial_stud else 'None'}")

        await db.students.delete_one({"_id": test_objid_stud.inserted_id})

        # =====================================================================
        # 6. FILE UPLOAD SECURITY (SEC-006)
        # =====================================================================
        print("\n--- GROUP 6: FILE UPLOAD SECURITY (SEC-006) ---")

        # Test 17: Valid PDF
        pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<\n>>\nendobj\ntrailer\n<<\n>>\n%%EOF"
        res17 = await client.post(
            "/api/storage/upload",
            headers=admin_headers,
            files={"file": ("test_doc.pdf", pdf_bytes, "application/pdf")}
        )
        record_result(17, "Valid PDF upload accepted (200)", res17.status_code == 200, f"Status: {res17.status_code}")

        # Test 18: Valid image (PNG)
        png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
        res18 = await client.post(
            "/api/storage/upload",
            headers=admin_headers,
            files={"file": ("avatar.png", png_bytes, "image/png")}
        )
        record_result(18, "Valid PNG image upload accepted (200)", res18.status_code == 200, f"Status: {res18.status_code}")

        # Test 19: Invalid executable
        exe_bytes = b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00"
        res19 = await client.post(
            "/api/storage/upload",
            headers=admin_headers,
            files={"file": ("malware.exe", exe_bytes, "application/x-msdownload")}
        )
        record_result(19, "Executable file rejected (400)", res19.status_code == 400, f"Status: {res19.status_code}")

        # Test 20: Invalid extension (.py)
        py_bytes = b"print('hello')"
        res20 = await client.post(
            "/api/storage/upload",
            headers=admin_headers,
            files={"file": ("script.py", py_bytes, "text/x-python")}
        )
        record_result(20, "Disallowed file extension rejected (400)", res20.status_code == 400, f"Status: {res20.status_code}")

        # Test 21: Oversized file (> 10MB)
        large_bytes = b"0" * (10 * 1024 * 1024 + 1024)
        res21 = await client.post(
            "/api/storage/upload",
            headers=admin_headers,
            files={"file": ("huge.pdf", large_bytes, "application/pdf")}
        )
        record_result(21, "Oversized file (>10MB) rejected (400)", res21.status_code == 400, f"Status: {res21.status_code}")

        # Test 22: Malicious filename (path traversal)
        res22 = await client.post(
            "/api/storage/upload",
            headers=admin_headers,
            files={"file": ("../../etc/passwd.pdf", pdf_bytes, "application/pdf")}
        )
        res22_ok = res22.status_code == 200 and ".." not in res22.json().get("url", "")
        record_result(22, "Path traversal filename sanitized safely", res22_ok, f"Status: {res22.status_code}")

        # Test 23: Unauthorized upload (no token) -> 401
        res23 = await client.post(
            "/api/storage/upload",
            files={"file": ("test.pdf", pdf_bytes, "application/pdf")}
        )
        record_result(23, "Unauthenticated upload rejected (401)", res23.status_code == 401, f"Status: {res23.status_code}")

        # =====================================================================
        # 7. SUBMISSION IDOR (SEC-003)
        # =====================================================================
        print("\n--- GROUP 7: INDIVIDUAL SUBMISSION IDOR (SEC-003) ---")

        # Test 24: Student A cannot view Student B submission -> 403
        res24 = await client.get(f"/api/submissions/{sub_b_res.inserted_id}", headers=stud_a_headers)
        record_result(24, "Student A blocked from reading Student B submission (403)", res24.status_code == 403, f"Status: {res24.status_code}")

        # Test 25: Instructor A cannot view Instructor B submission -> 403
        res25 = await client.get(f"/api/submissions/{sub_b_res.inserted_id}", headers=inst_a_headers)
        record_result(25, "Instructor A blocked from reading unassigned submission (403)", res25.status_code == 403, f"Status: {res25.status_code}")

        # =====================================================================
        # 8. ADMISSION RELIABILITY (DATA-001)
        # =====================================================================
        print("\n--- GROUP 8: ADMISSION RELIABILITY (DATA-001) ---")

        valid_admission_payload = {
            "first_name": "Test",
            "last_name": "Candidate",
            "email": "candidate_remed@example.com",
            "phone": "+966501234567",
            "course": "Classical Arabic"
        }
        with patch("app.routers.admissions.send_admission_alert"):
            res26 = await client.post("/api/admissions/", json=valid_admission_payload)
            record_result(26, "Admission persists successfully when DB available", res26.status_code in [200, 201], f"Status: {res26.status_code}")

        # Test 27: DB unavailable -> 503
        with patch("app.routers.admissions.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_db.admissions.insert_one.side_effect = Exception("Simulated Mongo Network Failure")
            mock_get_db.return_value = mock_db
            res27 = await client.post("/api/admissions/", json=valid_admission_payload)
            record_result(27, "DB outage returns HTTP 503 instead of false success", res27.status_code == 503, f"Status: {res27.status_code}")

        # Test 28: No MOCK-ID in response
        res28_data = res26.json() if res26.status_code in [200, 201] else {}
        returned_id = str(res28_data.get("form_id") or res28_data.get("admission_id") or res28_data.get("id") or "")
        is_not_mock = "MOCK" not in returned_id.upper() and len(returned_id) > 0
        record_result(28, "No MOCK-ID returned in admission response", is_not_mock, f"Returned ID: {returned_id}")

        await db.admissions.delete_many({"email": "candidate_remed@example.com"})

        # =====================================================================
        # 9. WHATSAPP RELIABILITY (PERF-001)
        # =====================================================================
        print("\n--- GROUP 9: WHATSAPP WEBHOOK RELIABILITY (PERF-001) ---")

        # Test 29: Normal webhook call completes asynchronously
        with patch("app.services.whatsapp_service.settings.WHATSAPP_API_TOKEN", "test_tok"), \
             patch("app.services.whatsapp_service.settings.WHATSAPP_API_URL", "http://api.whatsapp.test"), \
             patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_http_get:
            mock_http_get.return_value = httpx.Response(200, request=httpx.Request("GET", "http://test"))
            ok = await send_whatsapp_message("+966500000000", "Test notification")
            record_result(29, "Normal WhatsApp notification dispatches asynchronously", ok is True, f"Result: {ok}")

        # Test 30: Timeout handled gracefully within 3.0s
        with patch("app.services.whatsapp_service.settings.WHATSAPP_API_TOKEN", "test_tok"), \
             patch("app.services.whatsapp_service.settings.WHATSAPP_API_URL", "http://api.whatsapp.test"), \
             patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_timeout:
            mock_timeout.side_effect = httpx.TimeoutException("Connection timed out after 3.0s")
            start_t = datetime.utcnow()
            ok_timeout = await send_whatsapp_message("+966500000000", "Timeout test")
            dur = (datetime.utcnow() - start_t).total_seconds()
            record_result(30, "WhatsApp timeout handled gracefully without raising exception", ok_timeout is False and dur < 4.0, f"Duration: {dur:.2f}s")

        # Test 31: DNS / connection error handled gracefully
        with patch("app.services.whatsapp_service.settings.WHATSAPP_API_TOKEN", "test_tok"), \
             patch("app.services.whatsapp_service.settings.WHATSAPP_API_URL", "http://api.whatsapp.test"), \
             patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_conn_err:
            mock_conn_err.side_effect = httpx.ConnectError("Failed to resolve host")
            ok_conn = await send_whatsapp_message("+966500000000", "DNS error test")
            record_result(31, "DNS/Network connection error caught and logged safely", ok_conn is False, f"Result: {ok_conn}")

        # Test 32: Admission path remains responsive regardless of WhatsApp failure
        with patch("app.routers.admissions.send_admission_alert"), \
             patch("app.routers.admissions.send_whatsapp_admission_alert", new_callable=AsyncMock) as mock_wa_call:
            mock_wa_call.return_value = False
            start_adm = datetime.utcnow()
            res32 = await client.post("/api/admissions/", json=valid_admission_payload)
            dur_adm = (datetime.utcnow() - start_adm).total_seconds()
            record_result(32, "Admission path remains fast even with WhatsApp webhook offline", res32.status_code in [200, 201] and dur_adm < 1.0, f"Duration: {dur_adm:.2f}s")
            await db.admissions.delete_many({"email": "candidate_remed@example.com"})

        # =====================================================================
        # 10. AUTH STATE CONSISTENCY (SCHEMA-001)
        # =====================================================================
        print("\n--- GROUP 10: USER AUTH STATE CONSISTENCY (SCHEMA-001) ---")

        # Test 33: Inactive user with is_active=False blocked
        await db.users.insert_one({
            "username": "inactive_bool_user",
            "email": "inactive_bool@alarabia.edu",
            "password_hash": hash_password("Pass123!"),
            "role": "student",
            "is_active": False,
            "status": "active",
            "created_at": datetime.utcnow()
        })
        res33 = await client.post("/api/auth/login", json={"username": "inactive_bool@alarabia.edu", "password": "Pass123!"})
        record_result(33, "User with is_active=False blocked at login (401/403)", res33.status_code in [401, 403], f"Status: {res33.status_code}")

        # Test 34: Inactive user with status='inactive' blocked
        await db.users.insert_one({
            "username": "inactive_str_user",
            "email": "inactive_str@alarabia.edu",
            "password_hash": hash_password("Pass123!"),
            "role": "student",
            "is_active": True,
            "status": "inactive",
            "created_at": datetime.utcnow()
        })
        res34 = await client.post("/api/auth/login", json={"username": "inactive_str@alarabia.edu", "password": "Pass123!"})
        record_result(34, "User with status='inactive' blocked at login (401/403)", res34.status_code in [401, 403], f"Status: {res34.status_code}")

        await db.users.delete_many({"email": {"$in": ["inactive_bool@alarabia.edu", "inactive_str@alarabia.edu"]}})

        # =====================================================================
        # 11. REPORTING BASELINE (REP-001)
        # =====================================================================
        print("\n--- GROUP 11: REPORTING BASELINE NORMALIZATION (REP-001) ---")

        # Test 35: Student with 0 completed tasks/attendance has 0.0% overall progress
        rep = await get_student_progress_summary(db, stud_c_rec.inserted_id)
        overall_prog = rep.get("overall_progress_score", -1)
        record_result(35, "New student with 0 activity shows 0.0% overall progress", overall_prog == 0.0, f"Progress: {overall_prog}%")

        # =====================================================================
        # 12. COMPOUND DATABASE CONSTRAINTS (DATA-002)
        # =====================================================================
        print("\n--- GROUP 12: COMPOUND UNIQUE DATABASE CONSTRAINTS (DATA-002) ---")

        # Test 36: Duplicate submission prevented by unique index
        dup_sub_prevented = False
        try:
            await db.submissions.insert_one({
                "task_id": task_a_res.inserted_id,
                "student_id": stud_a_rec.inserted_id,
                "content": "Attempting illegal duplicate submission",
                "status": "submitted",
                "submitted_at": datetime.utcnow()
            })
        except DuplicateKeyError:
            dup_sub_prevented = True
        record_result(36, "Duplicate submission prevented by compound unique index", dup_sub_prevented, "DuplicateKeyError raised")

        # Test 37: Duplicate enrollment prevented by unique index
        dup_enr_prevented = False
        try:
            await db.enrollments.insert_one({
                "student_id": stud_a_rec.inserted_id,
                "module_id": mod_a_res.inserted_id,
                "status": "active",
                "enrolled_at": datetime.utcnow()
            })
        except DuplicateKeyError:
            dup_enr_prevented = True
        record_result(37, "Duplicate enrollment prevented by compound unique index", dup_enr_prevented, "DuplicateKeyError raised")

    # =========================================================================
    # CLEAN UP REMEDIATION TEST FIXTURES
    # =========================================================================
    print("\n--- Cleaning up temporary test fixtures safely ---")
    await db.users.delete_many({"email": {"$regex": "^remed_"}})
    await db.instructors.delete_many({"email": {"$regex": "^remed_"}})
    await db.students.delete_many({"email": {"$regex": "^remed_"}})
    await db.modules.delete_many({"code": {"$regex": "^REMED-"}})
    await db.tasks.delete_many({"_id": {"$in": [task_a_res.inserted_id, task_b_res.inserted_id]}})
    await db.submissions.delete_many({"_id": {"$in": [sub_a_res.inserted_id, sub_b_res.inserted_id]}})
    await db.enrollments.delete_many({"student_id": {"$in": [stud_a_rec.inserted_id, stud_b_rec.inserted_id, stud_c_rec.inserted_id]}})
    await db.attendance.delete_many({"student_id": stud_a_rec.inserted_id})
    await db.assessments.delete_many({"submission_id": sub_a_res.inserted_id})

    await close_mongo_connection()

    print("\n" + "=" * 70)
    print(f"REMEDIATION SUITE SUMMARY: {passed} PASSED, {failed} FAILED (TOTAL 37)")
    print("=" * 70)
    return passed, failed

if __name__ == "__main__":
    passed, failed = asyncio.run(run_remediation_tests())
    sys.exit(0 if failed == 0 else 1)

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import os
from datetime import datetime
from bson import ObjectId

# Include backend path
backend_dir = r"c:\Users\Dell\OneDrive\Desktop\AFB\backend"
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

from app.config import settings
from app.core.security import create_access_token, hash_password
from app.core.init_db import init_database
from httpx import AsyncClient, ASGITransport
from app.main import app

async def test_all():
    print("=== STARTING CHAT & ANNOUNCEMENTS API INTEGRITY TESTS ===")
    
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB_NAME]
    
    # Initialize DB
    await init_database(db)

    admin_user = await db.users.find_one({"role": "admin"})
    student_user = await db.users.find_one({"role": "student"})
    instructor_user = await db.users.find_one({"role": "instructor"})
    
    if not student_user:
        print("[SETUP] Creating demo student user for test suite...")
        st_res = await db.users.insert_one({
            "username": "test_student",
            "email": "test_student@test.com",
            "full_name": "Test Student User",
            "hashed_password": hash_password("Password123!"),
            "role": "student",
            "is_active": True,
            "created_at": datetime.utcnow()
        })
        student_user = await db.users.find_one({"_id": st_res.inserted_id})

    if not instructor_user:
        print("[SETUP] Creating demo instructor user for test suite...")
        inst_res = await db.users.insert_one({
            "username": "test_instructor",
            "email": "test_instructor@test.com",
            "full_name": "Test Instructor User",
            "hashed_password": hash_password("Password123!"),
            "role": "instructor",
            "is_active": True,
            "created_at": datetime.utcnow()
        })
        instructor_user = await db.users.find_one({"_id": inst_res.inserted_id})

    admin_id = str(admin_user["_id"])
    student_id = str(student_user["_id"])
    instructor_id = str(instructor_user["_id"])

    # Ensure profile records and enrollment mapping exist for candidate thread generation
    inst_doc = await db.instructors.find_one({"user_id": instructor_user["_id"]})
    if not inst_doc:
        inst_doc_res = await db.instructors.insert_one({
            "user_id": instructor_user["_id"],
            "name": instructor_user.get("full_name", "Test Instructor User"),
            "specialization": "Test Specialization",
            "created_at": datetime.utcnow()
        })
        inst_doc = await db.instructors.find_one({"_id": inst_doc_res.inserted_id})

    student_doc = await db.students.find_one({"user_id": student_user["_id"]})
    if not student_doc:
        st_doc_res = await db.students.insert_one({
            "user_id": student_user["_id"],
            "full_name": student_user.get("full_name", "Test Student User"),
            "student_code": "ST-TEST-001",
            "instructor_id": inst_doc["_id"],
            "created_at": datetime.utcnow()
        })
        student_doc = await db.students.find_one({"_id": st_doc_res.inserted_id})
    else:
        await db.students.update_one({"_id": student_doc["_id"]}, {"$set": {"instructor_id": inst_doc["_id"]}})

    # Link enrollment
    enrollment = await db.enrollments.find_one({
        "student_id": student_doc["_id"],
        "instructor_id": inst_doc["_id"]
    })
    if not enrollment:
        await db.enrollments.insert_one({
            "student_id": student_doc["_id"],
            "instructor_id": inst_doc["_id"],
            "status": "Active",
            "created_at": datetime.utcnow()
        })
    
    admin_token = create_access_token({"sub": admin_id, "role": "admin"})
    student_token = create_access_token({"sub": student_id, "role": "student"})
    instructor_token = create_access_token({"sub": instructor_id, "role": "instructor"})
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Test 1: Admin Broadcast Announcement
        print("\n--- Test 1: Admin Broadcast Announcement ---")
        bc_res = await ac.post("/api/notifications/broadcast", json={
            "title": "System Test Broadcast",
            "message": "Testing broadcast announcement system.",
            "target_role": "all"
        }, headers={"Authorization": f"Bearer {admin_token}"})
        print(f"Status: {bc_res.status_code}, Response: {bc_res.json()}")
        assert bc_res.status_code == 200
        assert "message" in bc_res.json()
        print("PASSED: Test 1 Admin Broadcast Announcement")

        # Test 2: Student Get Threads
        print("\n--- Test 2: Student Get Threads ---")
        th_res = await ac.get("/api/messages/threads", headers={"Authorization": f"Bearer {student_token}"})
        print(f"Status: {th_res.status_code}, Threads Count: {len(th_res.json())}")
        assert th_res.status_code == 200
        threads = th_res.json()
        assert len(threads) > 0
        thread_id = threads[0].get("thread_id") or threads[0].get("_id") or threads[0].get("id")
        print(f"Using Thread ID: {thread_id}")
        print("PASSED: Test 2 Student Get Threads")

        # Test 3: Student Send Message to Instructor
        print("\n--- Test 3: Student Send Message ---")
        send_res = await ac.post("/api/messages/send", json={
            "receiver_id": instructor_id,
            "content": "Hello Instructor, this is an automated test message!"
        }, headers={"Authorization": f"Bearer {student_token}"})
        print(f"Status: {send_res.status_code}, Response: {send_res.json()}")
        assert send_res.status_code == 200
        print("PASSED: Test 3 Student Send Message")

        # Test 4: Instructor Fetch History
        print("\n--- Test 4: Instructor Fetch Thread History ---")
        hist_res = await ac.get(f"/api/messages/threads/{thread_id}/history", headers={"Authorization": f"Bearer {instructor_token}"})
        print(f"Status: {hist_res.status_code}, Messages Count: {len(hist_res.json())}")
        assert hist_res.status_code == 200
        print("PASSED: Test 4 Instructor Fetch Thread History")

        # Test 5: Admin Read-Only Security Guard
        print("\n--- Test 5: Admin Read-Only Security Guard ---")
        admin_send_res = await ac.post("/api/messages/send", json={
            "receiver_id": student_id,
            "content": "Admin attempting to send message"
        }, headers={"Authorization": f"Bearer {admin_token}"})
        print(f"Status: {admin_send_res.status_code} (Expected 403 Forbidden)")
        assert admin_send_res.status_code == 403
        print("PASSED: Test 5 Admin Send Blocked Correctly")

        # Test 6: Admin Read-Only Thread List Audit
        print("\n--- Test 6: Admin Chat Audit Listing ---")
        admin_audit_res = await ac.get("/api/messages/threads", headers={"Authorization": f"Bearer {admin_token}"})
        print(f"Status: {admin_audit_res.status_code}, Total Audited Threads: {len(admin_audit_res.json())}")
        assert admin_audit_res.status_code == 200
        print("PASSED: Test 6 Admin Chat Audit Listing")

    print("\nSUCCESS: ALL 6 CHAT & ANNOUNCEMENT TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    asyncio.run(test_all())

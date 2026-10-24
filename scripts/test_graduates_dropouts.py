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

async def run_graduates_dropouts_tests():
    print("==================================================")
    print("TESTING GRADUATES & DROPOUTS ENDPOINTS & LOGIC")
    print("==================================================")

    await connect_to_mongo()
    db = get_db()

    # 1. Setup Admin Token
    admin_user = await db.users.find_one({"role": "admin"})
    if not admin_user:
        res = await db.users.insert_one({
            "email": "test_admin_grad@alarabia.edu",
            "username": "test_admin_grad@alarabia.edu",
            "password_hash": hash_password("AdminPass123!"),
            "role": "admin",
            "is_active": True,
            "created_at": datetime.utcnow()
        })
        admin_user = await db.users.find_one({"_id": res.inserted_id})

    admin_token = create_access_token({
        "sub": str(admin_user["_id"]),
        "role": "admin",
        "email": admin_user.get("email")
    })
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Pre-cleanup and Setup a Mock Student
    await db.users.delete_many({"email": "mock_grad_dropout@student.edu"})
    await db.students.delete_many({"email": "mock_grad_dropout@student.edu"})

    student_user_res = await db.users.insert_one({
        "email": "mock_grad_dropout@student.edu",
        "username": "mock_grad_dropout@student.edu",
        "password_hash": hash_password("TestStudent123!"),
        "role": "student",
        "is_active": True,
        "created_at": datetime.utcnow()
    })
    student_user_id = student_user_res.inserted_id

    student_res = await db.students.insert_one({
        "user_id": student_user_id,
        "first_name": "Tariq",
        "last_name": "Mahmood",
        "email": "mock_grad_dropout@student.edu",
        "phone": "+923001234567",
        "student_code": "AFB-TEST-GRAD",
        "course": "Modern Standard Arabic",
        "status": "Active",
        "created_at": datetime.utcnow()
    })
    student_id = str(student_res.inserted_id)

    # Add an enrollment
    await db.enrollments.insert_one({
        "student_id": ObjectId(student_id),
        "course_title": "Modern Standard Arabic",
        "status": "active",
        "created_at": datetime.utcnow()
    })

    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # Check Dashboard Stats
        stats_resp = await client.get("/api/dashboard/stats", headers=admin_headers)
        assert stats_resp.status_code == 200, f"Expected 200, got {stats_resp.status_code}"
        stats_data = stats_resp.json()
        assert "graduated_students" in stats_data, "graduated_students missing from stats"
        assert "dropout_students" in stats_data, "dropout_students missing from stats"
        print(f"[PASS] Dashboard stats contains graduated_students ({stats_data['graduated_students']}) and dropout_students ({stats_data['dropout_students']})")

        # Test Graduation Endpoint
        grad_payload = {
            "graduation_date": "2026-10-24",
            "final_grade": "A+",
            "final_score": "96%",
            "graduation_course": "Modern Standard Arabic - Advanced",
            "graduation_remarks": "Completed with High Honors"
        }
        grad_resp = await client.patch(f"/api/students/{student_id}/graduate", json=grad_payload, headers=admin_headers)
        assert grad_resp.status_code == 200, f"Graduate failed: {grad_resp.text}"
        grad_data = grad_resp.json()
        assert grad_data["status"] == "Graduated", f"Expected status Graduated, got {grad_data['status']}"
        assert grad_data["final_grade"] == "A+"
        assert grad_data["final_score"] == "96%"
        print("[PASS] Student marked as Graduated successfully")

        # Verify enrollment status updated to completed
        enr = await db.enrollments.find_one({"student_id": ObjectId(student_id)})
        assert enr["status"] == "completed", f"Expected enrollment status completed, got {enr.get('status')}"
        print("[PASS] Enrolled courses marked as completed upon graduation")

        # Verify filtering by status=graduated
        list_grad = await client.get("/api/students/?status=graduated", headers=admin_headers)
        assert list_grad.status_code == 200
        grad_ids = [str(s.get("_id") or s.get("id")) for s in list_grad.json()]
        assert student_id in grad_ids, "Graduated student not found in ?status=graduated"
        print("[PASS] GET /api/students/?status=graduated lists the graduated student")

        # Test Dropout Endpoint
        drop_payload = {
            "dropped_at": "2026-10-24",
            "dropout_reason": "Time constraints / Schedule conflict",
            "dropout_remarks": "Taking a sabbatical break"
        }
        drop_resp = await client.patch(f"/api/students/{student_id}/dropout", json=drop_payload, headers=admin_headers)
        assert drop_resp.status_code == 200, f"Dropout failed: {drop_resp.text}"
        drop_data = drop_resp.json()
        assert drop_data["status"] == "Dropout", f"Expected status Dropout, got {drop_data['status']}"
        assert drop_data["dropout_reason"] == "Time constraints / Schedule conflict"
        print("[PASS] Student marked as Dropout successfully")

        # Verify portal user is disabled
        user_doc = await db.users.find_one({"_id": student_user_id})
        assert user_doc["is_active"] is False, "User login should be disabled on dropout"
        print("[PASS] Student user portal login deactivated upon dropout")

        # Verify filtering by status=dropout
        list_drop = await client.get("/api/students/?status=dropout", headers=admin_headers)
        assert list_drop.status_code == 200
        drop_ids = [str(s.get("_id") or s.get("id")) for s in list_drop.json()]
        assert student_id in drop_ids, "Dropout student not found in ?status=dropout"
        print("[PASS] GET /api/students/?status=dropout lists the dropout student")

        # Test Reactivate Endpoint
        react_resp = await client.patch(f"/api/students/{student_id}/reactivate", headers=admin_headers)
        assert react_resp.status_code == 200, f"Reactivate failed: {react_resp.text}"
        react_data = react_resp.json()
        assert react_data["status"] == "Active", f"Expected status Active, got {react_data['status']}"
        print("[PASS] Student reactivated back to Active status")

        # Verify portal user is re-enabled
        user_doc = await db.users.find_one({"_id": student_user_id})
        assert user_doc["is_active"] is True, "User login should be active after reactivation"
        print("[PASS] Student user portal login re-enabled upon reactivation")

    # Clean up mock records
    await db.students.delete_one({"_id": ObjectId(student_id)})
    await db.users.delete_one({"_id": student_user_id})
    await db.enrollments.delete_many({"student_id": ObjectId(student_id)})
    print("[CLEANUP] Mock student records deleted")
    print("\n==================================================")
    print("ALL GRADUATES & DROPOUTS TESTS PASSED 100%!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_graduates_dropouts_tests())

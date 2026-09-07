import os
import sys
from bson import ObjectId

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from starlette.testclient import TestClient
from app.main import app
from app.config import settings
from app.core.security import create_access_token
from app.database import get_db

def run_tests():
    print("\n==============================================")
    print("RUNNING API SECURITY & AUTHORIZATION TEST SUITE")
    print("==============================================\n")
    
    with TestClient(app) as client:
        # 1. Public Endpoints
        print("--- 1. Testing Public Endpoints (No Auth Needed) ---")
        r = client.get("/api/modules/")
        assert r.status_code == 200, f"Expected 200 for public modules, got {r.status_code}"
        print("[PASS] GET /api/modules/ is public (200)")

        r = client.get("/api/instructors/")
        assert r.status_code == 200, f"Expected 200 for public instructors, got {r.status_code}"
        print("[PASS] GET /api/instructors/ is public (200)")

        r = client.get("/api/slots/")
        assert r.status_code == 200, f"Expected 200 for public slots, got {r.status_code}"
        print("[PASS] GET /api/slots/ is public (200)")

        # 2. Unauthenticated calls to protected routes (MUST return 401)
        print("\n--- 2. Testing Unauthenticated Access to Admin Routes (Must be 401) ---")
        protected_gets = [
            "/api/admissions/",
            "/api/students/",
            "/api/dashboard/stats",
            "/api/contact/",
            "/api/auth/me"
        ]
        for url in protected_gets:
            r = client.get(url)
            assert r.status_code == 401, f"Expected 401 for {url}, got {r.status_code}"
            print(f"[PASS] GET {url} rejected without token (401)")

        # 3. Login Flow
        print("\n--- 3. Testing Authentication Endpoint (POST /api/auth/login) ---")
        r = client.post("/api/auth/login", json={"username": settings.ADMIN_USERNAME, "password": "wrong_password_xyz"})
        assert r.status_code == 401, f"Expected 401 for invalid password, got {r.status_code}"
        print("[PASS] Invalid password rejected with 401")

        r = client.post("/api/auth/login", json={"username": settings.ADMIN_USERNAME, "password": settings.ADMIN_PASSWORD})
        assert r.status_code == 200, f"Expected 200 for valid login, got {r.status_code}: {r.text}"
        login_data = r.json()
        admin_token = login_data["access_token"]
        user_info = login_data["user"]
        assert user_info["role"] == "admin", f"Expected admin role, got {user_info['role']}"
        assert "password_hash" not in user_info, "CRITICAL: password_hash exposed in user response!"
        print(f"[PASS] Admin login succeeded. Role: {user_info['role']}, Token issued.")

        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # 4. Admin Access to Protected Endpoints (MUST return 200)
        print("\n--- 4. Testing Admin Authorized Access ---")
        for url in protected_gets:
            r = client.get(url, headers=admin_headers)
            assert r.status_code == 200, f"Expected 200 for {url} with admin token, got {r.status_code}: {r.text}"
            print(f"[PASS] Admin token granted access to {url} (200)")

        # 5. Role-Based Authorization Enforcement
        print("\n--- 5. Testing Role-Based Authorization & Forbidden Access ---")
        
        # Test with invalid token
        r = client.get("/api/admissions/", headers={"Authorization": "Bearer invalid_token_123"})
        assert r.status_code == 401, f"Expected 401 for invalid token, got {r.status_code}"
        print("[PASS] Malformed/invalid token rejected with 401")

        # Test Student Role accessing admin-only routes (MUST return 403 Forbidden)
        db = get_db()
        test_student_id = ObjectId()
        db.users.insert_one({
            "_id": test_student_id,
            "username": "teststudent",
            "email": "teststudent@afb.edu",
            "role": "student",
            "is_active": True,
            "student_code": "AFB-TEST-9999",
            "password_hash": "dummy_hash"
        })
        try:
            student_token = create_access_token(
                data={
                    "sub": str(test_student_id),
                    "role": "student",
                    "email": "teststudent@afb.edu",
                    "username": "teststudent"
                }
            )
            student_headers = {"Authorization": f"Bearer {student_token}"}
            
            # Student can access /api/auth/me
            r = client.get("/api/auth/me", headers=student_headers)
            assert r.status_code == 200, f"Expected 200 for student /me, got {r.status_code}"
            print("[PASS] Student token accesses /api/auth/me (200)")

            # Student is blocked from admin routes with 403 Forbidden
            for url in ["/api/admissions/", "/api/students/", "/api/dashboard/stats", "/api/contact/"]:
                r = client.get(url, headers=student_headers)
                assert r.status_code == 403, f"Expected 403 Forbidden for student on {url}, got {r.status_code}"
                print(f"[PASS] Student token blocked with 403 Forbidden from {url}")
        finally:
            db.users.delete_one({"_id": test_student_id})
            print("[PASS] Mock test student safely removed from database")

    print("\n==============================================")
    print("ALL API SECURITY & RBAC TESTS PASSED 100%!")
    print("==============================================\n")

if __name__ == '__main__':
    run_tests()

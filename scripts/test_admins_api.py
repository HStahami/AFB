import sys
import os
import asyncio

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import connect_to_mongo, close_mongo_connection, get_db
from app.core.security import create_access_token


async def run_tests():
    await connect_to_mongo()
    db = get_db()
    try:
        admin_user = await db.users.find_one({"role": "admin"})
        if not admin_user:
            print("No admin user found.")
            return

        token = create_access_token({"sub": str(admin_user["_id"]), "role": "admin"})
        headers = {"Authorization": f"Bearer {token}"}

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            # 1. Test GET /api/admins
            res = await ac.get("/api/admins", headers=headers)
            print("GET /api/admins status:", res.status_code)
            print("Admins list count:", len(res.json()))
            assert res.status_code == 200

            # 2. Test POST /api/admins validation (duplicate test)
            res_dup = await ac.post("/api/admins", json={
                "username": admin_user["username"],
                "email": "another@test.com",
                "password": "Password123!"
            }, headers=headers)
            print("POST /api/admins duplicate check status:", res_dup.status_code)
            assert res_dup.status_code == 400

            print("All Admin Router Backend Tests Passed Successfully!")
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(run_tests())

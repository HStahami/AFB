import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath('backend'))
from app.database import connect_to_mongo, close_mongo_connection, get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.routers.admins import (
    change_admin_password,
    toggle_admin_status,
    delete_admin_account,
    create_admin_account,
    CreateAdminRequest,
    ChangeAdminPasswordRequest
)
from fastapi import HTTPException

async def run_tests():
    await connect_to_mongo()
    db = get_db()
    
    print("\n==================================================")
    print("TESTING SYSTEM ADMIN VS GENERATED ADMIN PERMISSIONS")
    print("==================================================")

    # 1. Fetch system admin
    sys_admin = await db.users.find_one({"username": "admin", "role": "admin"})
    assert sys_admin is not None, "System admin not found"
    sys_admin_id = str(sys_admin["_id"])
    sys_admin_dict = {
        "_id": sys_admin["_id"],
        "id": sys_admin_id,
        "username": sys_admin["username"],
        "role": "admin",
        "is_system_admin": True
    }

    # 2. Setup mock generated admin
    await db.users.delete_many({"username": "test_gen_admin"})
    gen_pw_hash = hash_password("OldGenPass123!")
    gen_doc = {
        "username": "test_gen_admin",
        "email": "test_gen_admin@alarabia.edu",
        "password_hash": gen_pw_hash,
        "role": "admin",
        "is_system_admin": False,
        "status": "active",
        "is_active": True,
        "created_by": "admin"
    }
    res = await db.users.insert_one(gen_doc)
    gen_admin_id = str(res.inserted_id)
    gen_admin_dict = {
        "_id": res.inserted_id,
        "id": gen_admin_id,
        "username": "test_gen_admin",
        "role": "admin",
        "is_system_admin": False
    }

    # Setup second generated admin
    await db.users.delete_many({"username": "test_gen_admin2"})
    res2 = await db.users.insert_one({
        "username": "test_gen_admin2",
        "email": "test_gen_admin2@alarabia.edu",
        "password_hash": gen_pw_hash,
        "role": "admin",
        "is_system_admin": False,
        "status": "active",
        "is_active": True,
        "created_by": "admin"
    })
    gen_admin2_id = str(res2.inserted_id)

    # TEST 1: System Admin can change generated admin's password
    res = await change_admin_password(
        admin_id=gen_admin_id,
        req=ChangeAdminPasswordRequest(new_password="NewGenPassword123!"),
        current_admin=sys_admin_dict
    )
    assert "successfully" in res["message"]
    updated_gen = await db.users.find_one({"_id": gen_admin_dict["_id"]})
    assert verify_password("NewGenPassword123!", updated_gen["password_hash"])
    print("[PASS] 1. System Admin successfully changed Generated Admin's password")

    # TEST 2: System Admin can deactivate generated admin
    toggle_res = await toggle_admin_status(admin_id=gen_admin_id, current_admin=sys_admin_dict)
    assert toggle_res["status"] == "inactive"
    print("[PASS] 2. System Admin successfully deactivated Generated Admin")

    # TEST 3: System Admin cannot deactivate himself
    try:
        await toggle_admin_status(admin_id=sys_admin_id, current_admin=sys_admin_dict)
        assert False, "Should have failed"
    except HTTPException as e:
        assert e.status_code == 400
        print("[PASS] 3. System Admin self-deactivation correctly blocked (400)")

    # TEST 4: Generated Admin CAN change their OWN password
    own_res = await change_admin_password(
        admin_id=gen_admin_id,
        req=ChangeAdminPasswordRequest(new_password="SelfChangedPass123!"),
        current_admin=gen_admin_dict
    )
    assert "successfully" in own_res["message"]
    updated_self = await db.users.find_one({"_id": gen_admin_dict["_id"]})
    assert verify_password("SelfChangedPass123!", updated_self["password_hash"])
    print("[PASS] 4. Generated Admin successfully changed their OWN password")

    # TEST 5: Generated Admin CANNOT change System Admin's password
    try:
        await change_admin_password(
            admin_id=sys_admin_id,
            req=ChangeAdminPasswordRequest(new_password="MaliciousPass123!"),
            current_admin=gen_admin_dict
        )
        assert False, "Should have failed"
    except HTTPException as e:
        assert e.status_code == 403
        print(f"[PASS] 5. Generated Admin blocked from changing System Admin password: {e.detail}")

    # TEST 6: Generated Admin CANNOT change other Generated Admin's password
    try:
        await change_admin_password(
            admin_id=gen_admin2_id,
            req=ChangeAdminPasswordRequest(new_password="MaliciousPass123!"),
            current_admin=gen_admin_dict
        )
        assert False, "Should have failed"
    except HTTPException as e:
        assert e.status_code == 403
        print(f"[PASS] 6. Generated Admin blocked from changing other admin password: {e.detail}")

    # TEST 7: Generated Admin CANNOT deactivate any admin
    try:
        await toggle_admin_status(admin_id=gen_admin2_id, current_admin=gen_admin_dict)
        assert False, "Should have failed"
    except HTTPException as e:
        assert e.status_code == 403
        print(f"[PASS] 7. Generated Admin blocked from deactivating admins: {e.detail}")

    # TEST 8: Generated Admin CANNOT delete any admin
    try:
        await delete_admin_account(admin_id=gen_admin2_id, current_admin=gen_admin_dict)
        assert False, "Should have failed"
    except HTTPException as e:
        assert e.status_code == 403
        print(f"[PASS] 8. Generated Admin blocked from deleting admins: {e.detail}")

    # TEST 9: Generated Admin CANNOT create new admin
    try:
        await create_admin_account(
            req=CreateAdminRequest(username="test_sub3", email="sub3@alarabia.edu", password="Password123!"),
            current_admin=gen_admin_dict
        )
        assert False, "Should have failed"
    except HTTPException as e:
        assert e.status_code == 403
        print(f"[PASS] 9. Generated Admin blocked from creating new admins: {e.detail}")

    # CLEANUP
    await db.users.delete_many({"username": {"$in": ["test_gen_admin", "test_gen_admin2"]}})
    print("\n[CLEANUP] Test mock admins deleted.")
    print("==================================================")
    print("ALL 9 ADMIN PERMISSION TESTS PASSED 100%!")
    print("==================================================\n")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(run_tests())

import asyncio
import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.database import connect_to_mongo, close_mongo_connection, get_db
from app.core.init_db import init_database
from app.core.security import verify_password, hash_password, create_access_token, decode_access_token
from app.config import settings

async def main():
    print("\n--- 1. Testing MongoDB Connection & DB Initialization ---")
    await connect_to_mongo()
    db = get_db()
    if db is None:
        print("[FAIL] Could not get database handle.")
        return
    
    await init_database(db)
    
    print("\n--- 2. Verifying Admin User in `users` collection ---")
    admin = await db.users.find_one({"role": "admin"})
    if not admin:
        print("[FAIL] Admin user not found in db.users!")
        return
    
    print(f"[OK] Admin found:")
    print(f"     ID: {admin['_id']}")
    print(f"     Username: {admin.get('username')}")
    print(f"     Email: {admin.get('email')}")
    print(f"     Role: {admin.get('role')}")
    print(f"     Status: {admin.get('status')}")
    print(f"     Password Hash prefix: {admin.get('password_hash')[:35]}...")
    
    is_valid = verify_password(settings.ADMIN_PASSWORD, admin.get("password_hash"))
    print(f"[OK] Password verification with settings.ADMIN_PASSWORD: {is_valid}")
    assert is_valid, "Password verification failed!"
    
    print("\n--- 3. Testing JWT Token Issuance & Decoding ---")
    token = create_access_token({
        "sub": str(admin["_id"]),
        "role": admin["role"],
        "email": admin["email"]
    })
    payload = decode_access_token(token)
    print(f"[OK] Token issued successfully.")
    print(f"     Decoded subject: {payload.get('sub')}")
    print(f"     Decoded role: {payload.get('role')}")
    assert payload.get("role") == "admin"
    assert payload.get("sub") == str(admin["_id"])
    
    print("\n--- 4. Checking Non-destructive Student & Instructor Fields ---")
    student_count = await db.students.count_documents({})
    inst_count = await db.instructors.count_documents({})
    print(f"[OK] Total students in DB: {student_count}")
    print(f"[OK] Total instructors in DB: {inst_count}")
    
    sample_student = await db.students.find_one()
    if sample_student:
        print(f"     Sample student ID code: {sample_student.get('student_code')}")
        print(f"     Sample student legacy slot: {sample_student.get('slot')}")
        print(f"     Sample student legacy instructor: {sample_student.get('instructor')}")
        assert "student_code" in sample_student, "Student code missing!"
        
    sample_inst = await db.instructors.find_one()
    if sample_inst:
        print(f"     Sample instructor active status: {sample_inst.get('is_active')}")
        assert "is_active" in sample_inst, "is_active missing!"
        
    await close_mongo_connection()
    print("\n[ALL CORE SECURITY CHECKS PASSED SUCCESSFULLY!]\n")

if __name__ == '__main__':
    asyncio.run(main())


import asyncio, sys
from datetime import datetime, timezone
sys.path.insert(0, 'backend')
from app.database import get_db, connect_to_mongo
from app.core.security import hash_password, verify_password

async def main():
    await connect_to_mongo()
    db = get_db()
    
    # 1. Admin
    admin_hash = hash_password('admin123')
    await db.users.update_one(
        {'role': 'admin'},
        {'$set': {
            'username': 'admin',
            'email': 'admin@alarabia.edu',
            'password_hash': admin_hash,
            'role': 'admin',
            'is_active': True,
            'status': 'active',
            'first_login': False,
            'profile_completed': True,
            'updated_at': datetime.now(timezone.utc)
        }}
    )
    
    # 2. Student
    student_hash = hash_password('Student123!')
    await db.users.update_one(
        {'email': 'student@alarabia.edu'},
        {'$set': {
            'username': 'student',
            'email': 'student@alarabia.edu',
            'password_hash': student_hash,
            'role': 'student',
            'student_code': 'AFB-2026-1001',
            'is_active': True,
            'status': 'active',
            'first_login': False,
            'profile_completed': True,
            'updated_at': datetime.now(timezone.utc)
        }}
    )
    
    # 3. Instructor
    inst_hash = hash_password('Instructor123!')
    await db.users.update_one(
        {'email': 'instructor@alarabia.edu'},
        {'$set': {
            'username': 'instructor',
            'email': 'instructor@alarabia.edu',
            'password_hash': inst_hash,
            'role': 'instructor',
            'is_active': True,
            'status': 'active',
            'first_login': False,
            'profile_completed': True,
            'updated_at': datetime.now(timezone.utc)
        }}
    )
    print('SUCCESS')

asyncio.run(main())

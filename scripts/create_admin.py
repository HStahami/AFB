import sys
import os
import argparse
import asyncio
from datetime import datetime

# Add backend directory to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.database import connect_to_mongo, close_mongo_connection, get_db
from app.core.security import hash_password


async def create_admin(username: str, email: str, password: str):
    username = username.strip().lower()
    email = email.strip().lower()

    if not username:
        print("[ERROR] Username cannot be empty.")
        return False
    if not email or "@" not in email:
        print("[ERROR] A valid email is required.")
        return False
    if not password or len(password) < 6:
        print("[ERROR] Password must be at least 6 characters long.")
        return False

    await connect_to_mongo()
    db = get_db()

    try:
        # Check if username or email already exists
        existing_user = await db.users.find_one({
            "$or": [
                {"username": username},
                {"email": email}
            ]
        })

        if existing_user:
            print(f"[ERROR] A user with username '{username}' or email '{email}' already exists.")
            return False

        hashed_pw = hash_password(password)

        admin_doc = {
            "username": username,
            "email": email,
            "password_hash": hashed_pw,
            "role": "admin",
            "status": "active",
            "is_active": True,
            "first_login": False,
            "profile_completed": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        res = await db.users.insert_one(admin_doc)
        print("\n===========================================")
        print(" SUCCESS: Admin Account Created Successfully!")
        print("===========================================")
        print(f" Admin ID   : {res.inserted_id}")
        print(f" Username   : {username}")
        print(f" Email      : {email}")
        print(f" Role       : admin")
        print(f" Status     : active")
        print("===========================================\n")
        return True
    finally:
        await close_mongo_connection()


def main():
    parser = argparse.ArgumentParser(description="Create a new Admin account for AlArabia Fi Buyutikum LMS")
    parser.add_argument("--username", "-u", help="Admin username")
    parser.add_argument("--email", "-e", help="Admin email address")
    parser.add_argument("--password", "-p", help="Admin password")

    args = parser.parse_args()

    username = args.username
    email = args.email
    password = args.password

    if not username:
        username = input("Enter Admin Username: ").strip()
    if not email:
        email = input("Enter Admin Email: ").strip()
    if not password:
        import getpass
        password = getpass.getpass("Enter Admin Password: ").strip()

    asyncio.run(create_admin(username, email, password))


if __name__ == "__main__":
    main()

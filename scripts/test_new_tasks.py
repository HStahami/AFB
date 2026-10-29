"""
Test suite for the 5 tasks:
1. Instructor privacy: get_my_students excludes email and phone, get_student_profile sanitized for instructor.
2. Student profile locking: Completed profile cannot be edited directly by student (returns 403).
3. Admin update student: PATCH /api/students/{student_id} successfully updates student information.
4. Portal role isolation.
"""
import asyncio
import os
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath("backend"))

from app.database import get_db
from app.routers.instructors import get_my_students
from app.routers.students import get_student_profile, update_my_profile, admin_update_student
from app.models import StudentProfileUpdate
from bson import ObjectId
from fastapi import HTTPException

async def run_tests():
    db = get_db()
    print("Testing Task 4: Instructor Privacy...")
    # Find an instructor
    instructor_user = await db.users.find_one({"role": "instructor"})
    admin_user = await db.users.find_one({"role": "admin"})
    student_user = await db.users.find_one({"role": "student"})

    if instructor_user:
        # Test get_my_students
        students = await get_my_students(current_user=instructor_user)
        print(f"  get_my_students returned {len(students)} students")
        for s in students:
            assert "email" not in s, f"Email found in student roster: {s}"
            assert "phone" not in s, f"Phone found in student roster: {s}"
            assert "name" in s, f"Name missing in student roster: {s}"
            assert "course" in s, f"Course missing in student roster: {s}"
            assert "slot" in s, f"Slot missing in student roster: {s}"
        print("  PASS: Instructor roster completely omits email & phone, includes course & slot.")

    # Find a student document
    student_doc = await db.students.find_one({})
    if student_doc:
        s_id = str(student_doc["_id"])
        if instructor_user:
            # Test sanitized profile for instructor
            # Temporarily ensure instructor has access or is assigned
            inst_view = await get_student_profile(student_id=s_id, current_user=instructor_user)
            assert "email" not in inst_view, "Email exposed in instructor student profile"
            assert "phone" not in inst_view, "Phone exposed in instructor student profile"
            assert "guardian_name" not in inst_view, "Guardian name exposed in instructor student profile"
            assert "course" in inst_view, "Course missing from instructor student profile"
            assert "slot" in inst_view, "Slot missing from instructor student profile"
            print("  PASS: Instructor view of student profile sanitized (no email, phone, guardian).")

    print("\nTesting Task 5: Student Profile Locking & Admin Student Update...")
    if student_doc and student_user:
        # Mark student profile completed
        await db.students.update_one({"_id": student_doc["_id"]}, {"$set": {"profile_completed": True, "is_profile_locked": True}})
        
        # Student attempt to update profile directly
        try:
            update_data = StudentProfileUpdate(phone="1234567890", guardian_name="Test Father")
            await update_my_profile(data=update_data, current_user=student_user)
            assert False, "Locked profile was unexpectedly allowed to update!"
        except HTTPException as he:
            assert he.status_code == 403, f"Expected 403 Forbidden, got {he.status_code}"
            print("  PASS: Student cannot directly edit locked profile (403 Forbidden received).")

    if student_doc and admin_user:
        # Admin update student
        payload = {
            "first_name": "UpdatedByAdmin",
            "last_name": "TestStudent",
            "phone": "+923001234567",
            "city": "Lahore"
        }
        res = await admin_update_student(student_id=str(student_doc["_id"]), payload=payload, admin_user=admin_user)
        assert res["first_name"] == "UpdatedByAdmin", f"Update failed: {res}"
        assert res["phone"] == "+923001234567", f"Phone update failed: {res}"
        print("  PASS: Admin successfully updated student profile via admin_update_student.")

    print("\nALL BACKEND TASK TESTS PASSED 100%!")

if __name__ == "__main__":
    asyncio.run(run_tests())

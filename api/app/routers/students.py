from bson import ObjectId
from datetime import datetime
from fastapi import APIRouter, HTTPException
from app.database import get_db
from app.models import AdmissionCreate
from app.services.email_service import send_email

router = APIRouter(prefix="/api/students", tags=["Students"])


@router.get("/", summary="Get all students (Admin)")
async def get_all_students():
    db = get_db()
    if db is None:
        return []
    try:
        students = []
        async for doc in db.students.find().sort("approved_at", -1):
            doc["_id"] = str(doc["_id"])
            students.append(doc)
        return students
    except Exception as e:
        print(f"ERROR fetching students: {e}")
        return []


@router.patch("/{student_id}/assign", summary="Assign slot and instructor to a student")
async def assign_slot_instructor(student_id: str, slot: str, instructor: str):
    db = get_db()
    try:
        doc = await db.students.find_one({"_id": ObjectId(student_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Student not found")

        await db.students.update_one(
            {"_id": ObjectId(student_id)},
            {"$set": {"slot": slot, "instructor": instructor}}
        )

        # Send assignment email
        subject = "Your Class Details - AlArabia Fi Buyutikum"
        body = f"""Dear {doc['first_name']} {doc['last_name']},

Great news! Your class details have been finalized.

Your Slot: {slot}
Your Instructor: {instructor}

Please make sure you are available at the scheduled time. Your instructor will contact you shortly with further details.

JazakAllah Khair,
AlArabia Fi Buyutikum Team
"""
        send_email(doc['email'], subject, body)
        return {"message": "Slot and instructor assigned, email sent to student."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR assigning slot/instructor: {e}")
        raise HTTPException(status_code=500, detail="Could not assign slot/instructor.")

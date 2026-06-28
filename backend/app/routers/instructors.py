from bson import ObjectId
from datetime import datetime
from fastapi import APIRouter, HTTPException
from app.database import get_db

router = APIRouter(prefix="/api/instructors", tags=["Instructors"])


@router.get("/", summary="Get all instructors with slot and student info")
async def get_all_instructors():
    db = get_db()
    if db is None:
        return []
    try:
        instructors = []
        async for doc in db.instructors.find():
            doc["_id"] = str(doc["_id"])
            # Fetch students assigned to this instructor
            students = []
            async for s in db.students.find({"instructor": doc["name"]}):
                students.append({
                    "student_id": str(s["_id"]),
                    "name": f"{s['first_name']} {s['last_name']}",
                    "slot": s.get("slot")
                })
            doc["students"] = students
            doc["total_students"] = len(students)
            instructors.append(doc)
        return instructors
    except Exception as e:
        print(f"ERROR fetching instructors: {e}")
        return []


@router.post("/", summary="Add a new instructor")
async def add_instructor(name: str, specialty: str):
    db = get_db()
    try:
        doc = {
            "name": name,
            "specialty": specialty,
            "created_at": datetime.utcnow()
        }
        result = await db.instructors.insert_one(doc)
        return {"message": "Instructor added.", "id": str(result.inserted_id)}
    except Exception as e:
        print(f"ERROR adding instructor: {e}")
        raise HTTPException(status_code=500, detail="Could not add instructor.")


@router.delete("/{instructor_id}", summary="Delete an instructor")
async def delete_instructor(instructor_id: str):
    db = get_db()
    try:
        result = await db.instructors.delete_one({"_id": ObjectId(instructor_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Instructor not found")
        return {"message": "Instructor deleted."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR deleting instructor: {e}")
        raise HTTPException(status_code=500, detail="Could not delete instructor.")

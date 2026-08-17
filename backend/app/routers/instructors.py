import os
import uuid
from urllib.parse import quote_plus
from bson import ObjectId
from datetime import datetime
from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from typing import Optional
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
            doc["id"] = doc["_id"]
            if "about" not in doc:
                doc["about"] = doc.get("specialty", "")
            if "specialty" not in doc:
                doc["specialty"] = doc.get("about", "")
            if "avatar" not in doc:
                name_quoted = quote_plus(doc.get("name", "Instructor"))
                doc["avatar"] = f"https://ui-avatars.com/api/?name={name_quoted}&background=C5E5E8&color=072224&size=150&font-size=0.33&bold=true"

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
async def add_instructor(
    name: str = Form(...),
    about: Optional[str] = Form(""),
    specialty: Optional[str] = Form(""),
    avatar: Optional[UploadFile] = File(None)
):
    db = get_db()
    avatar_url = None

    if avatar and avatar.filename:
        ext = os.path.splitext(avatar.filename)[1] or ".png"
        filename = f"instructor_{uuid.uuid4().hex}{ext}"
        filepath = os.path.join("uploads", filename)
        os.makedirs("uploads", exist_ok=True)
        content = await avatar.read()
        with open(filepath, "wb") as f:
            f.write(content)
        avatar_url = f"/uploads/{filename}"
    else:
        name_quoted = quote_plus(name)
        avatar_url = f"https://ui-avatars.com/api/?name={name_quoted}&background=C5E5E8&color=072224&size=150&font-size=0.33&bold=true"

    try:
        doc = {
            "name": name,
            "about": about or specialty or "",
            "specialty": specialty or about or "",
            "avatar": avatar_url,
            "created_at": datetime.utcnow()
        }
        result = await db.instructors.insert_one(doc)
        return {"message": "Instructor added.", "id": str(result.inserted_id), "avatar": avatar_url}
    except Exception as e:
        print(f"ERROR adding instructor: {e}")
        raise HTTPException(status_code=500, detail="Could not add instructor.")


@router.put("/{instructor_id}", summary="Update an instructor")
async def update_instructor(
    instructor_id: str,
    name: str = Form(...),
    about: Optional[str] = Form(""),
    specialty: Optional[str] = Form(""),
    avatar: Optional[UploadFile] = File(None)
):
    db = get_db()
    try:
        existing = await db.instructors.find_one({"_id": ObjectId(instructor_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Instructor not found")

        update_data = {
            "name": name,
            "about": about or specialty or "",
            "specialty": specialty or about or ""
        }

        if avatar and avatar.filename:
            ext = os.path.splitext(avatar.filename)[1] or ".png"
            filename = f"instructor_{uuid.uuid4().hex}{ext}"
            filepath = os.path.join("uploads", filename)
            os.makedirs("uploads", exist_ok=True)
            content = await avatar.read()
            with open(filepath, "wb") as f:
                f.write(content)
            update_data["avatar"] = f"/uploads/{filename}"

        await db.instructors.update_one({"_id": ObjectId(instructor_id)}, {"$set": update_data})
        return {"message": "Instructor updated successfully."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR updating instructor: {e}")
        raise HTTPException(status_code=500, detail="Could not update instructor.")


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


from bson import ObjectId
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Form
from app.database import get_db

router = APIRouter(prefix="/api/slots", tags=["Slots"])


@router.get("/", summary="Get all class slots")
async def get_all_slots(status: Optional[str] = None):
    db = get_db()
    if db is None:
        return []
    try:
        slots = []
        query = {}
        if status:
            query["status"] = status

        async for doc in db.slots.find(query).sort("created_at", 1):
            doc["_id"] = str(doc["_id"])
            doc["id"] = doc["_id"]
            if "status" not in doc:
                doc["status"] = "Active"
            slots.append(doc)
        return slots
    except Exception as e:
        print(f"ERROR fetching slots: {e}")
        return []


@router.post("/", summary="Create a new class slot")
async def create_slot(
    days: str = Form(...),
    time: str = Form(...),
    status: Optional[str] = Form("Active")
):
    db = get_db()
    try:
        doc = {
            "days": days.strip(),
            "time": time.strip(),
            "status": status if status in ["Active", "Inactive"] else "Active",
            "created_at": datetime.utcnow()
        }
        result = await db.slots.insert_one(doc)
        return {"message": "Slot created successfully.", "id": str(result.inserted_id)}
    except Exception as e:
        print(f"ERROR creating slot: {e}")
        raise HTTPException(status_code=500, detail="Could not create slot.")


@router.put("/{slot_id}", summary="Update a class slot")
async def update_slot(
    slot_id: str,
    days: str = Form(...),
    time: str = Form(...),
    status: Optional[str] = Form("Active")
):
    db = get_db()
    try:
        existing = await db.slots.find_one({"_id": ObjectId(slot_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Slot not found")

        update_data = {
            "days": days.strip(),
            "time": time.strip(),
            "status": status if status in ["Active", "Inactive"] else "Active",
            "updated_at": datetime.utcnow()
        }

        await db.slots.update_one({"_id": ObjectId(slot_id)}, {"$set": update_data})
        return {"message": "Slot updated successfully."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR updating slot: {e}")
        raise HTTPException(status_code=500, detail="Could not update slot.")


@router.delete("/{slot_id}", summary="Delete a class slot")
async def delete_slot(slot_id: str):
    db = get_db()
    try:
        result = await db.slots.delete_one({"_id": ObjectId(slot_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Slot not found")
        return {"message": "Slot deleted successfully."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR deleting slot: {e}")
        raise HTTPException(status_code=500, detail="Could not delete slot.")

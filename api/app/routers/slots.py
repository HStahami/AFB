from bson import ObjectId
from datetime import timezone, datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Form, Depends
from app.database import get_db
from app.core.dependencies import require_admin, require_roles

router = APIRouter(prefix="/api/slots", tags=["Slots"])


@router.get("/", summary="Get all class slots (Public)")
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
            doc["is_live"] = doc.get("is_live", False)
            doc["live_started_at"] = doc.get("live_started_at")
            slots.append(doc)
        return slots
    except Exception as e:
        print(f"ERROR fetching slots: {e}")
        return []


@router.post("/", summary="Create a new class slot (Admin Only)")
async def create_slot(
    days: str = Form(...),
    time: str = Form(...),
    status: Optional[str] = Form("Active"),
    admin_user: dict = Depends(require_admin)
):
    db = get_db()
    try:
        doc = {
            "days": days.strip(),
            "time": time.strip(),
            "status": status if status in ["Active", "Inactive"] else "Active",
            "created_at": datetime.now(timezone.utc)
        }
        result = await db.slots.insert_one(doc)
        return {"message": "Slot created successfully.", "id": str(result.inserted_id)}
    except Exception as e:
        print(f"ERROR creating slot: {e}")
        raise HTTPException(status_code=500, detail="Could not create slot.")


@router.put("/{slot_id}", summary="Update a class slot (Admin Only)")
async def update_slot(
    slot_id: str,
    days: str = Form(...),
    time: str = Form(...),
    status: Optional[str] = Form("Active"),
    admin_user: dict = Depends(require_admin)
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
            "updated_at": datetime.now(timezone.utc)
        }

        await db.slots.update_one({"_id": ObjectId(slot_id)}, {"$set": update_data})
        return {"message": "Slot updated successfully."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR updating slot: {e}")
        raise HTTPException(status_code=500, detail="Could not update slot.")


@router.delete("/{slot_id}", summary="Delete a class slot (Admin Only)")
async def delete_slot(
    slot_id: str,
    admin_user: dict = Depends(require_admin)
):
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


@router.get("/{slot_id}/live-status", summary="Get real-time live status of a slot")
async def get_slot_live_status(slot_id: str):
    db = get_db()
    if db is None:
        return {"slot_id": slot_id, "is_live": False, "live_started_at": None}
    try:
        slot = None
        if ObjectId.is_valid(slot_id):
            slot = await db.slots.find_one({"_id": ObjectId(slot_id)})
        if not slot:
            if slot_id == "general":
                slot = await db.slots.find_one({"is_general": True})
            else:
                slot = await db.slots.find_one({"days": slot_id})

        if not slot and slot_id == "general":
            res = await db.slots.insert_one({
                "days": "General Classroom",
                "time": "Open Live Session",
                "status": "Active",
                "is_general": True,
                "is_live": False,
                "created_at": datetime.now(timezone.utc)
            })
            slot = await db.slots.find_one({"_id": res.inserted_id})

        if not slot:
            return {"slot_id": slot_id, "is_live": False, "live_started_at": None, "live_started_by": None}

        return {
            "slot_id": str(slot["_id"]),
            "is_live": bool(slot.get("is_live", False)),
            "live_started_at": slot["live_started_at"].isoformat() if slot.get("live_started_at") else None,
            "live_started_by": slot.get("live_started_by"),
            "student_whiteboard_allowed": bool(slot.get("student_whiteboard_allowed", False))
        }
    except Exception as e:
        print(f"ERROR getting slot live status: {e}")
        return {"slot_id": slot_id, "is_live": False, "live_started_at": None, "student_whiteboard_allowed": False}


@router.post("/{slot_id}/whiteboard-access", summary="Instructor toggles student whiteboard access")
async def toggle_whiteboard_access(
    slot_id: str,
    payload: dict,
    current_user: dict = Depends(require_roles(["instructor", "admin", "superadmin"]))
):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    try:
        slot = None
        if ObjectId.is_valid(slot_id):
            slot = await db.slots.find_one({"_id": ObjectId(slot_id)})
        if not slot:
            if slot_id == "general":
                slot = await db.slots.find_one({"is_general": True})
            else:
                slot = await db.slots.find_one({"days": slot_id})

        if not slot:
            raise HTTPException(status_code=404, detail="Slot not found")

        allowed = bool(payload.get("allowed", False))
        await db.slots.update_one(
            {"_id": slot["_id"]},
            {"$set": {"student_whiteboard_allowed": allowed}}
        )
        return {
            "slot_id": str(slot["_id"]),
            "student_whiteboard_allowed": allowed,
            "message": f"Student whiteboard access {'enabled' if allowed else 'disabled'}."
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR updating whiteboard access: {e}")
        raise HTTPException(status_code=500, detail="Could not update whiteboard access.")



@router.post("/{slot_id}/start-class", summary="Instructor starts live class (Go Live)")
async def start_class(
    slot_id: str,
    current_user: dict = Depends(require_roles(["instructor", "admin", "superadmin"]))
):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    try:
        slot = None
        if ObjectId.is_valid(slot_id):
            slot = await db.slots.find_one({"_id": ObjectId(slot_id)})
        if not slot:
            if slot_id == "general":
                slot = await db.slots.find_one({"is_general": True})
                if not slot:
                    res = await db.slots.insert_one({
                        "days": "General Classroom",
                        "time": "Open Live Session",
                        "status": "Active",
                        "is_general": True,
                        "is_live": False,
                        "created_at": datetime.now(timezone.utc)
                    })
                    slot = await db.slots.find_one({"_id": res.inserted_id})
            else:
                slot = await db.slots.find_one({"days": slot_id})

        if not slot:
            raise HTTPException(status_code=404, detail="Slot not found")

        now = datetime.now(timezone.utc)
        await db.slots.update_one(
            {"_id": slot["_id"]},
            {"$set": {
                "is_live": True,
                "live_started_at": now,
                "live_started_by": str(current_user["_id"])
            }}
        )

        # Notify enrolled students
        try:
            slot_name = slot.get("days", "your class")
            slot_time = slot.get("time", "")
            student_query = {
                "$or": [
                    {"slot_id": slot["_id"]},
                    {"slot": f"{slot.get('days')} — {slot.get('time')}"},
                    {"slot": f"{slot.get('days')} {slot.get('time')}"},
                    {"slot": slot.get("days")}
                ]
            }
            async for s in db.students.find(student_query):
                if s.get("user_id"):
                    await db.notifications.insert_one({
                        "recipient_user_id": s["user_id"],
                        "title": "🟢 Live Class Started!",
                        "message": f"Your instructor has started the live class for {slot_name} {slot_time}. Click to join now!",
                        "type": "classroom",
                        "link": "/student/classroom",
                        "is_read": False,
                        "created_at": now
                    })
        except Exception as notify_err:
            print(f"Error notifying students: {notify_err}")

        return {
            "message": "Class started successfully.",
            "slot_id": str(slot["_id"]),
            "is_live": True,
            "live_started_at": now.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR starting class: {e}")
        raise HTTPException(status_code=500, detail="Could not start class session.")


@router.post("/{slot_id}/end-class", summary="Instructor ends live session")
async def end_class(
    slot_id: str,
    current_user: dict = Depends(require_roles(["instructor", "admin", "superadmin"]))
):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    try:
        slot = None
        if ObjectId.is_valid(slot_id):
            slot = await db.slots.find_one({"_id": ObjectId(slot_id)})
        if not slot:
            if slot_id == "general":
                slot = await db.slots.find_one({"is_general": True})
            else:
                slot = await db.slots.find_one({"days": slot_id})

        if not slot:
            raise HTTPException(status_code=404, detail="Slot not found")

        now = datetime.now(timezone.utc)
        await db.slots.update_one(
            {"_id": slot["_id"]},
            {"$set": {
                "is_live": False,
                "live_ended_at": now
            }}
        )
        return {
            "message": "Class ended successfully.",
            "slot_id": str(slot["_id"]),
            "is_live": False
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR ending class: {e}")
        raise HTTPException(status_code=500, detail="Could not end class session.")


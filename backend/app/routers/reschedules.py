from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, Query, status
from app.database import get_db
from app.core.dependencies import get_current_user, require_roles
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/reschedules", tags=["Reschedules"])


def _clean_doc(doc):
    if isinstance(doc, dict):
        cleaned = {}
        for k, v in doc.items():
            if k == "_id" or isinstance(v, ObjectId):
                cleaned[k] = str(v)
            elif isinstance(v, list):
                cleaned[k] = [_clean_doc(item) for item in v]
            elif isinstance(v, dict):
                cleaned[k] = _clean_doc(v)
            else:
                cleaned[k] = v
        if "_id" in cleaned and "id" not in cleaned:
            cleaned["id"] = cleaned["_id"]
        return cleaned
    elif isinstance(doc, list):
        return [_clean_doc(item) for item in doc]
    elif isinstance(doc, ObjectId):
        return str(doc)
    return doc


class RescheduleCreate(BaseModel):
    slot_id: str
    original_date: str
    rescheduled_date: str
    reason: str


@router.post("/", summary="Instructor submits a class reschedule request")
async def create_reschedule_request(
    data: RescheduleCreate,
    current_user: dict = Depends(require_roles(["instructor", "admin", "superadmin"]))
):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")

    try:
        slot = None
        if ObjectId.is_valid(data.slot_id):
            slot = await db.slots.find_one({"_id": ObjectId(data.slot_id)})
        if not slot:
            slot = await db.slots.find_one({"days": data.slot_id})
        if not slot:
            raise HTTPException(status_code=404, detail="Slot not found")

        inst_id = str(current_user["_id"])
        inst_name = current_user.get("full_name") or current_user.get("name") or current_user.get("username")
        inst_email = current_user.get("email", "")

        now = datetime.now(timezone.utc)
        slot_name = f"{slot.get('days', '')} {slot.get('time', '')}".strip()

        doc = {
            "instructor_id": inst_id,
            "instructor_name": inst_name,
            "instructor_email": inst_email,
            "slot_id": str(slot["_id"]),
            "slot_name": slot_name,
            "slot_days": slot.get("days", ""),
            "slot_time": slot.get("time", ""),
            "original_date": data.original_date,
            "rescheduled_date": data.rescheduled_date,
            "reason": data.reason.strip(),
            "status": "Pending",
            "reviewed_by": None,
            "reviewed_at": None,
            "created_at": now,
            "updated_at": now
        }

        res = await db.reschedules.insert_one(doc)
        reschedule_id = str(res.inserted_id)

        # Notify all admins about this pending request
        try:
            admin_users = db.users.find({"role": {"$in": ["admin", "superadmin"]}})
            async for adm in admin_users:
                await db.notifications.insert_one({
                    "recipient_user_id": str(adm["_id"]),
                    "title": "Class Reschedule Request",
                    "message": f"Instructor {inst_name} requested to reschedule {slot_name} from {data.original_date} to {data.rescheduled_date}.",
                    "type": "reschedule",
                    "link": f"/admin/dashboard?tab=classes&action=reschedule&id={reschedule_id}",
                    "reschedule_id": reschedule_id,
                    "is_read": False,
                    "created_at": now
                })
        except Exception as notify_err:
            print(f"[RESCHEDULE NOTIFY ERROR] {notify_err}")

        doc["id"] = reschedule_id
        doc["_id"] = reschedule_id
        return _clean_doc(doc)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating reschedule: {e}")
        raise HTTPException(status_code=500, detail="Could not create reschedule request.")


@router.get("/", summary="List all reschedule requests (Admin / Instructor)")
async def list_reschedule_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    instructor_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")

    query = {}
    # Instructors can only view their own requests unless admin
    if current_user.get("role") not in ["admin", "superadmin"]:
        query["instructor_id"] = str(current_user["_id"])
    elif instructor_id:
        query["instructor_id"] = instructor_id

    if status_filter and status_filter.lower() != "all":
        query["status"] = {"$regex": f"^{status_filter}$", "$options": "i"}

    cursor = db.reschedules.find(query).sort("created_at", -1)
    results = await cursor.to_list(200)
    return [_clean_doc(r) for r in results]


@router.get("/{id}", summary="Get a single reschedule request by ID")
async def get_reschedule_request(
    id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")

    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID")

    doc = await db.reschedules.find_one({"_id": ObjectId(id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Reschedule request not found")

    return _clean_doc(doc)


@router.patch("/{id}/approve", summary="Admin approves class reschedule request")
async def approve_reschedule_request(
    id: str,
    current_user: dict = Depends(require_roles(["admin", "superadmin"]))
):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")

    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID")

    doc = await db.reschedules.find_one({"_id": ObjectId(id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Reschedule request not found")

    now = datetime.now(timezone.utc)
    admin_name = current_user.get("full_name") or current_user.get("username")

    await db.reschedules.update_one(
        {"_id": ObjectId(id)},
        {"$set": {
            "status": "Approved",
            "reviewed_by": admin_name,
            "reviewed_at": now,
            "updated_at": now
        }}
    )

    # 1. Notify Instructor
    try:
        inst_user_id = doc.get("instructor_id")
        if inst_user_id:
            await db.notifications.insert_one({
                "recipient_user_id": inst_user_id,
                "title": "Class Reschedule Approved",
                "message": f"Your request to shift {doc.get('slot_name')} class from {doc.get('original_date')} to {doc.get('rescheduled_date')} has been approved by Admin.",
                "type": "reschedule_approved",
                "link": "/instructor/classroom",
                "is_read": False,
                "created_at": now
            })
    except Exception as inst_err:
        print(f"Error notifying instructor: {inst_err}")

    # 2. Notify Enrolled Students in this Slot
    try:
        slot_id_val = doc.get("slot_id")
        slot_query = {
            "$or": [
                {"slot_id": ObjectId(slot_id_val) if ObjectId.is_valid(slot_id_val) else slot_id_val},
                {"slot": doc.get("slot_name")},
                {"slot": doc.get("slot_days")}
            ]
        }
        async for s in db.students.find(slot_query):
            user_id = s.get("user_id")
            if user_id:
                await db.notifications.insert_one({
                    "recipient_user_id": str(user_id),
                    "title": "Class Schedule Update",
                    "message": f"Your class for {doc.get('slot_name')} has been rescheduled to {doc.get('rescheduled_date')} upon instructor's request.",
                    "type": "reschedule_student_alert",
                    "link": "/student/classroom",
                    "is_read": False,
                    "created_at": now
                })
    except Exception as std_err:
        print(f"Error notifying students: {std_err}")

    updated = await db.reschedules.find_one({"_id": ObjectId(id)})
    return _clean_doc(updated)


@router.patch("/{id}/decline", summary="Admin declines class reschedule request")
async def decline_reschedule_request(
    id: str,
    current_user: dict = Depends(require_roles(["admin", "superadmin"]))
):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")

    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID")

    doc = await db.reschedules.find_one({"_id": ObjectId(id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Reschedule request not found")

    now = datetime.now(timezone.utc)
    admin_name = current_user.get("full_name") or current_user.get("username")

    await db.reschedules.update_one(
        {"_id": ObjectId(id)},
        {"$set": {
            "status": "Declined",
            "reviewed_by": admin_name,
            "reviewed_at": now,
            "updated_at": now
        }}
    )

    # Notify Instructor
    try:
        inst_user_id = doc.get("instructor_id")
        if inst_user_id:
            await db.notifications.insert_one({
                "recipient_user_id": inst_user_id,
                "title": "Class Reschedule Declined",
                "message": f"Your request to shift {doc.get('slot_name')} class from {doc.get('original_date')} to {doc.get('rescheduled_date')} was declined by Admin.",
                "type": "reschedule_declined",
                "link": "/instructor/classroom",
                "is_read": False,
                "created_at": now
            })
    except Exception as inst_err:
        print(f"Error notifying instructor of decline: {inst_err}")

    updated = await db.reschedules.find_one({"_id": ObjectId(id)})
    return _clean_doc(updated)

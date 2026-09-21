from datetime import datetime
from typing import Optional, List
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from app.database import get_db
from app.core.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


class BroadcastNotificationRequest(BaseModel):
    title: str
    message: str
    target_group: Optional[str] = "all"
    target_role: Optional[str] = None
    recipient_user_ids: Optional[List[str]] = None
    target_user_id: Optional[str] = None


def _format_notification(doc: dict) -> dict:
    doc["id"] = str(doc["_id"])
    doc["_id"] = str(doc["_id"])
    if doc.get("recipient_user_id"):
        doc["recipient_user_id"] = str(doc["recipient_user_id"])
    if doc.get("user_id"):
        doc["user_id"] = str(doc["user_id"])
    if doc.get("sender_user_id"):
        doc["sender_user_id"] = str(doc["sender_user_id"])
    return doc


@router.get("/", summary="Get all in-app notifications for current user")
async def get_my_notifications(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_oid = current_user["_id"]
    notifications = []
    async for doc in db.notifications.find({
        "$or": [{"recipient_user_id": user_oid}, {"user_id": user_oid}]
    }).sort("created_at", -1).limit(50):
        notifications.append(_format_notification(doc))
    return notifications


@router.patch("/{id}/read", summary="Mark a single notification as read")
async def mark_notification_read(id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        notif_oid = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid notification ID.")

    res = await db.notifications.update_one(
        {
            "_id": notif_oid,
            "$or": [{"recipient_user_id": current_user["_id"]}, {"user_id": current_user["_id"]}]
        },
        {"$set": {"is_read": True, "read_at": datetime.utcnow()}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found.")
    return {"message": "Notification marked as read."}


@router.patch("/read-all", summary="Mark all notifications as read")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    db = get_db()
    await db.notifications.update_many(
        {
            "$or": [{"recipient_user_id": current_user["_id"]}, {"user_id": current_user["_id"]}],
            "is_read": False
        },
        {"$set": {"is_read": True, "read_at": datetime.utcnow()}}
    )
    return {"message": "All notifications marked as read."}


@router.post("/broadcast", summary="Dispatch custom broadcast notification / announcement (Admin Only)")
async def broadcast_notification(
    payload: BroadcastNotificationRequest,
    admin_user: dict = Depends(require_admin)
):
    """
    Dispatch custom announcement from Admin to:
    - target_group 'all': All Students and Instructors
    - target_group 'students': All Students
    - target_group 'instructors': All Instructors
    - target_group 'specific': Specific recipient user IDs
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database service unavailable.")

    if not payload.title or not payload.message:
        raise HTTPException(status_code=400, detail="Title and message content are required.")

    target_grp = payload.target_group or payload.target_role or "all"
    if target_grp in ["student", "students"]:
        target_grp = "students"
    elif target_grp in ["instructor", "instructors"]:
        target_grp = "instructors"

    recip_ids = payload.recipient_user_ids or []
    if payload.target_user_id:
        recip_ids.append(payload.target_user_id)

    query = {}
    if target_grp == "students":
        query = {"role": "student", "is_active": True}
    elif target_grp == "instructors":
        query = {"role": "instructor", "is_active": True}
    elif target_grp == "specific" and recip_ids:
        oids = []
        for uid in recip_ids:
            try:
                oids.append(ObjectId(uid))
            except Exception:
                pass
        query = {"_id": {"$in": oids}}
    elif target_grp == "all":
        query = {"role": {"$in": ["student", "instructor"]}, "is_active": True}
    else:
        query = {"role": {"$in": ["student", "instructor"]}, "is_active": True}

    recipients = []
    async for u in db.users.find(query, {"_id": 1}):
        recipients.append(u["_id"])

    if not recipients:
        raise HTTPException(status_code=404, detail="No matching active recipient accounts found.")

    now = datetime.utcnow()
    docs = []
    for r_oid in recipients:
        docs.append({
            "recipient_user_id": r_oid,
            "user_id": r_oid,
            "sender_user_id": admin_user["_id"],
            "sender_role": "admin",
            "type": "admin_announcement",
            "title": payload.title.strip(),
            "message": payload.message.strip(),
            "target_group": payload.target_group,
            "is_read": False,
            "created_at": now
        })

    if docs:
        await db.notifications.insert_many(docs)

    return {
        "message": f"Custom announcement successfully dispatched to {len(docs)} users.",
        "recipient_count": len(docs)
    }


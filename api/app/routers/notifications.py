from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, status
from app.database import get_db
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


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
